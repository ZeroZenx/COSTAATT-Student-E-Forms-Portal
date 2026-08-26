import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { confirmReferenceDeletion, publicReferenceDeletionError } from "@/lib/reference-deletion";
import { deactivateReferenceRecord, getReferenceRecord, publicReferenceAdminError, setReferenceRecordArchived, upsertReferenceRecord } from "@/lib/reference-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    if (Object.keys(body).length === 1 && typeof body.archived === "boolean") {
      console.info("[reference-admin] archive request", { recordId: params.id, archived: body.archived });
      const record = await setReferenceRecordArchived(params.id, body.archived, user);
      if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404, headers: noStoreHeaders() });
      return NextResponse.json({ record }, { headers: noStoreHeaders() });
    }
    if (body.active === false && Object.keys(body).length === 1) {
      const record = await deactivateReferenceRecord(params.id, false, user);
      if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404, headers: noStoreHeaders() });
      return NextResponse.json({ record }, { headers: noStoreHeaders() });
    }

    const existing = await getReferenceRecord(params.id);
    if (!existing) return NextResponse.json({ error: "Reference record not found." }, { status: 404, headers: noStoreHeaders() });
    const record = await upsertReferenceRecord({ ...existing, ...body, id: params.id });
    if (!record) return NextResponse.json({ error: "Reference record not found." }, { status: 404, headers: noStoreHeaders() });
    return NextResponse.json({ record }, { headers: noStoreHeaders() });
  } catch (error) {
    if (request.method === "PATCH") {
      const databaseCode = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code || "") : "";
      console.error("[reference-admin] update failed", {
        recordId: params.id,
        databaseCode,
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message.slice(0, 240) : "Unknown error"
      });
    }
    return NextResponse.json({ error: publicReferenceAdminError(error, "Reference record could not be updated.") }, { status: 400, headers: noStoreHeaders() });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    const body = await request.json().catch(() => ({}));
    const result = await confirmReferenceDeletion({
      operationId: String(body.operationId || ""),
      actor: user,
      confirmation: String(body.confirmation || ""),
      acknowledged: body.acknowledged === true,
      expectedRecordId: params.id
    });
    const status = result.status === "completed" ? 200 : result.status === "stale" ? 409 : 422;
    return NextResponse.json(result, { status, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status || 400) : 400;
    return NextResponse.json({ error: publicReferenceDeletionError(error, "Reference record could not be permanently deleted.") }, { status, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0"
  };
}
