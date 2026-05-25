import crypto from "crypto";
import { cookies, headers } from "next/headers";
import type { SsoUser, UserRole } from "./types";

const COOKIE_NAME = "costaatt_sso";
const roleAliases: Record<string, UserRole> = {
  student: "student",
  advisor: "advisor",
  lecturer: "lecturer",
  registry: "registry_staff",
  staff: "registry_staff",
  registry_staff: "registry_staff",
  registry_admin: "registry_admin",
  admin: "registry_admin",
  system_admin: "system_admin"
};

function getSecret() {
  return process.env.SSO_SHARED_SECRET || "development-only-secret";
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSsoToken(user: SsoUser) {
  const body = base64url(JSON.stringify({ ...user, roles: normalizeRoles(user.roles), iat: Date.now() }));
  return `${body}.${signPayload(body)}`;
}

function decodeJson<T>(body: string): T | null {
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function normalizeRoles(roles?: string[]): UserRole[] {
  const normalized = (roles || ["student"])
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
  return {
    studentId: String(studentId),
    firstName: String(firstName),
    lastName: String(lastName),
    email: String(email),
    roles: normalizeRoles(roles.map(String))
  };
}

export function verifySsoToken(token?: string | null): SsoUser | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = signPayload(body);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  return mapClaims(decodeJson<Partial<SsoUser> & Record<string, unknown>>(body) || {});
}

export function verifyQuickLaunchJwt(token?: string | null): SsoUser | null {
  if (!token || token.split(".").length !== 3) return null;
  const [header, body, signature] = token.split(".");
  const expected = crypto
    .createHmac("sha256", process.env.QUICKLAUNCH_JWT_SECRET || getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return mapClaims(decodeJson<Partial<SsoUser> & Record<string, unknown>>(body) || {});
}

function userFromTrustedHeaders() {
  const source = headers();
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

export function hasAnyRole(user: SsoUser, roles: UserRole[]) {
  return Boolean(user.roles?.some((role) => roles.includes(role)));
}

export { COOKIE_NAME };
