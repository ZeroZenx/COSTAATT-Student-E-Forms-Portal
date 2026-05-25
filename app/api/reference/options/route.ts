import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { listReferenceCourseOptions } from "@/lib/reference-admin";

export async function GET() {
  try {
    requireCurrentUser();
    const options = await listReferenceCourseOptions();
    return NextResponse.json({
      crns: options.filter((option) => option.crn),
      courseCodes: options,
      courseTitles: options
    });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
