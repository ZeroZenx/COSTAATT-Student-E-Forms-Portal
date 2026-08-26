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
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from reference_delete_operations) as delete_operation_count,
      (select count(*)::int from reference_delete_rows) as delete_row_count
  `);

  await client.query(fs.readFileSync("db/migrations/003_reference_delete_unreferenced_crns.sql", "utf8"));

  const after = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from reference_delete_operations) as delete_operation_count,
      (select count(*)::int from reference_delete_rows) as delete_row_count,
      exists (
        select 1
          from pg_constraint
         where conrelid = 'public.reference_delete_operations'::regclass
           and conname = 'reference_delete_operations_operation_type_check'
           and pg_get_constraintdef(oid) ilike '%delete_unreferenced%'
      ) as operation_constraint_ready
  `);
  const beforeCounts = before.rows[0];
  const afterCounts = after.rows[0];
  for (const key of ["reference_count", "submission_count", "delete_operation_count", "delete_row_count"]) {
    if (beforeCounts[key] !== afterCounts[key]) throw new Error(`Safety check failed: ${key} changed during migration.`);
  }
  if (!afterCounts.operation_constraint_ready) throw new Error("Safety check failed: the new operation type constraint was not installed.");

  await client.query("commit");
  console.log(JSON.stringify({
    applied: true,
    operationType: "delete_unreferenced",
    referenceCount: afterCounts.reference_count,
    submissionCount: afterCounts.submission_count,
    deleteOperationCount: afterCounts.delete_operation_count,
    deleteRowCount: afterCounts.delete_row_count
  }, null, 2));
} catch (error) {
  try { await client.query("rollback"); } catch { /* preserve original error */ }
  throw error;
} finally {
  await client.end();
}
