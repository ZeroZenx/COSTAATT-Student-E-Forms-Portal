import { NextResponse } from "next/server";
import { hasAnyRole, requireCurrentUser } from "@/lib/auth";
import {
  createReferenceDeletionPreview,
  getReferenceDeletionPreview,
  publicReferenceDeletionError,
  type ReferenceDeletionKind,
  type ReferenceDeletionOperation,
  type ReferenceDeletionScope
} from "@/lib/reference-deletion";
import { REFERENCE_DELETION_KINDS } from "@/lib/reference-deletion-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    const body = await request.json().catch(() => ({}));
    const kind = String(body.kind || "") as ReferenceDeletionKind;
    const operationType = String(body.operationType || "") as ReferenceDeletionOperation;
    const scope = String(body.scope || (body.recordId ? "single" : "all")) as ReferenceDeletionScope;
    if (!REFERENCE_DELETION_KINDS.includes(kind) || !["delete", "delete_unreferenced", "deactivate"].includes(operationType) || !["single", "all"].includes(scope)) {
      return NextResponse.json({ error: "A valid Course, CRN, or Lecturer deletion operation is required." }, { status: 400, headers: noStoreHeaders() });
    }
    const preview = await createReferenceDeletionPreview({
      kind,
      operationType,
      scope,
      recordId: body.recordId ? String(body.recordId) : undefined,
      actor: user
    });
    return NextResponse.json({ preview }, { headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status || 400) : 400;
    return NextResponse.json({ error: publicReferenceDeletionError(error) }, { status, headers: noStoreHeaders() });
  }
}

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!hasAnyRole(user, ["registry_admin", "system_admin"])) return NextResponse.json({ error: "Registry administrator access is required." }, { status: 403, headers: noStoreHeaders() });
    const url = new URL(request.url);
    const operationId = url.searchParams.get("operationId") || "";
    const filter = url.searchParams.get("filter") as "all" | "safe" | "blocked" | null;
    const preview = await getReferenceDeletionPreview(operationId, {
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 25),
      filter: filter === "safe" || filter === "blocked" ? filter : "all",
      search: url.searchParams.get("search") || ""
    });
    return NextResponse.json({ preview }, { headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status || 400) : 400;
    return NextResponse.json({ error: publicReferenceDeletionError(error, "Deletion preview could not be loaded.") }, { status, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store, max-age=0" };
}
