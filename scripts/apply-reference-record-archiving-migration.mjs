import fs from "node:fs";
import { Client } from "pg";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!fs.existsSync(".env.local")) return "";
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  return line ? line.slice("DATABASE_URL=".length).trim().replace(/^['"]|['"]$/g, "") : "";
}

const url = databaseUrl();
if (!url) throw new Error("DATABASE_URL is required.");

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query("begin");
  const before = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from reference_imports) as import_count,
      (select count(*)::int from reference_delete_operations) as delete_operation_count
  `);

  await client.query(fs.readFileSync("db/migrations/005_reference_record_archiving.sql", "utf8"));

  const after = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from reference_imports) as import_count,
      (select count(*)::int from reference_delete_operations) as delete_operation_count,
      (select count(*)::int from reference_records where archived = true) as archived_count,
      (select count(*)::int from reference_records where archived = true and active = true) as invalid_archive_count,
      exists (select 1 from information_schema.columns where table_name = 'reference_records' and column_name = 'archived') as archived_column_ready,
      exists (select 1 from information_schema.columns where table_name = 'reference_records' and column_name = 'archived_at') as archived_at_column_ready,
      exists (select 1 from pg_constraint where conrelid = 'public.reference_records'::regclass and conname = 'reference_records_archived_inactive_check') as archive_constraint_ready
  `);

  const beforeCounts = before.rows[0];
  const afterCounts = after.rows[0];
  for (const key of ["reference_count", "submission_count", "import_count", "delete_operation_count"]) {
    if (beforeCounts[key] !== afterCounts[key]) throw new Error(`Safety check failed: ${key} changed during migration.`);
  }
  if (Number(afterCounts.invalid_archive_count) !== 0 || !afterCounts.archived_column_ready || !afterCounts.archived_at_column_ready || !afterCounts.archive_constraint_ready) {
    throw new Error("Safety check failed: archive state was not installed safely.");
  }

  await client.query("commit");
  console.log(JSON.stringify({
    applied: true,
    referenceCount: afterCounts.reference_count,
    submissionCount: afterCounts.submission_count,
    importCount: afterCounts.import_count,
    deleteOperationCount: afterCounts.delete_operation_count,
    archivedCount: afterCounts.archived_count
  }, null, 2));
} catch (error) {
  try { await client.query("rollback"); } catch { /* preserve original error */ }
  throw error;
} finally {
  await client.end();
}
