import { X509Certificate } from "crypto";
import { SAML, ValidateInResponseTo, generateServiceProviderMetadata, type CacheItem, type CacheProvider, type Profile } from "@node-saml/node-saml";
import type { SsoUser, UserRole } from "./types";

const emailNameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";
const defaultMetadataPath = "/api/saml/metadata";
const defaultAcsPath = "/api/saml/acs";
const defaultLogoutPath = "/api/saml/logout";
const localRedirectFallback = "/forms";
const metadataCacheTtlMs = 5 * 60 * 1000;
const defaultRequestTtlMs = 5 * 60 * 1000;
export const SAML_LOGIN_COOKIE = "costaatt_saml_login";
export const SAML_NAMEID_COOKIE = "costaatt_saml_nameid";
export const SAML_NAMEID_FORMAT_COOKIE = "costaatt_saml_nameid_format";
export const SAML_SESSION_INDEX_COOKIE = "costaatt_saml_session_index";
const safeRoleValues = new Set<UserRole>(["student", "advisor", "lecturer"]);
const applicationRoles = new Set<UserRole>([
  "student",
  "advisor",
  "lecturer",
  "registry_staff",
  "registry_admin",
  "system_admin",
  "form_creator",
  "form_manager",
  "reviewer",
  "approver"
]);

const roleAliases: Record<string, UserRole> = {
  student: "student",
  advisor: "advisor",
  lecturer: "lecturer",
  registry: "registry_staff",
  staff: "registry_staff",
  registry_staff: "registry_staff",
  admin: "registry_admin",
  registry_admin: "registry_admin",
  system_admin: "system_admin",
  form_creator: "form_creator",
  form_manager: "form_manager",
  reviewer: "reviewer",
  approver: "approver"
};

export type SamlRuntimeConfig = {
  baseUrl: string;
  issuer: string;
  callbackUrl: string;
  logoutCallbackUrl: string;
  idpEntityId?: string;
  entryPoint?: string;
  entryPointBinding?: string;
  logoutUrl?: string;
  logoutBinding?: string;
  idpCert: string | string[];
  identifierFormat: string;
  requireSignedAssertions: boolean;
  signAuthnRequests: boolean;
  validateInResponseTo: ValidateInResponseTo;
  acceptedClockSkewMs: number;
  maxAssertionAgeMs: number;
  requestIdExpirationPeriodMs: number;
  spPrivateKey?: string;
  spCert?: string;
};

type SamlService = {
  binding: string;
  location: string;
};

export type IdpMetadataInspection = {
  entityId?: string;
  ssoServices: SamlService[];
  sloServices: SamlService[];
  signingCertificateCount: number;
  certificateExpiries: Array<string | null>;
  nameIdFormats: string[];
};

type IdpMetadata = IdpMetadataInspection & {
  entryPoint?: string;
  entryPointBinding?: string;
  logoutUrl?: string;
  logoutBinding?: string;
  idpCert?: string | string[];
};

type MetadataCacheEntry = {
  url: string;
  fetchedAt: number;
  metadata: IdpMetadata;
};

let metadataCache: MetadataCacheEntry | undefined;

class SharedRequestCache implements CacheProvider {
  private readonly items = new Map<string, CacheItem>();

  async saveAsync(key: string, value: string) {
    this.prune();
    if (this.items.has(key)) return null;
    const item = { value, createdAt: Date.now() };
    this.items.set(key, item);
    return item;
  }

  async getAsync(key: string) {
    this.prune();
    return this.items.get(key)?.value || null;
  }

  async removeAsync(key: string | null) {
    if (key) this.items.delete(key);
    return key && !this.items.has(key) ? key : null;
  }

  private prune() {
    const cutoff = Date.now() - requestTtlMs();
    for (const [key, item] of this.items) {
      if (item.createdAt < cutoff) this.items.delete(key);
    }
  }
}

const sharedRequestCache = new SharedRequestCache();

export function samlEnabled() {
  return process.env.SAML_ENABLED === "true";
}

export async function samlRuntimeConfig(options: { loadIdpMetadata?: boolean; validateInResponseTo?: ValidateInResponseTo } = {}): Promise<SamlRuntimeConfig> {
  const baseUrl = normalizedBaseUrl();
  const explicitIdpConfig = Boolean(process.env.SAML_IDP_ENTITY_ID && process.env.SAML_IDP_SSO_URL && process.env.SAML_IDP_CERT);
  const metadataUrl = process.env.SAML_IDP_METADATA_URL;
  const shouldLoadMetadata = options.loadIdpMetadata !== false && !explicitIdpConfig && Boolean(metadataUrl);
  const metadata: IdpMetadata = !shouldLoadMetadata
    ? emptyMetadata()
    : await fetchIdpMetadata(metadataUrl as string);
  const issuer = process.env.SAML_SP_ENTITY_ID || `${baseUrl}${defaultMetadataPath}`;
  const callbackUrl = process.env.SAML_ACS_URL || `${baseUrl}${defaultAcsPath}`;
  const logoutCallbackUrl = process.env.SAML_LOGOUT_URL || `${baseUrl}${defaultLogoutPath}`;
  const idpCert = certificateList(process.env.SAML_IDP_CERT) || metadata.idpCert || "";
  const entryPoint = process.env.SAML_IDP_SSO_URL || metadata.entryPoint;
  const entryPointBinding = process.env.SAML_IDP_SSO_BINDING || metadata.entryPointBinding;
  const logoutUrl = process.env.SAML_IDP_LOGOUT_URL || metadata.logoutUrl;
  const logoutBinding = process.env.SAML_IDP_LOGOUT_BINDING || metadata.logoutBinding;

  return {
    baseUrl,
    issuer,
    callbackUrl,
    logoutCallbackUrl,
    idpEntityId: process.env.SAML_IDP_ENTITY_ID || metadata.entityId,
    entryPoint,
    entryPointBinding,
    logoutUrl,
    logoutBinding,
    idpCert,
    identifierFormat: process.env.SAML_NAMEID_FORMAT || emailNameIdFormat,
    requireSignedAssertions: process.env.SAML_REQUIRE_SIGNED_ASSERTIONS !== "false",
    signAuthnRequests: process.env.SAML_SIGN_AUTHN_REQUESTS === "true",
    validateInResponseTo: options.validateInResponseTo || ValidateInResponseTo.ifPresent,
    acceptedClockSkewMs: numericEnv("SAML_ACCEPTED_CLOCK_SKEW_MS", 0),
    maxAssertionAgeMs: numericEnv("SAML_MAX_ASSERTION_AGE_MS", defaultRequestTtlMs),
    requestIdExpirationPeriodMs: numericEnv("SAML_REQUEST_TTL_MS", defaultRequestTtlMs),
    spPrivateKey: normalizeMultilineSecret(process.env.SAML_SP_PRIVATE_KEY),
    spCert: normalizeMultilineSecret(process.env.SAML_SP_CERT)
  };
}

export async function samlClient(options: { validateInResponseTo?: ValidateInResponseTo } = {}) {
  const config = await samlRuntimeConfig(options);
  if (!config.entryPoint) throw new Error("SAML_IDP_SSO_URL or SAML_IDP_METADATA_URL with an SSO service is required.");
  if (!config.idpEntityId) throw new Error("SAML_IDP_ENTITY_ID or SAML_IDP_METADATA_URL with an EntityDescriptor is required.");
  if (!config.idpCert) throw new Error("SAML_IDP_CERT or SAML_IDP_METADATA_URL with a signing certificate is required.");
  if (config.signAuthnRequests && !config.spPrivateKey) throw new Error("SAML_SP_PRIVATE_KEY is required when SAML_SIGN_AUTHN_REQUESTS=true.");

  return new SAML({
    issuer: config.issuer,
    callbackUrl: config.callbackUrl,
    entryPoint: config.entryPoint,
    logoutUrl: config.logoutUrl || "",
    logoutCallbackUrl: config.logoutCallbackUrl,
    idpCert: config.idpCert,
    idpIssuer: config.idpEntityId,
    audience: config.issuer,
    identifierFormat: config.identifierFormat,
    wantAssertionsSigned: config.requireSignedAssertions,
    wantAuthnResponseSigned: false,
    validateInResponseTo: config.validateInResponseTo,
    acceptedClockSkewMs: config.acceptedClockSkewMs,
    maxAssertionAgeMs: config.maxAssertionAgeMs,
    requestIdExpirationPeriodMs: config.requestIdExpirationPeriodMs,
    cacheProvider: sharedRequestCache,
    disableRequestedAuthnContext: true,
    privateKey: config.signAuthnRequests ? config.spPrivateKey : undefined,
    publicCert: config.spCert,
    signatureAlgorithm: "sha256"
  });
}

export async function generateSamlMetadata() {
  const config = await samlRuntimeConfig({ loadIdpMetadata: false });
  return generateServiceProviderMetadata({
    issuer: config.issuer,
    callbackUrl: config.callbackUrl,
    logoutCallbackUrl: config.logoutCallbackUrl,
    identifierFormat: config.identifierFormat,
    wantAssertionsSigned: config.requireSignedAssertions,
    privateKey: config.signAuthnRequests ? config.spPrivateKey : undefined,
    publicCerts: config.spCert || null,
    signatureAlgorithm: "sha256"
  });
}

export function profileToSsoUser(profile: Profile): SsoUser {
  const studentId = firstValue(profile.studentId, profile.sAMAccountName, profile.student_id, profile.uid, profile.employeeNumber);
  const firstName = firstValue(profile.firstName, profile.givenName, profile.given_name, profile["urn:oid:2.5.4.42"]);
  const lastName = firstValue(profile.lastName, profile.lastname, profile.family_name, profile.sn, profile.surname, profile["urn:oid:2.5.4.4"]);
  const email = firstValue(profile.email, profile.emailaddress, profile.mail, profile["urn:oid:0.9.2342.19200300.100.1.3"], profile.nameID);
  const roles = parseRoles(profile.roles ?? profile.role ?? profile.groups);

  if (!studentId || !firstName || !lastName || !email) {
    throw new Error("SAML response is missing one or more required attributes: studentId, firstName, lastName, email.");
  }

  return {
    studentId,
    firstName,
    lastName,
    email,
    roles: uniqueRoles(["student", ...roles])
  };
}

export function safeRelayState(value?: string | null) {
  const fallbackCandidate = process.env.SAML_DEFAULT_REDIRECT || localRedirectFallback;
  const fallback = isSafeRelativeRedirect(fallbackCandidate) ? fallbackCandidate : localRedirectFallback;
  if (!value || !isSafeRelativeRedirect(value)) return fallback;
  return value;
}

export function samlLoginUrl(target: string) {
  return `/api/saml/login?redirect=${encodeURIComponent(safeRelayState(target))}`;
}

export function publicBaseUrl() {
  return normalizedBaseUrl();
}

export function selectSsoBinding(config: Pick<SamlRuntimeConfig, "entryPointBinding">) {
  return config.entryPointBinding || "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect";
}

export function selectSloBinding(config: Pick<SamlRuntimeConfig, "logoutBinding">) {
  return config.logoutBinding || "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect";
}

export function isSloConfigured(config: Pick<SamlRuntimeConfig, "logoutUrl">) {
  return Boolean(config.logoutUrl);
}

export function inspectSamlMetadata(xml: string): IdpMetadataInspection {
  const descriptor = extractFirstBlock(xml, "IDPSSODescriptor") || xml;
  const entityId = parseAttributes(firstOpeningTag(xml, "EntityDescriptor") || "").entityID;
  const ssoServices = extractServices(descriptor, "SingleSignOnService");
  const sloServices = extractServices(descriptor, "SingleLogoutService");
  const nameIdFormats = extractTagTexts(descriptor, "NameIDFormat");
  const certificates = metadataCertificates(descriptor);

  return {
    entityId,
    ssoServices,
    sloServices,
    signingCertificateCount: certificates.length,
    certificateExpiries: certificates.map(certificateExpiry)
      .filter((expiry, index, all) => all.indexOf(expiry) === index),
    nameIdFormats
  };
}

async function fetchIdpMetadata(url: string): Promise<IdpMetadata> {
  if (metadataCache?.url === url && Date.now() - metadataCache.fetchedAt < metadataCacheTtlMs) return metadataCache.metadata;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Could not fetch SAML IdP metadata from ${url}.`);
  const xml = await response.text();
  const metadata = inspectSamlMetadata(xml);
  const entryPointService = chooseService(metadata.ssoServices, process.env.SAML_IDP_SSO_BINDING);
  const logoutService = chooseService(metadata.sloServices, process.env.SAML_IDP_LOGOUT_BINDING);
  const descriptor = extractFirstBlock(xml, "IDPSSODescriptor") || "";
  const certificates = metadataCertificates(descriptor);
  const parsed: IdpMetadata = {
    ...metadata,
    entryPoint: entryPointService?.location,
    entryPointBinding: entryPointService?.binding,
    logoutUrl: logoutService?.location,
    logoutBinding: logoutService?.binding,
    idpCert: certificates.length > 0 ? certificates : undefined
  };
  metadataCache = { url, fetchedAt: Date.now(), metadata: parsed };
  return parsed;
}

function emptyMetadata(): IdpMetadata {
  return { ssoServices: [], sloServices: [], signingCertificateCount: 0, certificateExpiries: [], nameIdFormats: [] };
}

function metadataCertificates(descriptor: string) {
  const signingBlocks = extractBlocks(descriptor, "KeyDescriptor").filter((block) => parseAttributes(block.opening).use?.toLowerCase() === "signing");
  const certificateBlocks = signingBlocks.length > 0 ? signingBlocks : extractBlocks(descriptor, "KeyDescriptor");
  const certificateValues = certificateBlocks.flatMap((block) => extractTagTexts(block.body, "X509Certificate"));
  const fallbackCertificates = certificateValues.length > 0 ? certificateValues : extractTagTexts(descriptor, "X509Certificate");
  return fallbackCertificates.map(certificateFromBase64).filter((value): value is string => Boolean(value));
}

function extractServices(xml: string, name: string): SamlService[] {
  return extractOpeningTags(xml, name).map((opening) => {
    const attributes = parseAttributes(opening);
    return { binding: attributes.Binding || "", location: attributes.Location || "" };
  }).filter((service) => service.binding && service.location);
}

function chooseService(services: SamlService[], requestedBinding?: string) {
  if (requestedBinding) return services.find((service) => service.binding === requestedBinding);
  return services.find((service) => service.binding.endsWith(":HTTP-Redirect")) || services.find((service) => service.binding.endsWith(":HTTP-POST")) || services[0];
}

function extractOpeningTags(xml: string, name: string) {
  const pattern = new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${name}\\b[^>]*>`, "gi");
  return Array.from(xml.matchAll(pattern), (match) => match[0]);
}

function extractTagMatches(xml: string, name: string) {
  const pattern = new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${name}\\b[^>]*>`, "gi");
  return Array.from(xml.matchAll(pattern), (match) => ({ opening: match[0], index: match.index ?? 0 }));
}

function firstOpeningTag(xml: string, name: string) {
  return extractOpeningTags(xml, name)[0];
}

function extractFirstBlock(xml: string, name: string) {
  const opening = firstOpeningTag(xml, name);
  if (!opening) return "";
  const prefix = opening.match(/^<([A-Za-z_][\w.-]*:)?/)?.[1] || "";
  const closing = new RegExp(`</${escapeRegExp(prefix)}${name}\\s*>`, "i");
  const start = xml.indexOf(opening) + opening.length;
  const remainder = xml.slice(start);
  const match = remainder.match(closing);
  if (!match || match.index === undefined) return xml;
  return `${opening}${remainder.slice(0, match.index)}${match[0]}`;
}

function extractBlocks(xml: string, name: string) {
  const blocks: Array<{ opening: string; body: string }> = [];
  for (const tag of extractTagMatches(xml, name)) {
    const opening = tag.opening;
    const prefix = opening.match(/^<([A-Za-z_][\w.-]*:)?/)?.[1] || "";
    const start = tag.index + opening.length;
    const closing = new RegExp(`</${escapeRegExp(prefix)}${name}\\s*>`, "i");
    const remainder = xml.slice(start);
    const match = remainder.match(closing);
    if (match && match.index !== undefined) blocks.push({ opening, body: remainder.slice(0, match.index) });
  }
  return blocks;
}

function extractTagTexts(xml: string, name: string) {
  const values: string[] = [];
  for (const tag of extractTagMatches(xml, name)) {
    const opening = tag.opening;
    const prefix = opening.match(/^<([A-Za-z_][\w.-]*:)?/)?.[1] || "";
    const start = tag.index + opening.length;
    const closing = new RegExp(`</${escapeRegExp(prefix)}${name}\\s*>`, "i");
    const match = xml.slice(start).match(closing);
    if (match && match.index !== undefined) values.push(xml.slice(start, start + match.index).replace(/<!\[CDATA\[|\]\]>/g, "").trim());
  }
  return values.filter(Boolean);
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  for (const match of tag.matchAll(/([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/g)) attributes[match[1]] = decodeXmlEntities(match[3]);
  return attributes;
}

function decodeXmlEntities(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function certificateFromBase64(value: string) {
  const raw = value.replace(/\s+/g, "");
  if (!raw) return undefined;
  return `-----BEGIN CERTIFICATE-----\n${raw}\n-----END CERTIFICATE-----`;
}

function certificateList(value?: string): string[] | undefined {
  const raw = normalizeMultilineSecret(value);
  if (!raw) return undefined;
  const matches = Array.from(raw.matchAll(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)).map((match) => match[0]);
  return matches.length > 0 ? matches : [certificateFromBase64(raw)].filter((certificate): certificate is string => Boolean(certificate));
}

function certificateExpiry(certificate: string) {
  try {
    const validTo = new X509Certificate(certificate).validTo;
    return validTo ? new Date(validTo).toISOString() : null;
  } catch {
    return null;
  }
}

function normalizedBaseUrl() {
  const baseUrl = process.env.SAML_PUBLIC_BASE_URL || process.env.PORTAL_BASE_URL || "http://localhost:5001";
  return baseUrl.replace(/\/$/, "");
}

function numericEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function requestTtlMs() {
  return numericEnv("SAML_REQUEST_TTL_MS", defaultRequestTtlMs);
}

function firstValue(...values: unknown[]): string {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstValue(...value);
      if (nested) return nested;
    }
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseRoles(value: unknown): UserRole[] {
  const roleMap = roleGroupMap();
  if (Array.isArray(value)) return uniqueRoles(value.flatMap((item) => parseRoles(item)));
  if (typeof value !== "string" || !value.trim()) return [];

  const rawValue = value.trim();
  const mapped = Object.entries(roleMap).flatMap(([role, groups]) => groups.some((group) => group === rawValue.toLowerCase()) ? [role as UserRole] : []);
  if (mapped.length > 0) return mapped;

  const candidates = rawValue.includes("=")
    ? [rawValue]
    : rawValue.split(/[|;\n]/).map((item) => item.trim()).filter(Boolean);
  return uniqueRoles(candidates.flatMap((candidate) => {
    const alias = roleAliases[candidate.toLowerCase()];
    return alias && (safeRoleValues.has(alias) || process.env.SAML_TRUSTED_APPLICATION_ROLES === "true") ? [alias] : [];
  }));
}

function roleGroupMap(): Record<string, string[]> {
  const raw = process.env.SAML_ROLE_GROUP_MAP?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).flatMap(([role, groups]) => {
      if (!applicationRoles.has(role as UserRole) || !Array.isArray(groups)) return [];
      const normalizedGroups = groups.filter((group): group is string => typeof group === "string" && Boolean(group.trim())).map((group) => group.trim().toLowerCase());
      return normalizedGroups.length > 0 ? [[role, normalizedGroups]] : [];
    }));
  } catch {
    throw new Error("SAML_ROLE_GROUP_MAP must be valid JSON mapping application roles to AD group names.");
  }
}

function uniqueRoles(roles: UserRole[]) {
  return Array.from(new Set(roles));
}

function isSafeRelativeRedirect(value: string) {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n\u0000]/.test(value)) return false;
  try {
    return new URL(value, normalizedBaseUrl()).origin === new URL(normalizedBaseUrl()).origin;
  } catch {
    return false;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMultilineSecret(value?: string) {
  return value?.replace(/\\n/g, "\n").trim() || undefined;
}
