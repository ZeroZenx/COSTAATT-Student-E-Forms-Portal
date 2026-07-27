import { NextResponse } from "next/server";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { appendSubmissionAuditEvent, getSubmission } from "@/lib/repository";
import { loadAttachment } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });

    const submission = await getSubmission(params.id);
    if (!submission?.attachment) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });

    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "1";
    const safeFileName = submission.attachment.fileName.replace(/[\r\n"\\]/g, "_");
    const bytes = await loadAttachment(submission.attachment);
    await appendSubmissionAuditEvent(
      params.id,
      user,
      download ? "attachment.downloaded" : "attachment.viewed",
      request.headers.get("x-forwarded-for") || undefined,
      {
        fileName: submission.attachment.fileName,
        contentType: submission.attachment.contentType,
        size: submission.attachment.size
      }
    );
    return new Response(bytes, {
      headers: {
        "content-type": submission.attachment.contentType,
        "content-disposition": `${download ? "attachment" : "inline"}; filename="${safeFileName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Attachment could not be downloaded." }, { status: 400 });
  }
}
