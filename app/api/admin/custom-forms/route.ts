import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";
import { createCustomForm, listCustomForms } from "@/lib/custom-form-repository";
import { customFormInputSchema } from "@/lib/custom-form-validation";

export async function GET() {
  try {
    const user = requireCurrentUser();
    if (!canCreateCustomForms(user)) return NextResponse.json({ error: "Form builder access is required." }, { status: 403 });
    return NextResponse.json({ forms: await listCustomForms() });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!canCreateCustomForms(user)) return NextResponse.json({ error: "Form builder access is required." }, { status: 403 });
    const input = customFormInputSchema.parse(await request.json());
    const form = await createCustomForm(input, user, request.headers.get("x-forwarded-for") || undefined);
    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form could not be saved." }, { status: 400 });
  }
}
