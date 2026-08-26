import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { canManageCustomForm } from "@/lib/custom-permissions";
import { getCustomForm, updateCustomForm } from "@/lib/custom-form-repository";
import { customFormInputSchema } from "@/lib/custom-form-validation";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const form = await getCustomForm(params.id);
    if (!form) return NextResponse.json({ error: "Form not found." }, { status: 404 });
    if (!canManageCustomForm(user, form)) return NextResponse.json({ error: "Form access is required." }, { status: 403 });
    return NextResponse.json({ form });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const form = await getCustomForm(params.id);
    if (!form) return NextResponse.json({ error: "Form not found." }, { status: 404 });
    if (!canManageCustomForm(user, form)) return NextResponse.json({ error: "Form access is required." }, { status: 403 });
    const input = customFormInputSchema.parse(await request.json());
    const updated = await updateCustomForm(params.id, input, user, request.headers.get("x-forwarded-for") || undefined);
    return NextResponse.json({ form: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form could not be updated." }, { status: 400 });
  }
}
