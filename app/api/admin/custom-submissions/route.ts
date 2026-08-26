import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";
import { listAssignedCustomSubmissions, listCustomSubmissions } from "@/lib/custom-form-repository";

export async function GET() {
  try {
    const user = requireCurrentUser();
    const submissions = canCreateCustomForms(user) ? await listCustomSubmissions() : await listAssignedCustomSubmissions(user);
    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
