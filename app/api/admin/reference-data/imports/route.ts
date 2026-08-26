import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { REFERENCE_KINDS } from "@/lib/reference-csv";
import type { ReferenceKind } from "@/lib/reference-admin";
import { createReferenceImport, importLimits, listReferenceImports, publicImportError, referenceBulkImportEnabled, type ImportStatus } from "@/lib/reference-import";
import { assertSameOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    const url = new URL(request.url);
    return NextResponse.json(await listReferenceImports({ page: Number(url.searchParams.get("page") || 1), pageSize: Number(url.searchParams.get("pageSize") || 25), kind: validKind(url.searchParams.get("kind")), status: url.searchParams.get("status") as ImportStatus | undefined }), { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401, headers: noStoreHeaders() });
  }
}

export async function POST(request: Request) {
  let requestKind = "";
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    if (!referenceBulkImportEnabled()) return NextResponse.json({ error: "Bulk reference-data tools are not enabled." }, { status: 404 });
    assertSameOrigin(request);
    const form = await request.formData();
    const kind = validKind(String(form.get("kind") || ""));
    requestKind = kind || String(form.get("kind") || "").slice(0, 40);
    const file = form.get("file");
    if (!kind || !(file instanceof File)) return NextResponse.json({ error: "A reference-data type and CSV file are required." }, { status: 400, headers: noStoreHeaders() });
    if (!file.name.toLowerCase().endsWith(".csv")) return NextResponse.json({ error: "Only CSV files are supported." }, { status: 400, headers: noStoreHeaders() });
    if (file.type && !["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type.toLowerCase())) return NextResponse.json({ error: "The uploaded file must be CSV content." }, { status: 400, headers: noStoreHeaders() });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > importLimits().maxBytes) return NextResponse.json({ error: `CSV exceeds the maximum file size of ${Math.round(importLimits().maxBytes / 1024 / 1024)} MB.` }, { status: 413, headers: noStoreHeaders() });
    console.info("[reference-import] request", { kind, fileName: safeLogFileName(file.name), bytes: bytes.byteLength, contentType: file.type || "" });
    const summary = await createReferenceImport(kind, file.name, bytes, user);
    console.info("[reference-import] validated", { importId: summary.id, kind: summary.kind, status: summary.status, totalRows: summary.totalRows, invalidCount: summary.invalidCount, conflictCount: summary.conflictCount });
    return NextResponse.json({ import: summary }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    console.error("[reference-import] failed", { kind: requestKind, errorName: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message.slice(0, 240) : "Unknown error" });
    return NextResponse.json({ error: publicImportError(error, "CSV could not be validated.") }, { status: 400, headers: noStoreHeaders() });
  }
}

function validKind(value: string | null): ReferenceKind | undefined { return value && REFERENCE_KINDS.includes(value as ReferenceKind) ? value as ReferenceKind : undefined; }
function safeLogFileName(value: string) { return String(value || "").replace(/[\r\n]/g, "_").slice(0, 160); }
function noStoreHeaders() { return { "cache-control": "no-store, max-age=0" }; }
