import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { lookupCourseByCrnOrCode } from "@/lib/reference-data";

export async function GET(request: Request) {
  try {
    requireCurrentUser();
    const url = new URL(request.url);
    const value = url.searchParams.get("value") || "";
    const match = lookupCourseByCrnOrCode(value);
    if (!match) {
      return NextResponse.json({
        match: null,
        warning: "No lecturer assigned"
      });
    }
    return NextResponse.json({
      match: {
        crn: match.crn || "",
        courseCode: match.courseCode,
        courseTitle: match.courseTitle || match.courseCode,
        lecturerName: match.lecturerName || match.advisorName || "No lecturer assigned",
        lecturerEmail: match.lecturerEmail || match.advisorEmail || "",
        advisorName: match.advisorName,
        advisorEmail: match.advisorEmail,
        campus: match.campus || "Not assigned",
        section: match.section || "Not assigned"
      }
    });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
