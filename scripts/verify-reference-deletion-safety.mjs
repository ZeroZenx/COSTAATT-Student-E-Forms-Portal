import fs from "node:fs";
import { Client } from "pg";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!fs.existsSync(".env.local")) return "";
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  return line ? line.slice("DATABASE_URL=".length).trim().replace(/^['\"]|['\"]$/g, "") : "";
}

const client = new Client({ connectionString: databaseUrl(), statement_timeout: 15000 });
if (!databaseUrl()) throw new Error("DATABASE_URL is required.");
await client.connect();
try {
  await client.query("begin read only");
  const result = await client.query(`
    select
      (select count(*)::int from reference_records) as reference_count,
      (select count(*)::int from submissions) as submission_count,
      (select count(*)::int from custom_audit_logs) as audit_count,
      (select count(*)::int from reference_delete_operations) as delete_operation_count,
      (select count(*)::int from reference_delete_rows) as delete_row_count,
      to_regclass('public.custom_audit_logs') as audit_table,
      to_regclass('public.reference_delete_operations') as operations_table,
      to_regclass('public.reference_delete_rows') as rows_table,
      to_regclass('public.custom_audit_logs_created_at_idx') as audit_created_index,
      to_regclass('public.reference_delete_operations_created_at_idx') as operations_created_index,
      to_regclass('public.reference_delete_rows_operation_status_idx') as rows_status_index
  `);
  const indexes = await client.query(`
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and indexname in ('custom_audit_logs_target_idx', 'custom_audit_logs_created_at_idx', 'reference_delete_operations_created_at_idx', 'reference_delete_operations_kind_status_idx', 'reference_delete_rows_operation_status_idx', 'reference_delete_rows_record_idx')
    order by indexname
  `);
  console.log(JSON.stringify({ readOnly: true, counts: result.rows[0], indexes: indexes.rows.map((row) => row.indexname) }, null, 2));
  await client.query("rollback");
} finally {
  await client.end();
}
