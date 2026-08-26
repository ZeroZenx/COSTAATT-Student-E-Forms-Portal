import { NextResponse } from "next/server";
import { generateSamlMetadata } from "@/lib/saml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const metadata = await generateSamlMetadata();
    return new NextResponse(metadata, {
      headers: {
        "content-type": "application/samlmetadata+xml; charset=utf-8",
        "cache-control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SAML metadata could not be generated." }, { status: 500 });
  }
}
