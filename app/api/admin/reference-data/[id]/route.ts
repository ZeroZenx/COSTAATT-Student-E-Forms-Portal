import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { deactivateReferenceRecord, getReferenceRecord, upsertReferenceRecord } from "@/lib/reference-admin";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    if (body.active === false && Object.keys(body).length === 1) {
      const record = await deactivateReferenceRecord(params.id);
      if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404 });
      return NextResponse.json({ record });
    }

    const existing = await getReferenceRecord(params.id);
    if (!existing) return NextResponse.json({ error: "Reference record not found." }, { status: 404 });
    const record = await upsertReferenceRecord({ ...existing, ...body, id: params.id });
    if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404 });
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reference record could not be updated." }, { status: 400 });
  }
}
