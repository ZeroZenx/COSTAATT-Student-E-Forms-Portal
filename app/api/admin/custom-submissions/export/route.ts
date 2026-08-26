import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";
import { listCustomSubmissions } from "@/lib/custom-form-repository";

export async function GET() {
  try {
    const user = requireCurrentUser();
    if (!canCreateCustomForms(user)) return NextResponse.json({ error: "Form manager access is required." }, { status: 403 });
    const submissions = await listCustomSubmissions();
    const rows = [
      ["Submission ID", "Form", "Status", "Student ID", "Student", "Email", "Submitted", "Updated"],
      ...submissions.map((submission) => [
        submission.id,
        submission.formTitle,
        submission.status,
        submission.student.studentId,
        `${submission.student.firstName} ${submission.student.lastName}`,
        submission.student.email,
        submission.submittedAt || "",
        submission.updatedAt
      ])
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"custom-eform-submissions.csv\""
      }
    });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

function escapeCsv(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
