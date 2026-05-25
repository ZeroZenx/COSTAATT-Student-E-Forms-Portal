import fs from "fs";
import path from "path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const production = args.has("--production") || process.env.NODE_ENV === "production";
const loadedFiles = [];

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return;
  loadedFiles.push(fileName);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    const rawValue = valueParts.join("=");
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

[".env", ".env.local", ".env.production", ".env.production.local"].forEach(loadEnvFile);

const errors = [];
const warnings = [];

function value(name) {
  return process.env[name]?.trim() || "";
}

function has(name) {
  return value(name).length > 0;
}

function requireVar(name, reason) {
  if (!has(name)) errors.push(`${name} is required${reason ? `: ${reason}` : "."}`);
}

function warnMissing(name, reason) {
  if (!has(name)) warnings.push(`${name} is not set${reason ? `: ${reason}` : "."}`);
}

function isPlaceholder(name) {
  const current = value(name).toLowerCase();
  return ["replace-me", "replace-with-portal-shared-secret", "replace-with-quicklaunch-jwt-secret", "replace-with-long-random", "password"].some((placeholder) =>
    current.includes(placeholder)
  );
}

function validateUrl(name, { requireHttps = false, forbidLocalhost = false } = {}) {
  if (!has(name)) return;
  try {
    const parsed = new URL(value(name));
    if (requireHttps && parsed.protocol !== "https:") errors.push(`${name} must use https in production.`);
    if (forbidLocalhost && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) errors.push(`${name} must not point to localhost in production.`);
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

const emailMode = value("EMAIL_DELIVERY_MODE") || "log";
if (!["log", "smtp"].includes(emailMode)) errors.push("EMAIL_DELIVERY_MODE must be either log or smtp.");

validateUrl("PORTAL_BASE_URL", { requireHttps: production, forbidLocalhost: production });

if (production) {
  requireVar("DATABASE_URL", "production must persist submissions in Postgres.");
  requireVar("PORTAL_BASE_URL", "production emails and direct links need the public portal URL.");

  const headerMode = value("TRUSTED_SSO_HEADER_MODE") || "signed-token";
  if (headerMode === "claims") {
    requireVar("TRUSTED_SSO_HEADER_NAME", "trusted claim deployments must document the proxy-owned header source.");
  } else if (!has("SSO_SHARED_SECRET") && !has("QUICKLAUNCH_JWT_SECRET")) {
    errors.push("Production SSO requires SSO_SHARED_SECRET, QUICKLAUNCH_JWT_SECRET, or TRUSTED_SSO_HEADER_MODE=claims behind a trusted proxy.");
  }

  if (value("ALLOW_MOCK_SSO") === "true") errors.push("ALLOW_MOCK_SSO must not be true in production.");
  if (isPlaceholder("SSO_SHARED_SECRET")) errors.push("SSO_SHARED_SECRET still contains a placeholder value.");
  if (isPlaceholder("QUICKLAUNCH_JWT_SECRET")) errors.push("QUICKLAUNCH_JWT_SECRET still contains a placeholder value.");
  if (!has("SLA_ESCALATION_SECRET")) warnings.push("SLA_ESCALATION_SECRET is not set. Windows Task Scheduler cannot run SLA escalations without a logged-in system_admin session.");
  if (isPlaceholder("SLA_ESCALATION_SECRET")) errors.push("SLA_ESCALATION_SECRET still contains a placeholder value.");
}

if (has("DATABASE_URL") && !value("DATABASE_URL").startsWith("postgres")) warnings.push("DATABASE_URL does not look like a Postgres connection string.");

const s3Names = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
const hasAnyS3 = s3Names.some(has);
const hasAllS3 = s3Names.every(has);
if (hasAnyS3 && !hasAllS3) errors.push("S3 configuration is incomplete. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY together.");
if (production && !hasAllS3) warnings.push("S3 is not fully configured. Production will use local uploads, so the VM upload directory must be backed up.");

if (emailMode === "smtp") {
  requireVar("SMTP_HOST", "SMTP mode needs a mail server.");
  requireVar("SMTP_PORT", "SMTP mode needs a port, usually 587.");
  requireVar("SMTP_FROM", "SMTP mode needs a from address.");
  if (has("SMTP_USER") !== has("SMTP_PASSWORD")) errors.push("SMTP_USER and SMTP_PASSWORD must be set together when SMTP auth is required.");
} else {
  warnMissing("REGISTRY_NOTIFICATION_EMAIL", "Registry notifications will fall back to registrar@costaatt.edu.tt.");
}

if (has("UPLOAD_MAX_MB") && (!Number.isFinite(Number(value("UPLOAD_MAX_MB"))) || Number(value("UPLOAD_MAX_MB")) <= 0)) {
  errors.push("UPLOAD_MAX_MB must be a positive number.");
}

console.log("COSTAATT environment validation");
console.log(`Mode: ${production ? "production" : "development"}`);
console.log(`Loaded files: ${loadedFiles.length ? loadedFiles.join(", ") : "none"}`);

for (const warning of warnings) console.warn(`Warning: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`Error: ${error}`);
  console.error(`Validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log("Environment validation passed.");
