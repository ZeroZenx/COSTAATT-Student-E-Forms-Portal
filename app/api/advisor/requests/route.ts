import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { listAssignedSubmissions, listAllSubmissions } from "@/lib/repository";

export async function GET() {
  const user = getCurrentUser();
  if (!user || !hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])) {
    return NextResponse.json({ error: "Advisor or lecturer access is required." }, { status: 403 });
  }

  const submissions = hasAnyRole(user, ["registry_admin", "system_admin"])
    ? await listAllSubmissions()
    : await listAssignedSubmissions(user);

  return NextResponse.json({ submissions });
}
