import { NextResponse } from "next/server";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { getSubmission, updateSubmission } from "@/lib/repository";
import { adminPatchSchema } from "@/lib/validation";
import { sendRegistryStatusEmail } from "@/lib/email";
import { notifyRegistryStatusChange } from "@/lib/notifications";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });

    const submission = await getSubmission(params.id);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });

    const patch = adminPatchSchema.parse(await request.json());
    const submission = await updateSubmission(params.id, patch, user, request.headers.get("x-forwarded-for") || undefined);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (patch.status) {
      await notifyRegistryStatusChange(submission);
      await sendRegistryStatusEmail(submission);
    }
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission could not be updated." },
      { status: 400 }
    );
  }
}
