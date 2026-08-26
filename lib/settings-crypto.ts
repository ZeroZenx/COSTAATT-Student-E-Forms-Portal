import crypto from "crypto";

const ENCRYPTED_PREFIX = "enc:v1:";

export function settingSecretIsProtected(value?: string) {
  return Boolean(value?.startsWith(ENCRYPTED_PREFIX));
}

export function protectSettingSecret(value?: string) {
  if (!value || settingSecretIsProtected(value)) return value || "";
  const key = settingsEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SETTINGS_ENCRYPTION_KEY is required before saving SMTP credentials in production.");
    }
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function revealSettingSecret(value?: string) {
  if (!value || !settingSecretIsProtected(value)) return value || "";
  const key = settingsEncryptionKey();
  if (!key) throw new Error("SETTINGS_ENCRYPTION_KEY is required to read encrypted SMTP credentials.");

  const parts = value.slice(ENCRYPTED_PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("The encrypted SMTP credential is malformed.");

  try {
    const [iv, authTag, encrypted] = parts.map((part) => Buffer.from(part, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("The SMTP credential could not be decrypted. Check SETTINGS_ENCRYPTION_KEY.");
  }
}

function settingsEncryptionKey() {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  const key = /^[a-fA-F0-9]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SETTINGS_ENCRYPTION_KEY must be a 32-byte key encoded as Base64 or 64 hexadecimal characters.");
  }
  return key;
}
