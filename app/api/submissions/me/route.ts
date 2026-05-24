import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { listStudentSubmissions } from "@/lib/repository";

export async function GET() {
  try {
    const user = requireCurrentUser();
    const submissions = await listStudentSubmissions(user.studentId);
    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
