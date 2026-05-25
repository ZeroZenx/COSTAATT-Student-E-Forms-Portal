import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { getAdminSettings, updateFormAvailability } from "@/lib/admin-settings";
import { isFormType } from "@/lib/forms";

export async function GET() {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const settings = await getAdminSettings();
    return NextResponse.json({ forms: settings.forms });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const body = await request.json();
    if (!isFormType(body.formType)) return NextResponse.json({ error: "Valid form type is required." }, { status: 400 });
    if (body.status && body.status !== "open" && body.status !== "closed") {
      return NextResponse.json({ error: "Status must be open or closed." }, { status: 400 });
    }
    const form = await updateFormAvailability({
      formType: body.formType,
      status: body.status,
      notice: body.notice
    });
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form settings could not be saved." }, { status: 400 });
  }
}
