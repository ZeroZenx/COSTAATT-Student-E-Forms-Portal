import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { sendOperationalTestEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) {
      return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const to = String(body.to || "").trim();
    const label = String(body.label || "Diagnostics test").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 });
    }

    const outcome = await sendOperationalTestEmail(to, label);
    return NextResponse.json({
      outcome: {
        at: outcome.at,
        mode: outcome.mode,
        event: outcome.event,
        to: outcome.to,
        subject: outcome.subject,
        outcome: outcome.outcome,
        error: outcome.error,
        messageId: outcome.messageId
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Email test failed." }, { status: 400 });
  }
}
