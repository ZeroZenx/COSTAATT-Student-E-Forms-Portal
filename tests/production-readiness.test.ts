import { execFileSync } from "child_process";
import { mkdtemp } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete process.env.DATABASE_URL;
  delete process.env.REFERENCE_STORE_PATH;
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
  delete process.env.EMAIL_DELIVERY_MODE;
  delete process.env.QUICKLAUNCH_JWT_SECRET;
  delete process.env.SSO_SHARED_SECRET;
  delete process.env.PORTAL_BASE_URL;
  delete process.env.APP_VERSION;
  delete process.env.GIT_COMMIT;
});

describe("production readiness validation", () => {
  it("requires production mode and QuickLaunch JWT for production validation", () => {
    expect(() => execFileSync("node", ["scripts/validate-env.mjs", "--production"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "development",
        DATABASE_URL: "postgres://costaatt:secret@db.example.edu:5432/costaatt_eforms",
        PORTAL_BASE_URL: "https://portal.costaatt.edu.tt",
        QUICKLAUNCH_JWT_SECRET: "replace-with-quicklaunch-jwt-secret"
      },
      stdio: "pipe"
    })).toThrow();
  });
});

describe("reference data persistence", () => {
  it("keeps local JSON fallback when DATABASE_URL is absent", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "costaatt-reference-"));
    process.env.REFERENCE_STORE_PATH = path.join(dir, "reference-records.json");
    const { listReferenceRecords, referenceStorageMode } = await import("../lib/reference-admin");

    const records = await listReferenceRecords("advisor", "Jerome");

    expect(referenceStorageMode()).toBe("json");
    expect(records.some((record) => record.kind === "advisor")).toBe(true);
  });

  it("uses Postgres reference_records when DATABASE_URL is configured", async () => {
    const rows = [{
      id: "00000000-0000-0000-0000-000000000001",
      kind: "advisor",
      data: {
        key: "advisor@costaatt.edu.tt",
        label: "Advisor One",
        email: "advisor@costaatt.edu.tt",
        data: { name: "Advisor One", email: "advisor@costaatt.edu.tt" }
      },
      active: true,
      created_at: "2026-05-25T00:00:00.000Z",
      updated_at: "2026-05-25T00:00:00.000Z"
    }];
    const query = vi.fn(async () => ({ rows }));
    vi.doMock("pg", () => ({
      Pool: vi.fn(() => ({ query }))
    }));
    process.env.DATABASE_URL = "postgres://costaatt:secret@db.example.edu:5432/costaatt_eforms";
    const { listReferenceRecords, referenceStorageMode } = await import("../lib/reference-admin");

    const records = await listReferenceRecords("advisor", "Advisor One");

    expect(referenceStorageMode()).toBe("postgres");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      key: "advisor@costaatt.edu.tt",
      label: "Advisor One",
      email: "advisor@costaatt.edu.tt"
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("from reference_records"), undefined);
  });
});

describe("health snapshot", () => {
  it("includes non-sensitive build metadata", async () => {
    process.env.APP_VERSION = "1.2.3";
    process.env.GIT_COMMIT = "abc123def456";
    const { productionReadinessSnapshot } = await import("../lib/production-readiness");

    await expect(productionReadinessSnapshot({ includeReferenceCounts: false })).resolves.toMatchObject({
      build: {
        appVersion: "1.2.3",
        gitCommit: "abc123def456"
      }
    });
  });

  it("reports degraded database health when configured Postgres is unreachable", async () => {
    vi.doMock("pg", () => ({
      Pool: vi.fn(() => ({
        query: vi.fn().mockRejectedValue(new Error("connection refused"))
      }))
    }));
    process.env.DATABASE_URL = "postgres://costaatt:secret@db.example.edu:5432/costaatt_eforms";
    const { databaseHealth } = await import("../lib/production-readiness");

    await expect(databaseHealth()).resolves.toMatchObject({
      configured: true,
      state: "degraded"
    });
  });
});
