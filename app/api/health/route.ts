import { NextResponse } from "next/server";
import { productionReadinessSnapshot } from "@/lib/production-readiness";

export async function GET() {
  const snapshot = await productionReadinessSnapshot({ includeReferenceCounts: false });
  const status = snapshot.state === "degraded" ? 503 : 200;
  return NextResponse.json({
    status: snapshot.state,
    generatedAt: snapshot.generatedAt,
    environment: snapshot.environment,
    database: snapshot.database,
    databasePool: snapshot.databasePool,
    storage: snapshot.storage,
    email: {
      mode: snapshot.email.mode,
      state: snapshot.email.state
    },
    sso: snapshot.sso
  }, { status });
}
