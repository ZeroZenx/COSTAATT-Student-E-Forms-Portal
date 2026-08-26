import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { getReferenceImport, listReferenceImportRows, referenceBulkImportEnabled, type ImportRowStatus } from "@/lib/reference-import";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    const summary = await getReferenceImport(params.id);
    if (!summary) return NextResponse.json({ error: "Import was not found." }, { status: 404, headers: noStoreHeaders() });
    const url = new URL(request.url);
    const rows = await listReferenceImportRows(params.id, { page: Number(url.searchParams.get("page") || 1), pageSize: Number(url.searchParams.get("pageSize") || 50), status: url.searchParams.get("status") as ImportRowStatus | undefined, search: url.searchParams.get("search") || undefined });
    return NextResponse.json({ import: summary, ...rows }, { headers: noStoreHeaders() });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("[reference-import] preview rows failed", {
      importId: params.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 240) : "Unknown error"
    });
    return NextResponse.json({ error: unauthenticated ? "Valid portal SSO is required." : "Import preview rows could not be loaded. Please try the upload again." }, { status: unauthenticated ? 401 : 500, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() { return { "cache-control": "no-store, max-age=0" }; }
