import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { emptyTemplate, REFERENCE_KINDS } from "@/lib/reference-csv";
import type { ReferenceKind } from "@/lib/reference-admin";
import { referenceBulkImportEnabled } from "@/lib/reference-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    const kind = new URL(request.url).searchParams.get("kind") as ReferenceKind | null;
    if (!kind || !REFERENCE_KINDS.includes(kind)) return NextResponse.json({ error: "A valid reference-data type is required." }, { status: 400 });
    return new NextResponse(emptyTemplate(kind), { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=reference-template-${kind}.csv`, "cache-control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
