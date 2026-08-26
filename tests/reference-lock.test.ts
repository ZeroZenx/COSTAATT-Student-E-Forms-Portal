import { afterEach, describe, expect, it, vi } from "vitest";

describe("reference-data write transaction", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.DATABASE_URL;
  });

  it("takes the PostgreSQL advisory lock and commits", async () => {
    const statements: string[] = [];
    class FakePool {
      async connect() {
        return { query: async (sql: string) => { statements.push(sql); }, release: () => undefined };
      }
    }
    vi.doMock("pg", () => ({ Pool: FakePool }));
    process.env.DATABASE_URL = "postgres://test";
    const { withReferenceDataWriteTransaction } = await import("../lib/db");
    await withReferenceDataWriteTransaction(async (client) => { await client.query("select 1"); });
    expect(statements).toEqual(["begin", "select pg_advisory_xact_lock($1::bigint)", "select 1", "commit"]);
  });

  it("rolls back all writes when the transaction fails", async () => {
    const statements: string[] = [];
    class FakePool {
      async connect() {
        return { query: async (sql: string) => { statements.push(sql); }, release: () => undefined };
      }
    }
    vi.doMock("pg", () => ({ Pool: FakePool }));
    process.env.DATABASE_URL = "postgres://test";
    const { withReferenceDataWriteTransaction } = await import("../lib/db");
    await expect(withReferenceDataWriteTransaction(async () => { throw new Error("test failure"); })).rejects.toThrow("test failure");
    expect(statements).toEqual(["begin", "select pg_advisory_xact_lock($1::bigint)", "rollback"]);
  });

  it("takes the shared advisory lock for submission/reference consistency", async () => {
    const statements: string[] = [];
    class FakePool {
      async connect() {
        return { query: async (sql: string) => { statements.push(sql); }, release: () => undefined };
      }
    }
    vi.doMock("pg", () => ({ Pool: FakePool }));
    process.env.DATABASE_URL = "postgres://test";
    const { withReferenceDataSharedLockTransaction } = await import("../lib/db");
    await withReferenceDataSharedLockTransaction(async (client) => { await client.query("insert into submissions default values"); });
    expect(statements).toEqual(["begin", "select pg_advisory_xact_lock_shared($1::bigint)", "insert into submissions default values", "commit"]);
  });
});
