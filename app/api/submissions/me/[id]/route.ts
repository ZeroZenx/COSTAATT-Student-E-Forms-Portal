import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getSubmission } from "@/lib/repository";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const submission = await getSubmission(params.id);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (submission.student.studentId !== user.studentId) {
      return NextResponse.json({ error: "You can only view your own submissions." }, { status: 403 });
    }
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
