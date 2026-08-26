import fs from "node:fs";
import { Client } from "pg";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!fs.existsSync(".env.local")) return "";
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  return line ? line.slice("DATABASE_URL=".length).trim().replace(/^['\"]|['\"]$/g, "") : "";
}

const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const client = new Client({ connectionString: databaseUrl, statement_timeout: 30000 });
await client.connect();
try {
  await client.query("begin");
  const before = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count
  `);
  await client.query(fs.readFileSync("db/migrations/002_reference_deletion_safety.sql", "utf8"));
  const after = await client.query(`
    select
      to_regclass('public.custom_audit_logs') as audit_table,
      to_regclass('public.reference_delete_operations') as operations_table,
      to_regclass('public.reference_delete_rows') as rows_table,
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count
  `);
  const beforeCounts = before.rows[0];
  const afterCounts = after.rows[0];
  if (beforeCounts.reference_count !== afterCounts.reference_count || beforeCounts.submission_count !== afterCounts.submission_count) {
    throw new Error("Safety check failed: existing reference or submission counts changed during schema migration.");
  }
  await client.query("commit");
  console.log(JSON.stringify({
    applied: true,
    referenceCountBefore: beforeCounts.reference_count,
    referenceCountAfter: afterCounts.reference_count,
    submissionCountBefore: beforeCounts.submission_count,
    submissionCountAfter: afterCounts.submission_count,
    tables: {
      customAuditLogs: afterCounts.audit_table,
      referenceDeleteOperations: afterCounts.operations_table,
      referenceDeleteRows: afterCounts.rows_table
    }
  }, null, 2));
} catch (error) {
  try { await client.query("rollback"); } catch { /* preserve original error */ }
  throw error;
} finally {
  await client.end();
}
