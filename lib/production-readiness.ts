import { stat } from "fs/promises";
import path from "path";
import { getAdminSettings } from "./admin-settings";
import { databasePoolStats, hasDatabase, query } from "./db";
import { referenceRecordCounts, referenceStorageMode } from "./reference-admin";
import { attachmentStorageMode } from "./storage";

type CheckState = "ok" | "warning" | "degraded";


export function ssoMode() {
  if (process.env.TRUSTED_SSO_HEADER_MODE === "claims") return "trusted-headers";
  if (process.env.QUICKLAUNCH_JWT_SECRET) return "quicklaunch-jwt";
  if (process.env.SSO_SHARED_SECRET) return "signed-portal-token";
  return "not-configured";
}

export function buildMetadata() {
  return {
    appVersion: process.env.APP_VERSION || process.env.npm_package_version || "0.1.0",
    gitCommit: process.env.GIT_COMMIT || "not-set",
    nodeEnv: process.env.NODE_ENV || "development"
  };
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
    await query("select 1");
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
  const settings = await getAdminSettings().catch(() => null);
  const system = settings?.system;
  const mode = process.env.EMAIL_DELIVERY_MODE || system?.emailDeliveryMode || "log";
  const registryEmail = process.env.REGISTRY_NOTIFICATION_EMAIL || system?.registryNotificationEmail || "registrar@costaatt.edu.tt";

  if (mode === "smtp") {
    const smtpHost = process.env.SMTP_HOST || system?.smtpHost || "";
    const smtpFrom = process.env.SMTP_FROM || system?.smtpFrom || system?.smtpUser || "";
    const missing = [
      !smtpHost ? "SMTP host" : "",
      !smtpFrom ? "from email" : ""
    ].filter(Boolean);

    return {
      state: missing.length > 0 ? "warning" as const : "ok" as const,
      mode: "smtp",
      registryEmail,
      message: missing.length > 0 ? `SMTP mode is enabled but missing ${missing.join(", ")}.` : "SMTP delivery mode is enabled."
    };
  }

  const logPath = process.env.EMAIL_LOG_PATH || path.join(process.cwd(), "data", "email-log.jsonl");
  try {
    const info = await stat(logPath);
    return {
      state: "warning" as const,
      mode: "log",
      registryEmail,
      message: "Email delivery is in log mode.",
      lastUpdatedAt: info.mtime.toISOString()
    };
  } catch {
    return {
      state: "warning" as const,
      mode: "log",
      registryEmail,
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
    check("Build metadata", process.env.GIT_COMMIT ? "ok" : "warning", process.env.GIT_COMMIT ? "Git commit configured" : "GIT_COMMIT is not configured"),
    check("Runtime mode", mode === "production" ? "ok" : "warning", mode),
    check("Database", database.state, database.message),
    check("Reference data", referenceStorageMode() === "postgres" ? "ok" : "warning", `${referenceStorageMode()} storage`),
    check("Uploads", uploadMode === "s3" ? "ok" : "warning", uploadMode === "s3" ? "S3-compatible storage" : "Local VM disk; backup required"),
    check("Email", email.state, email.message),
    check("SSO", ssoMode() === "quicklaunch-jwt" ? "ok" : "warning", ssoMode()),
    check("Portal URL", process.env.PORTAL_BASE_URL?.startsWith("https://") ? "ok" : "warning", process.env.PORTAL_BASE_URL ? "Configured" : "Not configured"),
    check("Dev session", process.env.NODE_ENV === "production" ? "ok" : "warning", process.env.NODE_ENV === "production" ? "Disabled by production mode" : "Available in development"),
    check("SLA scheduler", process.env.SLA_ESCALATION_SECRET ? "ok" : "warning", process.env.SLA_ESCALATION_SECRET ? "Secret configured" : "SLA_ESCALATION_SECRET is not configured")
  ];
  const state: CheckState = checks.some((item) => item.state === "degraded")
    ? "degraded"
    : checks.some((item) => item.state === "warning")
      ? "warning"
      : "ok";

  return {
    state,
    build: buildMetadata(),
    generatedAt: new Date().toISOString(),
    environment: mode,
    database,
    databasePool: databasePoolStats(),
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
