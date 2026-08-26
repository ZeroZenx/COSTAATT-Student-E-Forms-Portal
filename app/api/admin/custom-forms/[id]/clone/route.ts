import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { canManageCustomForm } from "@/lib/custom-permissions";
import { cloneCustomForm, getCustomForm } from "@/lib/custom-form-repository";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const form = await getCustomForm(params.id);
    if (!form) return NextResponse.json({ error: "Form not found." }, { status: 404 });
    if (!canManageCustomForm(user, form)) return NextResponse.json({ error: "Form access is required." }, { status: 403 });
    const clone = await cloneCustomForm(params.id, user, request.headers.get("x-forwarded-for") || undefined);
    return NextResponse.json({ form: clone }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form could not be cloned." }, { status: 400 });
  }
}
