import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { hasMatchingEscalationSecret, runSlaEscalations } from "@/lib/sla-escalations";

export async function POST(request: Request) {
  const authorizedBySecret = hasValidBearerSecret(request);
  const user = authorizedBySecret ? null : getCurrentUser();
  const authorizedByUser = Boolean(user && hasAnyRole(user, ["system_admin"]));

  if (!authorizedByUser && !authorizedBySecret) {
    return NextResponse.json({ error: "System administrator access or a valid SLA escalation secret is required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
  const result = await runSlaEscalations({
    dryRun,
    actor: user || undefined,
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json(result);
}

function hasValidBearerSecret(request: Request) {
  const expected = process.env.SLA_ESCALATION_SECRET;
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return Boolean(expected && token && timingSafeEqual(token, expected) && hasMatchingEscalationSecret(header));
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
