import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SsoUser } from "../lib/types";

const demoUser: SsoUser = {
  studentId: "00012345",
  firstName: "Asha",
  lastName: "Student",
  email: "asha.student@costaatt.edu.tt",
  roles: ["student"]
};

function jwt(claims: Record<string, unknown>, secret: string, algorithm = "HS256") {
  const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

afterEach(() => {
  vi.resetModules();
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
  delete process.env.SSO_SHARED_SECRET;
  delete process.env.QUICKLAUNCH_JWT_SECRET;
  delete process.env.QUICKLAUNCH_JWT_ISSUER;
  delete process.env.QUICKLAUNCH_JWT_AUDIENCE;
  delete process.env.QUICKLAUNCH_JWT_CLOCK_TOLERANCE_SECONDS;
});

describe("portal authentication", () => {
  it("rejects malformed signed tokens without throwing", async () => {
    process.env.SSO_SHARED_SECRET = "a-secure-shared-secret-for-testing";
    const { verifySsoToken } = await import("../lib/auth");

    expect(() => verifySsoToken("body.short")).not.toThrow();
    expect(verifySsoToken("body.short")).toBeNull();
  });

  it("does not accept the development signing secret in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const { createSsoToken, verifySsoToken } = await import("../lib/auth");
    const token = createSsoToken(demoUser);

    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(verifySsoToken(token)).toBeNull();
  });

  it("accepts a valid QuickLaunch HS256 token with expected claims", async () => {
    const secret = "quicklaunch-test-secret-that-is-long-enough";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.QUICKLAUNCH_JWT_SECRET = secret;
    process.env.QUICKLAUNCH_JWT_ISSUER = "https://quicklaunch.example.edu";
    process.env.QUICKLAUNCH_JWT_AUDIENCE = "costaatt-eforms";
    const { verifyQuickLaunchJwt } = await import("../lib/auth");
    const token = jwt({
      ...demoUser,
      iss: process.env.QUICKLAUNCH_JWT_ISSUER,
      aud: process.env.QUICKLAUNCH_JWT_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300
    }, secret);

    expect(verifyQuickLaunchJwt(token)).toMatchObject({
      studentId: demoUser.studentId,
      email: demoUser.email,
      roles: ["student"]
    });
  });

  it("rejects expired, wrong-algorithm, and wrong-audience QuickLaunch tokens", async () => {
    const secret = "quicklaunch-test-secret-that-is-long-enough";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.QUICKLAUNCH_JWT_SECRET = secret;
    process.env.QUICKLAUNCH_JWT_AUDIENCE = "costaatt-eforms";
    process.env.QUICKLAUNCH_JWT_CLOCK_TOLERANCE_SECONDS = "0";
    const { verifyQuickLaunchJwt } = await import("../lib/auth");
    const baseClaims = {
      ...demoUser,
      aud: "costaatt-eforms"
    };

    expect(verifyQuickLaunchJwt(jwt({
      ...baseClaims,
      exp: Math.floor(Date.now() / 1000) - 1
    }, secret))).toBeNull();
    expect(verifyQuickLaunchJwt(jwt({
      ...baseClaims,
      exp: Math.floor(Date.now() / 1000) + 300
    }, secret, "none"))).toBeNull();
    expect(verifyQuickLaunchJwt(jwt({
      ...baseClaims,
      aud: "another-application",
      exp: Math.floor(Date.now() / 1000) + 300
    }, secret))).toBeNull();
  });
});
