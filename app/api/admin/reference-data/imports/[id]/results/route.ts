import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { referenceBulkImportEnabled, referenceImportResultsCsv } from "@/lib/reference-import";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    const result = await referenceImportResultsCsv(params.id);
    return new NextResponse(result.body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=${result.filename}`, "cache-control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Import results could not be found." }, { status: 404 });
  }
}
