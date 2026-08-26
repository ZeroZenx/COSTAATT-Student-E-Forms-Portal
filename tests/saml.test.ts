import { afterEach, describe, expect, it } from "vitest";
import type { Profile } from "@node-saml/node-saml";

afterEach(() => {
  delete process.env.SAML_DEFAULT_REDIRECT;
  delete process.env.SAML_PUBLIC_BASE_URL;
  delete process.env.SAML_SP_ENTITY_ID;
  delete process.env.SAML_ACS_URL;
  delete process.env.SAML_LOGOUT_URL;
  delete process.env.SAML_NAMEID_FORMAT;
  delete process.env.SAML_ROLE_GROUP_MAP;
  delete process.env.SAML_TRUSTED_APPLICATION_ROLES;
  delete process.env.SAML_IDP_ENTITY_ID;
  delete process.env.SAML_IDP_SSO_URL;
  delete process.env.SAML_IDP_CERT;
});

describe("SAML SSO helpers", () => {
  it("maps QuickLaunch claim names and casing into the portal SSO user", async () => {
    const { profileToSsoUser } = await import("../lib/saml");
    const user = profileToSsoUser({
      studentId: "00012346",
      firstName: "Darren",
      lastName: "Headley",
      email: "dheadley@costaatt.edu.tt",
      roles: ["student", "advisor"]
    } as unknown as Profile);

    expect(user).toEqual({
      studentId: "00012346",
      firstName: "Darren",
      lastName: "Headley",
      email: "dheadley@costaatt.edu.tt",
      roles: ["student", "advisor"]
    });
  });

  it("accepts QuickLaunch's exact AD-backed attribute names", async () => {
    const { profileToSsoUser } = await import("../lib/saml");
    expect(profileToSsoUser({
      sAMAccountName: "00012346",
      givenName: "Darren",
      lastname: "Headley",
      emailaddress: "dheadley@costaatt.edu.tt"
    } as unknown as Profile)).toMatchObject({
      studentId: "00012346",
      firstName: "Darren",
      lastName: "Headley",
      email: "dheadley@costaatt.edu.tt",
      roles: ["student"]
    });
  });

  it("does not elevate arbitrary Memberof values and supports explicit group mappings", async () => {
    const { profileToSsoUser } = await import("../lib/saml");
    const group = "CN=EForms Registry Admin,OU=Groups,DC=costaatt,DC=edu,DC=tt";
    const profile = { studentId: "00012346", firstName: "Darren", lastName: "Headley", email: "dheadley@costaatt.edu.tt", roles: [group] } as unknown as Profile;

    expect(profileToSsoUser(profile).roles).toEqual(["student"]);
    process.env.SAML_ROLE_GROUP_MAP = JSON.stringify({ registry_admin: [group] });
    expect(profileToSsoUser(profile).roles).toEqual(["student", "registry_admin"]);
  });

  it("falls back to NameID for email and rejects missing required attributes", async () => {
    const { profileToSsoUser } = await import("../lib/saml");

    expect(profileToSsoUser({
      student_id: "00012346",
      given_name: "Darren",
      family_name: "Headley",
      nameID: "dheadley@costaatt.edu.tt"
    } as unknown as Profile).email).toBe("dheadley@costaatt.edu.tt");

    expect(() => profileToSsoUser({
      firstName: "Darren",
      lastName: "Headley",
      email: "dheadley@costaatt.edu.tt"
    } as unknown as Profile)).toThrow("SAML response is missing");
  });

  it("keeps RelayState redirects local", async () => {
    const { safeRelayState, samlLoginUrl } = await import("../lib/saml");

    expect(safeRelayState("/student/dashboard")).toBe("/student/dashboard");
    expect(safeRelayState("https://attacker.example")).toBe("/forms");
    expect(safeRelayState("//attacker.example/path")).toBe("/forms");
    expect(safeRelayState("/\\\\attacker.example/path")).toBe("/forms");
    expect(samlLoginUrl("/forms/registration?semester=1")).toBe("/api/saml/login?redirect=%2Fforms%2Fregistration%3Fsemester%3D1");
    expect(samlLoginUrl("https://attacker.example")).toBe("/api/saml/login?redirect=%2Fforms");
  });

  it("inspects IdP metadata without exposing certificate contents", async () => {
    const { inspectSamlMetadata } = await import("../lib/saml");
    const metadata = inspectSamlMetadata(`
      <md:EntityDescriptor entityID="https://idp.example.test/entity">
        <md:IDPSSODescriptor>
          <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.example.test/sso"/>
          <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.example.test/slo"/>
          <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
          <md:KeyDescriptor use="signing"><ds:KeyInfo><ds:X509Data><ds:X509Certificate>ZmFrZQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor>
        </md:IDPSSODescriptor>
      </md:EntityDescriptor>`);

    expect(metadata.entityId).toBe("https://idp.example.test/entity");
    expect(metadata.ssoServices).toEqual([{ binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect", location: "https://idp.example.test/sso" }]);
    expect(metadata.sloServices[0].location).toBe("https://idp.example.test/slo");
    expect(metadata.signingCertificateCount).toBe(1);
    expect(metadata.certificateExpiries).toEqual([null]);
    expect(metadata.nameIdFormats).toEqual(["urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"]);
  });

  it("does not invent an IdP logout endpoint", async () => {
    process.env.SAML_IDP_ENTITY_ID = "https://idp.example.test/entity";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.test/sso";
    process.env.SAML_IDP_CERT = "-----BEGIN CERTIFICATE-----\\nZmFrZQ==\\n-----END CERTIFICATE-----";
    const { samlRuntimeConfig } = await import("../lib/saml");
    const config = await samlRuntimeConfig({ loadIdpMetadata: false });
    expect(config.entryPoint).toBe("https://idp.example.test/sso");
    expect(config.logoutUrl).toBeUndefined();
  });

  it("generates production metadata without requiring an IdP network fetch", async () => {
    process.env.SAML_PUBLIC_BASE_URL = "https://eforms.costaatt.edu.tt";
    process.env.SAML_SP_ENTITY_ID = "https://eforms.costaatt.edu.tt/api/saml/metadata";
    process.env.SAML_ACS_URL = "https://eforms.costaatt.edu.tt/api/saml/acs";
    process.env.SAML_LOGOUT_URL = "https://eforms.costaatt.edu.tt/api/saml/logout";
    process.env.SAML_NAMEID_FORMAT = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";

    const { generateSamlMetadata } = await import("../lib/saml");
    const metadata = await generateSamlMetadata();

    expect(metadata).toContain('entityID="https://eforms.costaatt.edu.tt/api/saml/metadata"');
    expect(metadata).toContain('Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://eforms.costaatt.edu.tt/api/saml/acs"');
    expect(metadata).toContain('Location="https://eforms.costaatt.edu.tt/api/saml/logout"');
    expect(metadata).toContain('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  });
});
