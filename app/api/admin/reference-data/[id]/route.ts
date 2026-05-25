import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { deactivateReferenceRecord } from "@/lib/reference-admin";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const record = await deactivateReferenceRecord(params.id);
    if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404 });
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reference record could not be updated." }, { status: 400 });
  }
}
