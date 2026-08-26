import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SAML_LOGIN_COOKIE, samlClient, samlRuntimeConfig, safeRelayState, selectSsoBinding } from "@/lib/saml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const relayState = safeRelayState(url.searchParams.get("redirect"));
    const client = await samlClient();
    const config = await samlRuntimeConfig();
    const loginCookie = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 300
    };

    if (selectSsoBinding(config).endsWith(":HTTP-POST")) {
      const form = await client.getAuthorizeFormAsync(relayState, undefined, {});
      const response = new NextResponse(form, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      response.cookies.set(SAML_LOGIN_COOKIE, randomUUID(), loginCookie);
      return response;
    }

    const redirectUrl = await client.getAuthorizeUrlAsync(relayState, undefined, {});
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(SAML_LOGIN_COOKIE, randomUUID(), loginCookie);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SAML login could not be started." }, { status: 500 });
  }
}
