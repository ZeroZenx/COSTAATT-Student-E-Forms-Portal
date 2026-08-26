import fs from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { csvSerialize, parseCsv } from "../lib/reference-csv";
import { listReferenceRecordsDirect } from "../lib/reference-admin";
import { classifyReferenceImport } from "../lib/reference-import";

const liveCheckEnabled = process.env.RUN_LIVE_REFERENCE_CHECKS === "true";
const kinds = ["course", "crn", "lecturer", "advisor", "programme_mapping"] as const;

describe.skipIf(!liveCheckEnabled)("live PostgreSQL current-data round trip (read-only)", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL && fs.existsSync(".env.local")) {
      const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
      if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
    }
  });

  it.each(kinds)("exports and revalidates current %s data without writes", async (kind) => {
    const allRecords = await listReferenceRecordsDirect();
    const records = allRecords.filter((record) => record.kind === kind);
    const csv = csvSerialize(kind, records);
    const parsed = parseCsv(csv, kind, 10000);
    const classified = classifyReferenceImport(kind, parsed, allRecords);
    expect(parsed).toHaveLength(records.length);
    expect(classified.filter((row) => row.status === "invalid" || row.status === "conflict")).toHaveLength(0);
    expect(classified).toHaveLength(records.length);
    expect(classified.every((row) => ["new", "unchanged", "update"].includes(row.status))).toBe(true);
  });
});
