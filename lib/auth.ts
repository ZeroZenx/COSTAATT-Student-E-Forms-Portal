import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { internalRolesForEmail } from "./internal-roles";
import type { SsoUser, UserRole } from "./types";

const COOKIE_NAME = "costaatt_sso";
const DEVELOPMENT_SECRET = "development-only-secret";
const roleAliases: Record<string, UserRole> = {
  student: "student",
  advisor: "advisor",
  lecturer: "lecturer",
  registry: "registry_staff",
  staff: "registry_staff",
  registry_staff: "registry_staff",
  registry_admin: "registry_admin",
  admin: "registry_admin",
  system_admin: "system_admin",
  form_creator: "form_creator",
  form_manager: "form_manager",
  reviewer: "reviewer",
  approver: "approver"
};

function getSecret() {
  return process.env.SSO_SHARED_SECRET || (process.env.NODE_ENV === "production" ? null : DEVELOPMENT_SECRET);
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string) {
  const secret = getSecret();
  if (!secret) throw new Error("SSO_SHARED_SECRET is required to create signed portal tokens.");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSsoToken(user: SsoUser) {
  const body = base64url(JSON.stringify({ ...user, roles: normalizeRoles(user.roles, user.email), iat: Date.now() }));
  return `${body}.${signPayload(body)}`;
}

function decodeJson<T>(body: string): T | null {
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function normalizeRoles(roles?: string[], email?: string): UserRole[] {
  const normalized = [...(roles || []), ...internalRolesForEmail(email), "student"]
    .map((role) => roleAliases[role.toLowerCase()])
    .filter((role): role is UserRole => Boolean(role));
  return Array.from(new Set(normalized.length > 0 ? normalized : ["student"]));
}

function mapClaims(parsed: Record<string, unknown>): SsoUser | null {
  const studentId = parsed.studentId || parsed["student_id"] || parsed["uid"];
  const firstName = parsed.firstName || parsed["given_name"];
  const lastName = parsed.lastName || parsed["family_name"];
  const email = parsed.email || parsed["mail"];
  const roles = Array.isArray(parsed.roles) ? parsed.roles.map(String) : typeof parsed.role === "string" ? [parsed.role] : [];

  if (!studentId || !firstName || !lastName || !email) return null;
  const normalizedEmail = normalizeLegacyEmail(String(email));
  return {
    studentId: normalizeLegacyStudentId(String(studentId), normalizedEmail),
    firstName: String(firstName),
    lastName: String(lastName),
    email: normalizedEmail,
    roles: normalizeRoles(roles.map(String), normalizedEmail)
  };
}

function normalizeLegacyEmail(email: string) {
  return email.toLowerCase() === "darren.headley@student.costaatt.edu.tt" ? "dheadley@costaatt.edu.tt" : email;
}

function normalizeLegacyStudentId(studentId: string, email: string) {
  return studentId === "00012345" && email.toLowerCase() === "dheadley@costaatt.edu.tt" ? "00012346" : studentId;
}

export function verifySsoToken(token?: string | null): SsoUser | null {
  const secret = getSecret();
  if (!secret || !token || token.split(".").length !== 2) return null;
  const [body, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  return mapClaims(decodeJson<Partial<SsoUser> & Record<string, unknown>>(body) || {});
}

export function verifyQuickLaunchJwt(token?: string | null): SsoUser | null {
  if (!token || token.split(".").length !== 3) return null;
  const [header, body, signature] = token.split(".");
  const jwtSecret = process.env.QUICKLAUNCH_JWT_SECRET || getSecret();
  if (!jwtSecret) return null;

  const parsedHeader = decodeJson<Record<string, unknown>>(header);
  if (!parsedHeader || parsedHeader.alg !== "HS256") return null;

  const expected = crypto
    .createHmac("sha256", jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  const claims = decodeJson<Partial<SsoUser> & Record<string, unknown>>(body);
  if (!claims || !validQuickLaunchClaims(claims)) return null;
  return mapClaims(claims);
}

function userFromTrustedHeaders() {
  const source = headers();
  if (!trustedClaimHeadersAuthorized(source.get(process.env.TRUSTED_SSO_PROXY_SECRET_HEADER || "x-sso-proxy-secret"))) {
    return null;
  }
  const studentId = source.get("x-sso-student-id") || undefined;
  const firstName = source.get("x-sso-first-name") || undefined;
  const lastName = source.get("x-sso-last-name") || undefined;
  const email = source.get("x-sso-email") || undefined;
  const roles = source.get("x-sso-roles")?.split(",").map((role) => role.trim());
  return mapClaims({ studentId, firstName, lastName, email, roles });
}

export function getCurrentUser() {
  const cookieToken = cookies().get(COOKIE_NAME)?.value;
  const bearer = headers().get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerName = process.env.TRUSTED_SSO_HEADER_NAME || "x-portal-sso-token";
  const portalHeader = headers().get(headerName);
  const mode = process.env.TRUSTED_SSO_HEADER_MODE || "signed-token";

  return (
    verifySsoToken(cookieToken) ||
    verifyQuickLaunchJwt(bearer) ||
    verifyQuickLaunchJwt(portalHeader) ||
    verifySsoToken(portalHeader) ||
    (mode === "claims" ? userFromTrustedHeaders() : null)
  );
}

export function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function isStaff(user: SsoUser) {
  return hasAnyRole(user, ["registry_staff", "registry_admin", "system_admin"]);
}

export function isRegistryAdmin(user: SsoUser) {
  return hasAnyRole(user, ["registry_admin", "system_admin"]);
}

export function isFormStaff(user: SsoUser) {
  return hasAnyRole(user, ["form_creator", "form_manager", "registry_admin", "system_admin"]);
}

export function isReviewer(user: SsoUser) {
  return hasAnyRole(user, ["advisor", "lecturer", "reviewer", "approver", "registry_admin", "system_admin"]);
}

export function hasAnyRole(user: SsoUser, roles: UserRole[]) {
  return Boolean(user.roles?.some((role) => roles.includes(role)));
}

function validQuickLaunchClaims(claims: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  const tolerance = Number(process.env.QUICKLAUNCH_JWT_CLOCK_TOLERANCE_SECONDS || 60);
  const expiresAt = numericClaim(claims.exp);
  const notBefore = numericClaim(claims.nbf);

  if (expiresAt === null || notBefore === null) return false;
  if (process.env.NODE_ENV === "production" && expiresAt === undefined) return false;
  if (expiresAt !== undefined && expiresAt <= now - tolerance) return false;
  if (notBefore !== undefined && notBefore > now + tolerance) return false;

  const expectedIssuer = process.env.QUICKLAUNCH_JWT_ISSUER?.trim();
  if (expectedIssuer && claims.iss !== expectedIssuer) return false;

  const expectedAudience = process.env.QUICKLAUNCH_JWT_AUDIENCE?.trim();
  if (expectedAudience && !claimAudience(claims.aud).includes(expectedAudience)) return false;

  return true;
}

function numericClaim(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function claimAudience(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  return typeof value === "string" ? [value] : [];
}

function trustedClaimHeadersAuthorized(provided?: string | null) {
  const expected = process.env.TRUSTED_SSO_PROXY_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  return Boolean(provided && safeEqual(provided, expected));
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export { COOKIE_NAME };
