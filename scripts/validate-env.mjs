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
  return ["replace-me", "replace-with", "example.edu", "example.com", "password"].some((placeholder) =>
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
const emailConfigSource = value("EMAIL_CONFIG_SOURCE") || "admin";
if (!["log", "smtp"].includes(emailMode)) errors.push("EMAIL_DELIVERY_MODE must be either log or smtp.");
if (!["admin", "environment"].includes(emailConfigSource)) errors.push("EMAIL_CONFIG_SOURCE must be either admin or environment.");

validateUrl("PORTAL_BASE_URL", { requireHttps: production, forbidLocalhost: production });
validateUrl("QUICKLAUNCH_JWT_ISSUER");

if (production) {
  if (value("NODE_ENV") !== "production") errors.push("NODE_ENV must be set to production for production validation and startup.");
  requireVar("DATABASE_URL", "production must persist submissions in Postgres.");
  requireVar("PORTAL_BASE_URL", "production emails and direct links need the public portal URL.");
  requireVar("QUICKLAUNCH_JWT_SECRET", "QuickLaunch JWT is the required production SSO mode for the first deployment.");
  requireVar("QUICKLAUNCH_JWT_ISSUER", "QuickLaunch tokens must be restricted to the expected issuer.");
  requireVar("QUICKLAUNCH_JWT_AUDIENCE", "QuickLaunch tokens must be restricted to this application.");
  requireVar("SETTINGS_ENCRYPTION_KEY", "admin-managed SMTP credentials must be encrypted at rest.");

  const headerMode = value("TRUSTED_SSO_HEADER_MODE") || "signed-token";
  if (headerMode === "claims") {
    requireVar("TRUSTED_SSO_HEADER_NAME", "trusted claim deployments must document the proxy-owned header source.");
    requireVar("TRUSTED_SSO_PROXY_SECRET", "trusted claim headers require a proxy-held shared secret.");
  } else if (!has("QUICKLAUNCH_JWT_SECRET")) {
    errors.push("Production SSO requires QUICKLAUNCH_JWT_SECRET for signed QuickLaunch JWT claims.");
  }

  if (value("ALLOW_MOCK_SSO") === "true") errors.push("ALLOW_MOCK_SSO must not be true in production.");
  if (isPlaceholder("SSO_SHARED_SECRET")) errors.push("SSO_SHARED_SECRET still contains a placeholder value.");
  if (isPlaceholder("QUICKLAUNCH_JWT_SECRET")) errors.push("QUICKLAUNCH_JWT_SECRET still contains a placeholder value.");
  if (isPlaceholder("QUICKLAUNCH_JWT_ISSUER")) errors.push("QUICKLAUNCH_JWT_ISSUER still contains an example value.");
  if (isPlaceholder("SETTINGS_ENCRYPTION_KEY")) errors.push("SETTINGS_ENCRYPTION_KEY still contains a placeholder value.");
  if (has("TRUSTED_SSO_PROXY_SECRET") && isPlaceholder("TRUSTED_SSO_PROXY_SECRET")) errors.push("TRUSTED_SSO_PROXY_SECRET still contains a placeholder value.");
  if (!has("SLA_ESCALATION_SECRET")) warnings.push("SLA_ESCALATION_SECRET is not set. Windows Task Scheduler cannot run SLA escalations without a logged-in system_admin session.");
  if (isPlaceholder("SLA_ESCALATION_SECRET")) errors.push("SLA_ESCALATION_SECRET still contains a placeholder value.");
  if (isPlaceholder("DATABASE_URL")) errors.push("DATABASE_URL still contains a placeholder password.");
  if (has("QUICKLAUNCH_JWT_SECRET") && value("QUICKLAUNCH_JWT_SECRET").length < 32) errors.push("QUICKLAUNCH_JWT_SECRET must be at least 32 characters.");
  if (has("SSO_SHARED_SECRET") && value("SSO_SHARED_SECRET").length < 32) errors.push("SSO_SHARED_SECRET must be at least 32 characters when configured.");
  if (has("SLA_ESCALATION_SECRET") && value("SLA_ESCALATION_SECRET").length < 32) errors.push("SLA_ESCALATION_SECRET must be at least 32 characters.");
  validateSettingsEncryptionKey();
}

if (has("DATABASE_URL") && !value("DATABASE_URL").startsWith("postgres")) warnings.push("DATABASE_URL does not look like a Postgres connection string.");

const s3Names = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
const hasAnyS3 = s3Names.some(has);
const hasAllS3 = s3Names.every(has);
if (hasAnyS3 && !hasAllS3) errors.push("S3 configuration is incomplete. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY together.");
if (production && !hasAllS3) warnings.push("S3 is not fully configured. Production will use local uploads, so the VM upload directory must be backed up.");

if (emailConfigSource === "environment" && emailMode === "smtp") {
  requireVar("SMTP_HOST", "SMTP mode needs a mail server.");
  requireVar("SMTP_PORT", "SMTP mode needs a port, usually 587.");
  requireVar("SMTP_FROM", "SMTP mode needs a from address.");
  if (has("SMTP_USER") !== has("SMTP_PASSWORD")) errors.push("SMTP_USER and SMTP_PASSWORD must be set together when SMTP auth is required.");
} else if (emailConfigSource === "environment") {
  warnMissing("REGISTRY_NOTIFICATION_EMAIL", "Registry notifications will fall back to registrar@costaatt.edu.tt.");
} else if (production) {
  warnings.push("Email uses admin-managed settings. Confirm SMTP mode and send a test message from /admin/diagnostics before go-live.");
}

if (has("UPLOAD_MAX_MB") && (!Number.isFinite(Number(value("UPLOAD_MAX_MB"))) || Number(value("UPLOAD_MAX_MB")) <= 0)) {
  errors.push("UPLOAD_MAX_MB must be a positive number.");
}

for (const numericName of ["PG_POOL_MAX", "PG_IDLE_TIMEOUT_MS", "PG_CONNECTION_TIMEOUT_MS", "PG_MAX_USES", "PG_STATEMENT_TIMEOUT_MS", "QUICKLAUNCH_JWT_CLOCK_TOLERANCE_SECONDS"]) {
  if (has(numericName) && (!Number.isFinite(Number(value(numericName))) || Number(value(numericName)) <= 0)) {
    errors.push(`${numericName} must be a positive number.`);
  }
}

if (production && has("PG_POOL_MAX") && Number(value("PG_POOL_MAX")) < 10) {
  warnings.push("PG_POOL_MAX is below 10. For 100+ users, start around 20 per app process unless the database has a lower connection limit.");
}

function validateSettingsEncryptionKey() {
  if (!has("SETTINGS_ENCRYPTION_KEY") || isPlaceholder("SETTINGS_ENCRYPTION_KEY")) return;
  const raw = value("SETTINGS_ENCRYPTION_KEY");
  const decoded = /^[a-fA-F0-9]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (decoded.length !== 32) errors.push("SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes.");
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
