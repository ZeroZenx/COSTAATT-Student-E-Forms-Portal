import { NextResponse } from "next/server";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { listAllSubmissions } from "@/lib/repository";
import { csvOperationalRows } from "@/lib/dashboard";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
    const submissions = await listAllSubmissions();
    const rows = [
      [
        "ID",
        "Form",
        "Status",
        "Student ID",
        "Student Name",
        "Email",
        "Programme",
        "Course Code",
        "CRN",
        "Course Title",
        "Assigned Reviewer",
        "Reviewer Email",
        "Routing Flags",
        "Created",
        "Updated",
        "Age Business Days",
        "SLA State",
        "Reviewer Decision",
        "Registry Decision",
        "Latest Comment"
      ],
      ...csvOperationalRows(submissions)
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=costaatt-eform-submissions.csv"
      }
    });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
