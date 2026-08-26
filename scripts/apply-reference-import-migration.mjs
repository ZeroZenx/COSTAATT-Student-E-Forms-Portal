import fs from "node:fs";
import { Client } from "pg";

if (!process.env.DATABASE_URL) {
  const envPath = ".env.local";
  if (fs.existsSync(envPath)) {
    const line = fs.readFileSync(envPath, "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
    if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
  }
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(fs.readFileSync("db/migrations/001_reference_bulk_import.sql", "utf8"));
  const result = await client.query(`
    select
      to_regclass('reference_imports') as imports_table,
      to_regclass('reference_import_rows') as rows_table,
      to_regclass('reference_records_kind_key_active_ci_idx') as ci_index,
      (select count(*)::int from reference_records) as reference_count
  `);
  console.log(JSON.stringify(result.rows[0]));
} finally {
  await client.end();
}
