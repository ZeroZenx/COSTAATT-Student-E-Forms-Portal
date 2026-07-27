import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
  delete process.env.SETTINGS_ENCRYPTION_KEY;
  delete process.env.UPLOAD_MAX_MB;
});

describe("protected operational settings", () => {
  it("encrypts and decrypts SMTP credentials with AES-GCM", async () => {
    process.env.SETTINGS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const { protectSettingSecret, revealSettingSecret } = await import("../lib/settings-crypto");

    const encrypted = protectSettingSecret("smtp-password");

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain("smtp-password");
    expect(revealSettingSecret(encrypted)).toBe("smtp-password");
  });

  it("requires an encryption key before saving production SMTP credentials", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const { protectSettingSecret } = await import("../lib/settings-crypto");

    expect(() => protectSettingSecret("smtp-password")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
  });
});

describe("post-commit work", () => {
  it("logs a failed side effect without rejecting the saved operation", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { runPostCommitTasks } = await import("../lib/side-effects");

    await expect(runPostCommitTasks([{
      name: "email",
      run: async () => {
        throw new Error("SMTP unavailable");
      }
    }])).resolves.toHaveLength(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("post_commit_task_failed"));
  });
});

describe("attachment content validation", () => {
  it("rejects a file whose contents do not match its declared PDF type", async () => {
    const { storeAttachment } = await import("../lib/storage");
    const disguisedFile = new File(["not a real PDF"], "approval.pdf", { type: "application/pdf" });

    await expect(storeAttachment(disguisedFile)).rejects.toThrow(/contents do not match/);
  });

  it("rejects a filename extension that does not match the declared type", async () => {
    const { storeAttachment } = await import("../lib/storage");
    const mismatchedFile = new File(["%PDF-1.7"], "approval.png", { type: "application/pdf" });

    await expect(storeAttachment(mismatchedFile)).rejects.toThrow(/filename extension does not match/);
  });
});
