import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { runSlaEscalations } from "@/lib/sla-escalations";

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) {
      return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    }

    const result = await runSlaEscalations({
      dryRun: true,
      actor: user,
      ipAddress: request.headers.get("x-forwarded-for") || undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SLA dry-run failed." }, { status: 400 });
  }
}
