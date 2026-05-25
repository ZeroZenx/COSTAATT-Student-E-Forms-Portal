import { stat } from "fs/promises";
import path from "path";
import { Pool } from "pg";
import { emailDeliveryMode } from "./email";
import { referenceRecordCounts, referenceStorageMode } from "./reference-admin";
import { attachmentStorageMode } from "./storage";

type CheckState = "ok" | "warning" | "degraded";

let pool: Pool | null = null;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function db() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export function ssoMode() {
  if (process.env.TRUSTED_SSO_HEADER_MODE === "claims") return "trusted-headers";
  if (process.env.QUICKLAUNCH_JWT_SECRET) return "quicklaunch-jwt";
  if (process.env.SSO_SHARED_SECRET) return "signed-portal-token";
  return "not-configured";
}

export async function databaseHealth() {
  if (!hasDatabase()) {
    return {
      configured: false,
      state: process.env.NODE_ENV === "production" ? "degraded" as const : "warning" as const,
      message: process.env.NODE_ENV === "production" ? "DATABASE_URL is required in production." : "Using local JSON fallback."
    };
  }

  try {
    const startedAt = Date.now();
    await db().query("select 1");
    return {
      configured: true,
      state: "ok" as const,
      latencyMs: Date.now() - startedAt,
      message: "Postgres is reachable."
    };
  } catch {
    return {
      configured: true,
      state: "degraded" as const,
      message: "Postgres is configured but not reachable."
    };
  }
}

export async function emailLogHealth() {
  if (emailDeliveryMode() === "smtp") {
    return { state: "ok" as const, mode: "smtp", message: "SMTP delivery mode is enabled." };
  }

  const logPath = process.env.EMAIL_LOG_PATH || path.join(process.cwd(), "data", "email-log.jsonl");
  try {
    const info = await stat(logPath);
    return {
      state: "warning" as const,
      mode: "log",
      message: "Email delivery is in log mode.",
      lastUpdatedAt: info.mtime.toISOString()
    };
  } catch {
    return {
      state: "warning" as const,
      mode: "log",
      message: "Email delivery is in log mode; no log file exists yet."
    };
  }
}

export async function productionReadinessSnapshot(options: { includeReferenceCounts?: boolean } = {}) {
  const includeReferenceCounts = options.includeReferenceCounts ?? true;
  const [database, email, referenceCounts] = await Promise.all([
    databaseHealth(),
    emailLogHealth(),
    includeReferenceCounts ? referenceRecordCounts().catch(() => null) : Promise.resolve(null)
  ]);
  const uploadMode = attachmentStorageMode();
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const checks = [
    check("Runtime mode", mode === "production" ? "ok" : "warning", mode),
    check("Database", database.state, database.message),
    check("Reference data", referenceStorageMode() === "postgres" ? "ok" : "warning", `${referenceStorageMode()} storage`),
    check("Uploads", uploadMode === "s3" ? "ok" : "warning", uploadMode === "s3" ? "S3-compatible storage" : "Local VM disk; backup required"),
    check("Email", email.state, email.message),
    check("SSO", ssoMode() === "quicklaunch-jwt" ? "ok" : "warning", ssoMode()),
    check("Portal URL", process.env.PORTAL_BASE_URL?.startsWith("https://") ? "ok" : "warning", process.env.PORTAL_BASE_URL ? "Configured" : "Not configured"),
    check("Dev session", process.env.NODE_ENV === "production" ? "ok" : "warning", process.env.NODE_ENV === "production" ? "Disabled by production mode" : "Available in development")
  ];
  const state: CheckState = checks.some((item) => item.state === "degraded")
    ? "degraded"
    : checks.some((item) => item.state === "warning")
      ? "warning"
      : "ok";

  return {
    state,
    generatedAt: new Date().toISOString(),
    environment: mode,
    database,
    storage: {
      attachments: uploadMode,
      referenceData: referenceStorageMode()
    },
    email,
    sso: {
      mode: ssoMode()
    },
    referenceCounts,
    checks
  };
}

function check(name: string, state: CheckState, message: string) {
  return { name, state, message };
}
