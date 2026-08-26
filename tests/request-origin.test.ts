import { afterEach, describe, expect, it } from "vitest";
import { assertSameOrigin, publicRequestOrigin } from "../lib/request-origin";

const originalPortalBaseUrl = process.env.PORTAL_BASE_URL;
const originalSamlBaseUrl = process.env.SAML_PUBLIC_BASE_URL;

afterEach(() => {
  if (originalPortalBaseUrl === undefined) delete process.env.PORTAL_BASE_URL;
  else process.env.PORTAL_BASE_URL = originalPortalBaseUrl;
  if (originalSamlBaseUrl === undefined) delete process.env.SAML_PUBLIC_BASE_URL;
  else process.env.SAML_PUBLIC_BASE_URL = originalSamlBaseUrl;
});

describe("request origin validation", () => {
  it("accepts the public browser origin when the app is behind the HTTPS proxy", () => {
    process.env.PORTAL_BASE_URL = "https://eforms.costaatt.edu.tt";
    const request = new Request("http://127.0.0.1:5001/api/admin/reference-data/imports", {
      headers: {
        origin: "https://eforms.costaatt.edu.tt",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "eforms.costaatt.edu.tt"
      }
    });

    expect(publicRequestOrigin(request)).toBe("https://eforms.costaatt.edu.tt");
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects an unrelated origin", () => {
    process.env.PORTAL_BASE_URL = "https://eforms.costaatt.edu.tt";
    const request = new Request("http://127.0.0.1:5001/api/admin/reference-data/imports", {
      headers: { origin: "https://attacker.example" }
    });

    expect(() => assertSameOrigin(request)).toThrow("Cross-origin requests are not allowed.");
  });

  it("uses forwarded origin details when no public URL is configured", () => {
    delete process.env.PORTAL_BASE_URL;
    delete process.env.SAML_PUBLIC_BASE_URL;
    const request = new Request("http://127.0.0.1:5001/api/admin/reference-data/imports", {
      headers: {
        origin: "https://eforms.costaatt.edu.tt",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "eforms.costaatt.edu.tt"
      }
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });
});
