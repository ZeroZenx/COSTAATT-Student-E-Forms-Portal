import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { assertFormOpen } from "@/lib/admin-settings";
import { createSubmission } from "@/lib/repository";
import { storeAttachment } from "@/lib/storage";
import { submissionPayloadSchema } from "@/lib/validation";
import { sendSubmissionCreatedEmails } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    const formData = await request.formData();
    const payloadText = formData.get("payload");
    const attachment = formData.get("attachment");

    if (typeof payloadText !== "string") {
      return NextResponse.json({ error: "Submission payload is required." }, { status: 400 });
    }

    const payload = submissionPayloadSchema.parse(JSON.parse(payloadText));
    await assertFormOpen(payload.formType);
    const storedAttachment = attachment instanceof File ? await storeAttachment(attachment) : undefined;
    if (!storedAttachment) {
      return NextResponse.json({ error: "A course approval attachment is required." }, { status: 400 });
    }

    const record = await createSubmission(user, payload, storedAttachment, request.headers.get("x-forwarded-for") || undefined);
    await sendSubmissionCreatedEmails(record);
    return NextResponse.json({ submission: record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission could not be saved." },
      { status: 400 }
    );
  }
}
