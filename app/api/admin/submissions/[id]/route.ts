import { NextResponse } from "next/server";
import { isStaff, requireCurrentUser } from "@/lib/auth";
import { updateSubmission } from "@/lib/repository";
import { adminPatchSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isStaff(user)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });

    const patch = adminPatchSchema.parse(await request.json());
    const submission = await updateSubmission(params.id, patch);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission could not be updated." },
      { status: 400 }
    );
  }
}
