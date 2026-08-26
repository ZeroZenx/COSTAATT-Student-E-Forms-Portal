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

function normalizedUrl(name) {
  try {
    return new URL(value(name)).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

const emailMode = value("EMAIL_DELIVERY_MODE") || "log";
const supportedSamlNameIdFormats = new Set([
  "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"
]);
if (!["log", "smtp"].includes(emailMode)) errors.push("EMAIL_DELIVERY_MODE must be either log or smtp.");

validateUrl("PORTAL_BASE_URL", { requireHttps: production, forbidLocalhost: production });

if (production) {
  if (value("NODE_ENV") !== "production") errors.push("NODE_ENV must be set to production for production validation and startup.");
  requireVar("DATABASE_URL", "production must persist submissions in Postgres.");
  requireVar("PORTAL_BASE_URL", "production emails and direct links need the public portal URL.");
  requireVar("SSO_SHARED_SECRET", "production session cookies must use a configured signing secret.");
  if (value("SAML_ENABLED") !== "true") {
    requireVar("QUICKLAUNCH_JWT_SECRET", "QuickLaunch JWT is required unless SAML_ENABLED=true.");
  }

  const headerMode = value("TRUSTED_SSO_HEADER_MODE") || "signed-token";
  if (headerMode === "claims") {
    requireVar("TRUSTED_SSO_HEADER_NAME", "trusted claim deployments must document the proxy-owned header source.");
  } else if (value("SAML_ENABLED") !== "true" && !has("QUICKLAUNCH_JWT_SECRET")) {
    errors.push("Production SSO requires QUICKLAUNCH_JWT_SECRET or SAML_ENABLED=true with SAML configuration.");
  }

  if (value("ALLOW_MOCK_SSO") === "true") errors.push("ALLOW_MOCK_SSO must not be true in production.");
  if (isPlaceholder("SSO_SHARED_SECRET")) errors.push("SSO_SHARED_SECRET still contains a placeholder value.");
  if (has("QUICKLAUNCH_JWT_SECRET") && isPlaceholder("QUICKLAUNCH_JWT_SECRET")) errors.push("QUICKLAUNCH_JWT_SECRET still contains a placeholder value.");
  if (value("SAML_ENABLED") === "true") {
    requireVar("SAML_PUBLIC_BASE_URL", "SAML public redirects need the production HTTPS base URL.");
    requireVar("SAML_SP_ENTITY_ID", "QuickLaunch needs the HTTPS SP entity ID.");
    requireVar("SAML_ACS_URL", "QuickLaunch needs the HTTPS ACS URL.");
    requireVar("SAML_LOGOUT_URL", "QuickLaunch needs the HTTPS logout URL.");
    if (has("SAML_PUBLIC_BASE_URL")) validateUrl("SAML_PUBLIC_BASE_URL", { requireHttps: production, forbidLocalhost: production });
    for (const samlUrlName of ["SAML_SP_ENTITY_ID", "SAML_ACS_URL", "SAML_LOGOUT_URL"]) {
      if (has(samlUrlName)) validateUrl(samlUrlName, { requireHttps: production, forbidLocalhost: production });
    }
    const baseUrl = normalizedUrl("PORTAL_BASE_URL");
    const samlBaseUrl = normalizedUrl("SAML_PUBLIC_BASE_URL");
    if (baseUrl && samlBaseUrl && baseUrl !== samlBaseUrl) errors.push("SAML_PUBLIC_BASE_URL must match PORTAL_BASE_URL.");
    for (const [name, suffix] of [["SAML_SP_ENTITY_ID", "/api/saml/metadata"], ["SAML_ACS_URL", "/api/saml/acs"], ["SAML_LOGOUT_URL", "/api/saml/logout"]]) {
      if (has(name) && samlBaseUrl && normalizedUrl(name) !== `${samlBaseUrl}${suffix}`) errors.push(`${name} must equal SAML_PUBLIC_BASE_URL${suffix}.`);
    }
    if (!supportedSamlNameIdFormats.has(value("SAML_NAMEID_FORMAT"))) {
      errors.push("SAML_NAMEID_FORMAT must be emailAddress or unspecified in production.");
    }
    requireVar("SAML_IDP_METADATA_URL", "SAML mode needs the QuickLaunch metadata URL.");
    requireVar("SAML_IDP_ENTITY_ID", "SAML mode needs the QuickLaunch Entity ID from metadata.");
    requireVar("SAML_IDP_SSO_URL", "SAML mode needs the QuickLaunch SSO endpoint from metadata.");
    requireVar("SAML_IDP_CERT", "SAML mode needs the QuickLaunch signing certificate in the protected service environment.");
    validateUrl("SAML_IDP_METADATA_URL", { requireHttps: production, forbidLocalhost: production });
    validateUrl("SAML_IDP_SSO_URL", { requireHttps: production, forbidLocalhost: production });
    validateUrl("SAML_IDP_LOGOUT_URL", { requireHttps: production, forbidLocalhost: production });
    if (has("SAML_IDP_SSO_BINDING") && !["urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect", "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"].includes(value("SAML_IDP_SSO_BINDING"))) {
      errors.push("SAML_IDP_SSO_BINDING must be the HTTP-Redirect or HTTP-POST SAML binding URI.");
    }
    if (has("SAML_IDP_LOGOUT_BINDING") && !["urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect", "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"].includes(value("SAML_IDP_LOGOUT_BINDING"))) {
      errors.push("SAML_IDP_LOGOUT_BINDING must be the HTTP-Redirect or HTTP-POST SAML binding URI.");
    }
    if (has("SAML_IDP_CERT") && !value("SAML_IDP_CERT").includes("BEGIN CERTIFICATE")) {
      errors.push("SAML_IDP_CERT must contain a PEM-encoded signing certificate.");
    }
    for (const numericSamlName of ["SAML_ACCEPTED_CLOCK_SKEW_MS", "SAML_MAX_ASSERTION_AGE_MS", "SAML_REQUEST_TTL_MS"]) {
      if (has(numericSamlName) && (!Number.isFinite(Number(value(numericSamlName))) || Number(value(numericSamlName)) < 0)) {
        errors.push(`${numericSamlName} must be a non-negative number.`);
      }
    }
    if (has("SAML_ROLE_GROUP_MAP")) {
      try {
        const roleMap = JSON.parse(value("SAML_ROLE_GROUP_MAP"));
        const allowedRoles = ["student", "advisor", "lecturer", "registry_staff", "registry_admin", "system_admin"];
        if (!roleMap || typeof roleMap !== "object" || Array.isArray(roleMap) || Object.keys(roleMap).some((role) => !allowedRoles.includes(role) || !Array.isArray(roleMap[role]))) {
          errors.push("SAML_ROLE_GROUP_MAP must map supported application roles to arrays of AD group names.");
        }
      } catch {
        errors.push("SAML_ROLE_GROUP_MAP must be valid JSON.");
      }
    }
    const productionSamlValues = ["SAML_PUBLIC_BASE_URL", "SAML_SP_ENTITY_ID", "SAML_ACS_URL", "SAML_LOGOUT_URL", "SAML_IDP_METADATA_URL", "SAML_IDP_SSO_URL", "SAML_IDP_LOGOUT_URL"].map(value);
    for (const forbidden of ["10.2.1.26", "eform.costaatt.edu.tt", "localhost"]) {
      if (productionSamlValues.some((candidate) => candidate.toLowerCase().includes(forbidden))) errors.push(`Production SAML configuration must not reference ${forbidden}.`);
    }
    if (value("SAML_REQUIRE_SIGNED_ASSERTIONS") === "false") errors.push("SAML_REQUIRE_SIGNED_ASSERTIONS must not be false in production.");
    if (value("SAML_TRUSTED_APPLICATION_ROLES") === "true") errors.push("SAML_TRUSTED_APPLICATION_ROLES must not be true in production; use explicit SAML_ROLE_GROUP_MAP entries.");
    if (value("SAML_SIGN_AUTHN_REQUESTS") === "true" && !has("SAML_SP_PRIVATE_KEY")) errors.push("SAML_SP_PRIVATE_KEY is required when signing SAML AuthnRequests.");
  }
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

for (const numericName of ["PG_POOL_MAX", "PG_IDLE_TIMEOUT_MS", "PG_CONNECTION_TIMEOUT_MS", "PG_MAX_USES", "PG_STATEMENT_TIMEOUT_MS"]) {
  if (has(numericName) && (!Number.isFinite(Number(value(numericName))) || Number(value(numericName)) <= 0)) {
    errors.push(`${numericName} must be a positive number.`);
  }
}

if (production && has("PG_POOL_MAX") && Number(value("PG_POOL_MAX")) < 10) {
  warnings.push("PG_POOL_MAX is below 10. For 100+ users, start around 20 per app process unless the database has a lower connection limit.");
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
