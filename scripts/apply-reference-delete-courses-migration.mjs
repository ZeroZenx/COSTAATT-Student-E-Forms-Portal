import fs from "node:fs";
import { Client } from "pg";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = ".env.local";
  if (!fs.existsSync(envPath)) return "";
  const line = fs.readFileSync(envPath, "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
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
      (select count(*)::int from reference_delete_operations) as operation_count,
      (select count(*)::int from reference_delete_rows) as row_count
  `);

  await client.query(fs.readFileSync("db/migrations/004_reference_delete_courses.sql", "utf8"));

  const after = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from reference_delete_operations) as operation_count,
      (select count(*)::int from reference_delete_rows) as row_count,
      exists (
        select 1 from pg_constraint
         where conrelid = 'public.reference_delete_operations'::regclass
           and conname = 'reference_delete_operations_kind_check'
           and pg_get_constraintdef(oid) ilike '%course%'
      ) as operations_constraint_ready,
      exists (
        select 1 from pg_constraint
         where conrelid = 'public.reference_delete_rows'::regclass
           and conname = 'reference_delete_rows_kind_check'
           and pg_get_constraintdef(oid) ilike '%course%'
      ) as rows_constraint_ready
  `);

  const beforeCounts = before.rows[0];
  const afterCounts = after.rows[0];
  for (const key of ["reference_count", "submission_count", "operation_count", "row_count"]) {
    if (beforeCounts[key] !== afterCounts[key]) throw new Error(`Safety check failed: ${key} changed during migration.`);
  }
  if (!afterCounts.operations_constraint_ready || !afterCounts.rows_constraint_ready) {
    throw new Error("Safety check failed: Course deletion constraints were not installed.");
  }

  await client.query("commit");
  console.log(JSON.stringify({ applied: true, courseDeletion: "individual-only", referenceCount: afterCounts.reference_count, submissionCount: afterCounts.submission_count, operationCount: afterCounts.operation_count, rowCount: afterCounts.row_count }, null, 2));
} catch (error) {
  try { await client.query("rollback"); } catch { /* preserve original error */ }
  throw error;
} finally {
  await client.end();
}
