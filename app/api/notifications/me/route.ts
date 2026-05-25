import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { listStudentNotifications, markAllStudentNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const user = requireCurrentUser();
    const notifications = await listStudentNotifications(user.studentId);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH() {
  try {
    const user = requireCurrentUser();
    const updated = await markAllStudentNotificationsRead(user.studentId);
    const notifications = await listStudentNotifications(user.studentId);
    return NextResponse.json({ updated, notifications });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
