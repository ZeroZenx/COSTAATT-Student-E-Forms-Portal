export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let expectedOrigin: string;
  try {
    expectedOrigin = publicRequestOrigin(request);
    if (origin !== expectedOrigin) throw new Error("Cross-origin requests are not allowed.");
  } catch (error) {
    if (error instanceof Error && error.message === "Cross-origin requests are not allowed.") throw error;
    throw new Error("The application public origin is not configured.");
  }
}

export function publicRequestOrigin(request: Request) {
  const configuredBaseUrl = process.env.PORTAL_BASE_URL || process.env.SAML_PUBLIC_BASE_URL;
  if (configuredBaseUrl) return new URL(configuredBaseUrl).origin;

  const requestUrl = new URL(request.url);
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  if (forwardedProto && forwardedHost) return new URL(`${forwardedProto}://${forwardedHost}`).origin;
  return requestUrl.origin;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || "";
}
