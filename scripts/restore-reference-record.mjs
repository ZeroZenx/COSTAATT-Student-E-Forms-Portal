import fs from "node:fs";
import { Client } from "pg";
import { restoreReferenceRecord } from "./restore-reference-record-core.mjs";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!fs.existsSync(".env.local")) return "";
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  return line ? line.slice("DATABASE_URL=".length).trim().replace(/^['\"]|['\"]$/g, "") : "";
}

const snapshotFile = argument("snapshot-file");
const operationId = argument("operation-id") || null;
const operatorIdentity = argument("operator-identity");
const operatorEmail = argument("operator-email").toLowerCase();
const confirmation = argument("confirm");

if (!snapshotFile || !operatorIdentity || !operatorEmail || confirmation !== "RESTORE REFERENCE" || process.env.REFERENCE_RESTORE_APPROVED !== "true") {
  throw new Error("Operator restore requires --snapshot-file, operator identity/email, --confirm \"RESTORE REFERENCE\", and REFERENCE_RESTORE_APPROVED=true.");
}

const source = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
const snapshot = source.safe_snapshot || source.safeSnapshot || source;

const client = new Client({ connectionString: databaseUrl(), statement_timeout: 30000 });
if (!databaseUrl()) throw new Error("DATABASE_URL is required.");
await client.connect();
try {
  await client.query("begin");
  const result = await restoreReferenceRecord(client, snapshot, { identity: operatorIdentity, email: operatorEmail }, operationId);
  await client.query("commit");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  try { await client.query("rollback"); } catch { /* preserve original error */ }
  throw error;
} finally {
  await client.end();
}
