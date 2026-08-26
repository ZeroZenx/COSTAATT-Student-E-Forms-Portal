import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getCustomSubmission } from "@/lib/custom-form-repository";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const submission = await getCustomSubmission(params.id);
    if (!submission || submission.student.studentId !== user.studentId) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
