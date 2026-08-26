import { NextResponse } from "next/server";
import { COOKIE_NAME, createSsoToken } from "@/lib/auth";
import { devIdentityFromOptionId, devIdentitySimulatorEnabled, devPresetFor, devPresetRedirectFor, reviewerIdentityFromInput } from "@/lib/dev-identities";

export async function GET(request: Request) {
  if (!devIdentitySimulatorEnabled()) {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("clear") === "1") return clearSessionResponse(request);

  const preset = url.searchParams.get("as");
  const token = createSsoToken(devPresetFor(preset));
  const redirectTo = url.searchParams.get("redirect") || devPresetRedirectFor(preset);
  const response = NextResponse.redirect(localRedirectUrl(request, redirectTo));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}

export async function POST(request: Request) {
  if (!devIdentitySimulatorEnabled()) {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";
  const input = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const action = String(input.action || "");
  if (action === "clear") return clearSessionResponse(request);

  try {
    const selection = action === "switch" ? devIdentityFromOptionId(String(input.identityId || "")) : null;
    const user = selection?.email ? {
      studentId: selection.studentId,
      firstName: selection.name.split(/\s+/)[0] || selection.name,
      lastName: selection.name.split(/\s+/).slice(1).join(" ") || "User",
      email: selection.email,
      roles: selection.roles
    } : reviewerIdentityFromInput({
      name: String(input.name || ""),
      email: String(input.email || ""),
      role: String(input.role || ""),
      studentId: String(input.studentId || "")
    });
    const token = createSsoToken(user);
    const response = NextResponse.redirect(localRedirectUrl(request, selection?.redirectTo || String(input.redirect || "/advisor/requests")), 303);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid development identity." }, { status: 400 });
  }
}

function clearSessionResponse(request: Request) {
  const response = NextResponse.redirect(localRedirectUrl(request, "/dev/session"), 303);
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}

function localRedirectUrl(request: Request, target: string) {
  const origin = requestOrigin(request);
  const redirectUrl = new URL(target || "/", origin);

  return redirectUrl.origin === origin ? redirectUrl : new URL("/", origin);
}

function requestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host")) || requestUrl.host;
  const protocol = firstHeaderValue(request.headers.get("x-forwarded-proto")) || requestUrl.protocol.replace(/:$/, "") || "http";

  return `${protocol}://${host}`;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}
