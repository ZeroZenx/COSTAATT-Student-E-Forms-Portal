import crypto from "crypto";
import { cookies, headers } from "next/headers";
import type { SsoUser } from "./types";

const COOKIE_NAME = "costaatt_sso";

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
  const body = base64url(JSON.stringify({ ...user, iat: Date.now() }));
  return `${body}.${signPayload(body)}`;
}

export function verifySsoToken(token?: string | null): SsoUser | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = signPayload(body);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SsoUser>;
    if (!parsed.studentId || !parsed.firstName || !parsed.lastName || !parsed.email) return null;
    return {
      studentId: parsed.studentId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      roles: parsed.roles || []
    };
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const cookieToken = cookies().get(COOKIE_NAME)?.value;
  const bearer = headers().get("authorization")?.replace(/^Bearer\s+/i, "");
  const portalHeader = headers().get("x-portal-sso-token");
  return verifySsoToken(cookieToken || bearer || portalHeader);
}

export function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function isStaff(user: SsoUser) {
  return Boolean(user.roles?.some((role) => ["registry", "admin", "staff"].includes(role)));
}

export { COOKIE_NAME };
