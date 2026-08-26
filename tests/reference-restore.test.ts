import { describe, expect, it, vi } from "vitest";

async function loadCore() {
  // @ts-expect-error The operator utility is intentionally plain ESM for direct Node execution.
  return import("../scripts/restore-reference-record-core.mjs");
}

const snapshot = {
  id: "00000000-0000-0000-0000-000000000123",
  kind: "crn",
  data: {
    key: "RESTORE-123",
    label: "Restore Test Course",
    email: "reviewer@costaatt.edu.tt",
    data: { crn: "RESTORE-123", courseCode: "TEST 123" }
  },
  active: true,
  created_at: "2026-01-01T00:00:00.000Z"
};

describe("operator reference restore", () => {
  it("locks, checks conflicts, restores only the target, and audits it", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        if (sql.includes("where id = $1")) return { rows: [] };
        if (sql.includes("where kind = $1")) return { rows: [] };
        return { rows: [] };
      })
    };
    const { restoreReferenceRecord } = await loadCore();
    const result = await restoreReferenceRecord(client, snapshot, { identity: "Operator", email: "operator@costaatt.edu.tt" }, "operation-123");
    expect(result.restored).toBe(true);
    expect(calls.some((call) => call.sql.includes("pg_advisory_xact_lock"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("insert into reference_records"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("reference_record.restored"))).toBe(true);
  });

  it("refuses an original-ID conflict before writing anything", async () => {
    const calls: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        calls.push(sql);
        if (sql.includes("where id = $1")) return { rows: [{ id: snapshot.id }] };
        return { rows: [] };
      })
    };
    const { restoreReferenceRecord } = await loadCore();
    await expect(restoreReferenceRecord(client, snapshot, { identity: "Operator", email: "operator@costaatt.edu.tt" })).rejects.toThrow("original ID already exists");
    expect(calls.some((sql) => sql.includes("insert into reference_records"))).toBe(false);
    expect(calls.some((sql) => sql.includes("custom_audit_logs"))).toBe(false);
  });

  it("refuses a natural-key conflict before writing anything", async () => {
    const calls: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        calls.push(sql);
        if (sql.includes("where id = $1")) return { rows: [] };
        if (sql.includes("where kind = $1")) return { rows: [{ id: "conflicting-id" }] };
        return { rows: [] };
      })
    };
    const { restoreReferenceRecord } = await loadCore();
    await expect(restoreReferenceRecord(client, snapshot, { identity: "Operator", email: "operator@costaatt.edu.tt" })).rejects.toThrow("natural key already exists");
    expect(calls.some((sql) => sql.includes("insert into reference_records"))).toBe(false);
    expect(calls.some((sql) => sql.includes("custom_audit_logs"))).toBe(false);
  });
});
