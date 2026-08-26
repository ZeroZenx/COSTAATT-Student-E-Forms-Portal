import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { sendCustomFormEmails } from "@/lib/custom-email";
import { canActOnCustomSubmission, canViewCustomSubmission } from "@/lib/custom-permissions";
import { getCustomForm, getCustomSubmission, updateCustomSubmission } from "@/lib/custom-form-repository";
import { customSubmissionPatchSchema } from "@/lib/custom-form-validation";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const submission = await getCustomSubmission(params.id);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    const form = await getCustomForm(submission.formId);
    if (!canViewCustomSubmission(user, submission, form || undefined)) return NextResponse.json({ error: "Submission access is required." }, { status: 403 });
    return NextResponse.json({ submission, form });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const existing = await getCustomSubmission(params.id);
    if (!existing) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    const form = await getCustomForm(existing.formId);
    if (!canActOnCustomSubmission(user, existing, form || undefined)) return NextResponse.json({ error: "Submission access is required." }, { status: 403 });
    const patch = customSubmissionPatchSchema.parse(await request.json());
    const submission = await updateCustomSubmission(params.id, patch, user, request.headers.get("x-forwarded-for") || undefined);
    if (form && submission && patch.status === "approved") await sendCustomFormEmails("approved", form, submission, user);
    if (form && submission && patch.status === "declined") await sendCustomFormEmails("declined", form, submission, user);
    if (form && submission && patch.status === "completed") await sendCustomFormEmails("completed", form, submission, user);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Submission could not be updated." }, { status: 400 });
  }
}
