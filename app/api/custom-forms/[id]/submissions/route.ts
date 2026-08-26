import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { sendCustomFormEmails } from "@/lib/custom-email";
import { createCustomSubmission, getCustomForm, isCustomFormAvailable } from "@/lib/custom-form-repository";
import { validateCustomResponses } from "@/lib/custom-form-validation";
import { storeAttachment } from "@/lib/storage";
import type { AttachmentRecord } from "@/lib/types";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const form = await getCustomForm(params.id);
    if (!form || !isCustomFormAvailable(form)) {
      return NextResponse.json({ error: "This form is not open for submissions." }, { status: 404 });
    }

    const formData = await request.formData();
    const responsesText = formData.get("responses");
    if (typeof responsesText !== "string") {
      return NextResponse.json({ error: "Responses are required." }, { status: 400 });
    }

    const responses = JSON.parse(responsesText) as Record<string, unknown>;
    const validation = validateCustomResponses(form.fields, responses, user);
    if (validation.errors.length > 0) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }

    const attachments: Record<string, AttachmentRecord> = {};
    for (const field of form.fields.filter((item) => item.type === "file_upload")) {
      const file = formData.get(field.key);
      if (file instanceof File) attachments[field.key] = await storeAttachment(file);
      if (field.required && !attachments[field.key]) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
      }
    }

    const submission = await createCustomSubmission({
      form,
      student: user,
      responses: validation.normalized,
      attachments,
      ipAddress: request.headers.get("x-forwarded-for") || undefined
    });
    await sendCustomFormEmails("submission_confirmation", form, submission, user);
    await sendCustomFormEmails("reviewer_notification", form, submission, user);
    await sendCustomFormEmails("internal_notification", form, submission, user);
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Submission could not be saved." }, { status: 400 });
  }
}
