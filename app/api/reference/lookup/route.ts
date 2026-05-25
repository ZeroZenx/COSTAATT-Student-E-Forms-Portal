import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { lookupReferenceCourseMatches } from "@/lib/reference-admin";
import {
  lookupCourseReferences,
  normalizeCourseMatch,
  type CourseLookupField,
  type CourseLookupMatch
} from "@/lib/reference-data";

const lookupFields = new Set(["crn", "courseCode", "courseTitle"]);

function uniqueMatches(matches: CourseLookupMatch[]) {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.crn || "no-crn"}|${match.courseCode}|${match.courseTitle}|${match.section}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function legacyMatch(match?: CourseLookupMatch) {
  if (!match) return null;
  return {
    crn: match.crn || "",
    courseCode: match.courseCode,
    courseTitle: match.courseTitle,
    lecturerName: match.lecturerName || match.advisorName || "No lecturer assigned",
    lecturerEmail: match.lecturerEmail || match.advisorEmail || "",
    advisorName: match.advisorName,
    advisorEmail: match.advisorEmail,
    reviewerName: match.reviewerName,
    reviewerEmail: match.reviewerEmail,
    reviewerRole: match.reviewerRole,
    campus: match.campus,
    section: match.section
  };
}

export async function GET(request: Request) {
  try {
    requireCurrentUser();
    const url = new URL(request.url);
    const value = url.searchParams.get("value") || "";
    const requestedField = url.searchParams.get("field");
    const rawMatches = requestedField && lookupFields.has(requestedField)
      ? uniqueMatches([
        ...lookupCourseReferences(requestedField as CourseLookupField, value),
        ...await lookupReferenceCourseMatches(requestedField as CourseLookupField, value)
      ])
      : uniqueMatches([
        ...lookupCourseReferences("crn", value),
        ...lookupCourseReferences("courseCode", value),
        ...lookupCourseReferences("courseTitle", value),
        ...await lookupReferenceCourseMatches("crn", value),
        ...await lookupReferenceCourseMatches("courseCode", value),
        ...await lookupReferenceCourseMatches("courseTitle", value)
      ]);
    const matches = rawMatches.map((match) => normalizeCourseMatch(match));
    const selectedMatch = matches.length === 1 ? matches[0] : null;

    if (matches.length === 0) {
      return NextResponse.json({
        match: null,
        matches: [],
        selectedMatch: null,
        requiresSelection: false,
        warning: "No lecturer assigned"
      });
    }

    return NextResponse.json({
      match: legacyMatch(selectedMatch || matches[0]),
      matches,
      selectedMatch,
      requiresSelection: matches.length > 1
    });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
