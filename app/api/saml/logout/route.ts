import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SAML_LOGIN_COOKIE, SAML_NAMEID_COOKIE, SAML_NAMEID_FORMAT_COOKIE, SAML_SESSION_INDEX_COOKIE, isSloConfigured, publicBaseUrl, safeRelayState, samlClient, samlRuntimeConfig, selectSloBinding } from "@/lib/saml";
import { COOKIE_NAME } from "@/lib/auth";
import type { Profile } from "@node-saml/node-saml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const relayState = safeRelayState(url.searchParams.get("RelayState") || url.searchParams.get("redirect"));

  try {
    if (url.searchParams.has("SAMLResponse") || url.searchParams.has("SAMLRequest")) {
      if (!url.searchParams.has("Signature")) throw new Error("Unsigned SAML logout messages are not accepted.");
      const config = await samlRuntimeConfig();
      const client = await samlClient();
      const result = await client.validateRedirectAsync(Object.fromEntries(url.searchParams.entries()), url.search.slice(1));
      if (url.searchParams.has("SAMLRequest") && result.profile) {
        const responseUrl = await client.getLogoutResponseUrlAsync(result.profile, relayState, {}, true);
        return clearLocalSession(NextResponse.redirect(responseUrl, 303));
      }
      if (url.searchParams.has("SAMLResponse") && !result.loggedOut) throw new Error("QuickLaunch SAML logout response was not successful.");
      return clearLocalSession(NextResponse.redirect(localRedirectUrl(relayState), 303));
    }

    const config = await samlRuntimeConfig({ loadIdpMetadata: false });
    const nameID = cookies().get(SAML_NAMEID_COOKIE)?.value;
    if (isSloConfigured(config) && nameID) {
      const client = await samlClient();
      const user = {
        nameID,
        nameIDFormat: cookies().get(SAML_NAMEID_FORMAT_COOKIE)?.value || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        sessionIndex: cookies().get(SAML_SESSION_INDEX_COOKIE)?.value || undefined
      } as Profile;

      if (selectSloBinding(config).endsWith(":HTTP-POST")) {
        const requestXml = await client._generateLogoutRequest(user);
        const response = new NextResponse(autoSubmitForm(config.logoutUrl || "", {
          SAMLRequest: Buffer.from(requestXml, "utf8").toString("base64"),
          RelayState: relayState
        }), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
        return clearLocalSession(response);
      }

      const logoutUrl = await client.getLogoutUrlAsync(user, relayState, {});
      return clearLocalSession(NextResponse.redirect(logoutUrl, 303));
    }
  } catch {
    // Local logout remains available if the IdP metadata or SLO exchange is unavailable.
  }

  return clearLocalSession(NextResponse.redirect(localRedirectUrl(relayState), 303));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const samlResponse = String(form.get("SAMLResponse") || "");
  const samlRequest = String(form.get("SAMLRequest") || "");
  const relayState = safeRelayState(String(form.get("RelayState") || ""));

  if (!samlResponse && !samlRequest) return NextResponse.json({ error: "SAMLRequest or SAMLResponse is required." }, { status: 400 });

  try {
    const config = await samlRuntimeConfig();
    const client = await samlClient();
    if (samlRequest) {
      const result = await client.validatePostRequestAsync({ SAMLRequest: samlRequest });
      if (!result.profile) throw new Error("QuickLaunch SAML logout request did not contain a profile.");
      const responseUrl = await client.getLogoutResponseUrlAsync(result.profile, relayState, {}, true);
      return clearLocalSession(NextResponse.redirect(responseUrl, 303));
    }

    const decoded = Buffer.from(samlResponse, "base64").toString("utf8");
    assertLogoutResponseEnvelope(decoded, config.idpEntityId, config.logoutCallbackUrl);
    const result = await client.validatePostResponseAsync({ SAMLResponse: samlResponse });
    if (!result.loggedOut) throw new Error("QuickLaunch SAML logout response was not successful.");
    return clearLocalSession(NextResponse.redirect(localRedirectUrl(relayState), 303));
  } catch {
    return NextResponse.json({ error: "SAML logout response could not be validated." }, { status: 401 });
  }
}

function clearLocalSession(response: NextResponse) {
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
  response.cookies.set(COOKIE_NAME, "", cookieOptions);
  response.cookies.set(SAML_LOGIN_COOKIE, "", cookieOptions);
  response.cookies.set(SAML_NAMEID_COOKIE, "", cookieOptions);
  response.cookies.set(SAML_NAMEID_FORMAT_COOKIE, "", cookieOptions);
  response.cookies.set(SAML_SESSION_INDEX_COOKIE, "", cookieOptions);
  return response;
}

function localRedirectUrl(target: string) {
  const origin = new URL(publicBaseUrl()).origin;
  const redirectUrl = new URL(target || "/forms", origin);
  return redirectUrl.origin === origin ? redirectUrl : new URL("/forms", origin);
}

function autoSubmitForm(action: string, values: Record<string, string>) {
  const inputs = Object.entries(values).map(([name, value]) => `<input type="hidden" name="${htmlAttribute(name)}" value="${htmlAttribute(value)}">`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body onload="document.forms[0].submit()"><form method="post" action="${htmlAttribute(action)}">${inputs}<noscript><button type="submit">Continue</button></noscript></form></body></html>`;
}

function htmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function assertLogoutResponseEnvelope(xml: string, expectedIssuer?: string, expectedDestination?: string) {
  const root = xml.match(/<(?:(?:[A-Za-z_][\w.-]*):)?LogoutResponse\b([^>]*)>/i);
  if (!root) throw new Error("SAML logout response is not a LogoutResponse.");
  const destination = root[1].match(/\bDestination\s*=\s*(["'])(.*?)\1/i)?.[2];
  if (destination && destination !== expectedDestination) throw new Error("SAML logout response destination mismatch.");
  if (expectedIssuer) {
    const issuer = xml.match(/<(?:(?:[A-Za-z_][\w.-]*):)?Issuer\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?Issuer>/i)?.[1]?.trim();
    if (issuer !== expectedIssuer) throw new Error("SAML logout response issuer mismatch.");
  }
}
