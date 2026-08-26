import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { listReferenceAdvisorOptions, listReferenceCourseOptions, listReferenceProgrammeOptions } from "@/lib/reference-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    requireCurrentUser();
    const [options, programmes, advisors] = await Promise.all([
      listReferenceCourseOptions(),
      listReferenceProgrammeOptions(),
      listReferenceAdvisorOptions()
    ]);
    return NextResponse.json({
      crns: options.filter((option) => option.crn),
      courseCodes: options,
      courseTitles: options,
      programmes,
      advisors
    }, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0"
  };
}
