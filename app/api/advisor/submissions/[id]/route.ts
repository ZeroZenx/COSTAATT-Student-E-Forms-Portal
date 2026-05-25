import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { updateSubmissionByReviewer } from "@/lib/repository";
import { reviewerPatchSchema } from "@/lib/validation";
import { sendStatusChangedEmail } from "@/lib/email";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user || !hasAnyRole(user, ["advisor", "lecturer"])) {
      return NextResponse.json({ error: "Advisor or lecturer access is required." }, { status: 403 });
    }

    const patch = reviewerPatchSchema.parse(await request.json());
    const submission = await updateSubmissionByReviewer(
      params.id,
      patch,
      user,
      request.headers.get("x-forwarded-for") || undefined
    );
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    await sendStatusChangedEmail(submission);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reviewer action could not be saved." },
      { status: 400 }
    );
  }
}
