import { NextResponse } from "next/server";
import { isRegistryAdmin, requireCurrentUser } from "@/lib/auth";
import { listReferenceRecords, upsertReferenceRecord, type ReferenceKind } from "@/lib/reference-admin";

export async function GET(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as ReferenceKind | null;
    const search = url.searchParams.get("search") || undefined;
    const records = await listReferenceRecords(kind || undefined, search);
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Valid portal SSO is required." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireCurrentUser();
    if (!isRegistryAdmin(user)) return NextResponse.json({ error: "Registry admin access is required." }, { status: 403 });
    const record = await upsertReferenceRecord(await request.json());
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reference record could not be saved." }, { status: 400 });
  }
}
