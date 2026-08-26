import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { confirmReferenceDeletion, publicReferenceDeletionError } from "@/lib/reference-deletion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  let operationId = "";
  try {
    const user = requireCurrentUser();
    const body = await request.json().catch(() => ({}));
    operationId = String(body.operationId || "");
    console.info("[reference-delete-confirm] request", {
      operationId,
      acknowledged: body.acknowledged === true,
      confirmationLength: String(body.confirmation || "").length,
      roles: user.roles || []
    });
    const result = await confirmReferenceDeletion({
      operationId,
      actor: user,
      confirmation: String(body.confirmation || ""),
      acknowledged: body.acknowledged === true
    });
    const status = result.status === "completed" ? 200 : result.status === "stale" ? 409 : 422;
    console.info("[reference-delete-confirm] result", {
      operationId,
      kind: result.kind,
      operationType: result.operationType,
      status: result.status,
      deletedCount: result.deletedCount,
      blockedCount: result.blockedCount,
      affectedCount: result.affectedCount
    });
    return NextResponse.json(result, { status, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status || 400) : 400;
    console.error("[reference-delete-confirm] failed", {
      operationId,
      status,
      errorName: error instanceof Error ? error.name : "UnknownError",
      databaseCode: error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code || "") : ""
    });
    return NextResponse.json({ error: publicReferenceDeletionError(error) }, { status, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store, max-age=0" };
}
