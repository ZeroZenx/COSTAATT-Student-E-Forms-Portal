import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { confirmReferenceImport, publicImportError, referenceBulkImportEnabled } from "@/lib/reference-import";
import { assertSameOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    assertSameOrigin(request);
    return NextResponse.json({ import: await confirmReferenceImport(params.id, user) }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const status = error instanceof Error && error.name === "StaleReferenceImportError" ? 409 : 400;
    return NextResponse.json({ error: publicImportError(error) }, { status, headers: { "cache-control": "no-store, max-age=0" } });
  }
}
