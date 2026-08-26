import { describe, expect, it, vi } from "vitest";

const { dbQuery } = vi.hoisted(() => ({ dbQuery: vi.fn() }));

vi.mock("../lib/db", () => ({
  hasDatabase: () => true,
  query: dbQuery,
  withReferenceDataWriteTransaction: vi.fn(),
  withTransaction: vi.fn()
}));

import { cleanupReferenceImports } from "../lib/reference-import";

describe("reference import retention cleanup", () => {
  it("uses row expiry from the parent import table", async () => {
    dbQuery.mockResolvedValue({ rows: [] });

    await cleanupReferenceImports();

    expect(dbQuery).toHaveBeenCalledTimes(2);
    expect(dbQuery.mock.calls[0][0]).toContain("delete from reference_imports where summary_expires_at < now()");
    expect(dbQuery.mock.calls[1][0]).toContain("delete from reference_import_rows where import_id in");
    expect(dbQuery.mock.calls[1][0]).toContain("select id from reference_imports where row_expires_at < now()");
    expect(dbQuery.mock.calls[1][0]).not.toMatch(/delete from reference_import_rows where row_expires_at/);
  });
});
