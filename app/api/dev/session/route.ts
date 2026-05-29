import { NextResponse } from "next/server";
import { COOKIE_NAME, createSsoToken } from "@/lib/auth";
import { devIdentityFromOptionId, devIdentitySimulatorEnabled, devPresetFor, devPresetRedirectFor, reviewerIdentityFromInput } from "@/lib/dev-identities";

export async function GET(request: Request) {
  if (!devIdentitySimulatorEnabled()) {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("clear") === "1") return clearSessionResponse(url);

  const preset = url.searchParams.get("as");
  const token = createSsoToken(devPresetFor(preset));
  const redirectTo = url.searchParams.get("redirect") || devPresetRedirectFor(preset);
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
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
  if (action === "clear") return clearSessionResponse(new URL(request.url));

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
    const response = NextResponse.redirect(new URL(selection?.redirectTo || String(input.redirect || "/advisor/requests"), request.url), 303);
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

function clearSessionResponse(url: URL) {
  const response = NextResponse.redirect(new URL("/dev/session", url), 303);
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
