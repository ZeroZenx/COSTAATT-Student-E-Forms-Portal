import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { listReferenceRecordsPage, publicReferenceAdminError, upsertReferenceRecord, type ReferenceKind } from "@/lib/reference-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as ReferenceKind | null;
    const search = url.searchParams.get("search") || undefined;
    const active = url.searchParams.get("active") as "active" | "inactive" | "archived" | "all" | null;
    if (active && !["active", "inactive", "archived", "all"].includes(active)) return NextResponse.json({ error: "A valid status filter is required." }, { status: 400 });
    const result = await listReferenceRecordsPage({ kind: kind || undefined, search, active: active || "all", page: Number(url.searchParams.get("page") || 1), pageSize: Number(url.searchParams.get("pageSize") || 50) });
    return NextResponse.json(result, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401, headers: noStoreHeaders() });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const record = await upsertReferenceRecord(await request.json());
    return NextResponse.json({ record }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    return NextResponse.json({ error: publicReferenceAdminError(error) }, { status: 400, headers: noStoreHeaders() });
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0"
  };
}
