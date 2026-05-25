import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { listAssignedSubmissions, listAllSubmissions } from "@/lib/repository";

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }

  const submissions = hasAnyRole(user, ["registry_admin", "system_admin"])
    ? await listAllSubmissions()
    : await listAssignedSubmissions(user);

  return NextResponse.json({ submissions });
}
