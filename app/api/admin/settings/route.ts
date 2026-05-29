import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { getAdminSettings, updateSystemSettings, type SystemSettings } from "@/lib/admin-settings";

export async function GET() {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const settings = await getAdminSettings();
    return NextResponse.json({ settings: publicSystemSettings(settings.system), passwordConfigured: Boolean(settings.system.smtpPassword) });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const settings = await updateSystemSettings(await request.json());
    return NextResponse.json({ settings: publicSystemSettings(settings), passwordConfigured: Boolean(settings.smtpPassword) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Settings could not be saved." }, { status: 400 });
  }
}

function publicSystemSettings(settings: SystemSettings) {
  return { ...settings, smtpPassword: "" };
}
