import { NextResponse } from "next/server";
import { ValidateInResponseTo } from "@node-saml/node-saml";
import { COOKIE_NAME, createSsoToken } from "@/lib/auth";
import { SAML_LOGIN_COOKIE, SAML_NAMEID_COOKIE, SAML_NAMEID_FORMAT_COOKIE, SAML_SESSION_INDEX_COOKIE, profileToSsoUser, publicBaseUrl, safeRelayState, samlClient } from "@/lib/saml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const samlResponse = String(form.get("SAMLResponse") || "");
    const relayState = safeRelayState(String(form.get("RelayState") || ""));
    if (!samlResponse) {
      return NextResponse.json({ error: "SAMLResponse is required." }, { status: 400 });
    }

    const initiated = hasCookie(request, SAML_LOGIN_COOKIE);
    const client = await samlClient({ validateInResponseTo: initiated ? ValidateInResponseTo.always : ValidateInResponseTo.ifPresent });
    const result = await client.validatePostResponseAsync({ SAMLResponse: samlResponse });
    if (!result.profile) {
      return NextResponse.json({ error: "SAML response did not contain a user profile." }, { status: 401 });
    }

    const user = profileToSsoUser(result.profile);
    const response = NextResponse.redirect(localRedirectUrl(relayState), 303);
    response.cookies.set(COOKIE_NAME, createSsoToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    response.cookies.set(SAML_LOGIN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    response.cookies.set(SAML_NAMEID_COOKIE, result.profile.nameID || "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60 });
    response.cookies.set(SAML_NAMEID_FORMAT_COOKIE, result.profile.nameIDFormat || "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60 });
    response.cookies.set(SAML_SESSION_INDEX_COOKIE, result.profile.sessionIndex || "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SAML response could not be validated." }, { status: 401 });
  }
}

function hasCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").some((part) => part.trim().startsWith(`${name}=`)) || false;
}

function localRedirectUrl(target: string) {
  const origin = new URL(publicBaseUrl()).origin;
  const redirectUrl = new URL(target || "/forms", origin);
  return redirectUrl.origin === origin ? redirectUrl : new URL("/forms", origin);
}
