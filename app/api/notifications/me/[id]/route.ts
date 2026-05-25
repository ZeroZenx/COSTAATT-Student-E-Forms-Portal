import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { markStudentNotificationRead } from "@/lib/notifications";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const notification = await markStudentNotificationRead(user.studentId, params.id);
    if (!notification) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ notification });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
