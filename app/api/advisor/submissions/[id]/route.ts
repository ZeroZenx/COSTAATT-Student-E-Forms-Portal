import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { getSubmission, updateSubmissionByReviewer } from "@/lib/repository";
import { reviewerPatchSchema } from "@/lib/validation";
import { sendReviewerActionEmails } from "@/lib/email";
import { isAssignedReviewer } from "@/lib/workflow";
import { notifyReviewerAction } from "@/lib/notifications";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }

  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  const isAdminReviewer = hasAnyRole(user, ["registry_admin", "system_admin"]);
  if (!isAdminReviewer && !isAssignedReviewer(submission, user)) {
    return NextResponse.json({ error: "This request is not assigned to your account." }, { status: 403 });
  }
  return NextResponse.json({ submission });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
    }

    const patch = reviewerPatchSchema.parse(await request.json());
    const submission = await updateSubmissionByReviewer(
      params.id,
      patch,
      user,
      request.headers.get("x-forwarded-for") || undefined
    );
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    await notifyReviewerAction(submission, patch.action);
    await sendReviewerActionEmails(submission, patch.action);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reviewer action could not be saved." },
      { status: 400 }
    );
  }
}
