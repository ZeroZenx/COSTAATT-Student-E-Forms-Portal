import { NextResponse } from "next/server";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { getSubmission } from "@/lib/repository";
import { loadAttachment } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });

    const submission = await getSubmission(params.id);
    if (!submission?.attachment) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });

    const bytes = await loadAttachment(submission.attachment);
    return new Response(bytes, {
      headers: {
        "content-type": submission.attachment.contentType,
        "content-disposition": `attachment; filename="${submission.attachment.fileName.replace(/"/g, "")}"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Attachment could not be downloaded." }, { status: 400 });
  }
}
