import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { listStudentCustomSubmissions } from "@/lib/custom-form-repository";

export async function GET() {
  try {
    const user = requireCurrentUser();
    return NextResponse.json({ submissions: await listStudentCustomSubmissions(user.studentId) });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
