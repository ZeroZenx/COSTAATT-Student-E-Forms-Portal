import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { csvSerialize, REFERENCE_KINDS } from "@/lib/reference-csv";
import type { ReferenceKind } from "@/lib/reference-admin";
import { referenceBulkImportEnabled } from "@/lib/reference-import";
import { listReferenceRecordsDirect } from "@/lib/reference-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as ReferenceKind | null;
    const active = url.searchParams.get("active") || "all";
    if (!kind || !REFERENCE_KINDS.includes(kind)) return NextResponse.json({ error: "A valid reference-data type is required." }, { status: 400 });
    if (!["active", "inactive", "archived", "all"].includes(active)) return NextResponse.json({ error: "A valid status filter is required." }, { status: 400 });
    const records = (await listReferenceRecordsDirect(kind)).filter((record) => active === "all" ? true : active === "active" ? record.active && !record.archived : active === "inactive" ? !record.active && !record.archived : record.archived);
    return new NextResponse(csvSerialize(kind, records), { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=reference-current-${kind}-${active}.csv`, "cache-control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}
