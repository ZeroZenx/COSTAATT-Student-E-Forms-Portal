import { NextResponse } from "next/server";
import { formDefinitions } from "@/lib/forms";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { listAllSubmissions } from "@/lib/repository";

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
      ["ID", "Form", "Status", "Student ID", "Student Name", "Email", "Academic Year", "Semester", "Created"],
      ...submissions.map((submission) => [
        submission.id,
        formDefinitions[submission.formType].title,
        submission.status,
        submission.student.studentId,
        `${submission.student.firstName} ${submission.student.lastName}`,
        submission.student.email,
        submission.payload.academicYear,
        submission.payload.semester,
        submission.createdAt
      ])
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
