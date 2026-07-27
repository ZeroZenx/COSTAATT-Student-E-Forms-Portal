import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { formDefinitions } from "./forms";
import { protectSettingSecret, revealSettingSecret, settingSecretIsProtected } from "./settings-crypto";
import type { FormType } from "./types";

export type FormAvailability = {
  formType: FormType;
  status: "open" | "closed";
  notice: string;
  updatedAt: string;
};

export type SystemSettings = {
  portalBaseUrl: string;
  registryNotificationEmail: string;
  emailDeliveryMode: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpFrom: string;
  smtpSecure: boolean;
  uploadMaxMb: number;
  uploadTypes: string;
  semesters: string[];
  updatedAt: string;
};

export type AdminSettings = {
  forms: Record<FormType, FormAvailability>;
  system: SystemSettings;
};

const settingsPath = path.join(process.cwd(), "data", "admin-settings.json");

function defaultSettings(): AdminSettings {
  const now = new Date().toISOString();
  return {
    forms: Object.keys(formDefinitions).reduce((forms, formType) => {
      forms[formType as FormType] = {
        formType: formType as FormType,
        status: "open",
        notice: "",
        updatedAt: now
      };
      return forms;
    }, {} as Record<FormType, FormAvailability>),
    system: {
      portalBaseUrl: process.env.PORTAL_BASE_URL || "http://localhost:5001",
      registryNotificationEmail: process.env.REGISTRY_NOTIFICATION_EMAIL || "registrar@costaatt.edu.tt",
      emailDeliveryMode: process.env.EMAIL_DELIVERY_MODE || "log",
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: Number(process.env.SMTP_PORT || 587),
      smtpUser: process.env.SMTP_USER || "",
      smtpPassword: "",
      smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "registry@costaatt.edu.tt",
      smtpSecure: process.env.SMTP_SECURE === "true",
      uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 8),
      uploadTypes: "PDF, PNG, JPG",
      semesters: defaultSemesters(),
      updatedAt: now
    }
  };
}

export async function getAdminSettings() {
  let source: string;
  try {
    source = await readFile(settingsPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const settings = defaultSettings();
    await writeAdminSettings(settings);
    return settings;
  }

  const parsed = JSON.parse(source) as AdminSettings;
  const storedPassword = parsed.system?.smtpPassword;
  const settings = mergeDefaults(parsed);
  settings.system.smtpPassword = revealSettingSecret(settings.system.smtpPassword);
  if (storedPassword && !settingSecretIsProtected(storedPassword) && process.env.SETTINGS_ENCRYPTION_KEY) {
    await writeAdminSettings(settings);
  }
  return settings;
}

export async function updateFormAvailability(input: Partial<FormAvailability> & { formType: FormType }) {
  const settings = await getAdminSettings();
  settings.forms[input.formType] = {
    ...settings.forms[input.formType],
    formType: input.formType,
    status: input.status || settings.forms[input.formType].status,
    notice: input.notice ?? settings.forms[input.formType].notice,
    updatedAt: new Date().toISOString()
  };
  await writeAdminSettings(settings);
  return settings.forms[input.formType];
}

export async function updateSystemSettings(input: Partial<SystemSettings>) {
  const settings = await getAdminSettings();
  settings.system = {
    ...settings.system,
    portalBaseUrl: input.portalBaseUrl ?? settings.system.portalBaseUrl,
    registryNotificationEmail: input.registryNotificationEmail ?? settings.system.registryNotificationEmail,
    emailDeliveryMode: input.emailDeliveryMode ?? settings.system.emailDeliveryMode,
    smtpHost: input.smtpHost ?? settings.system.smtpHost,
    smtpPort: Number(input.smtpPort ?? settings.system.smtpPort),
    smtpUser: input.smtpUser ?? settings.system.smtpUser,
    smtpPassword: input.smtpPassword === "" || input.smtpPassword === undefined ? settings.system.smtpPassword : input.smtpPassword,
    smtpFrom: input.smtpFrom ?? settings.system.smtpFrom,
    smtpSecure: Boolean(input.smtpSecure ?? settings.system.smtpSecure),
    uploadMaxMb: Number(input.uploadMaxMb ?? settings.system.uploadMaxMb),
    uploadTypes: input.uploadTypes ?? settings.system.uploadTypes,
    semesters: normalizeSemesters(input.semesters ?? settings.system.semesters),
    updatedAt: new Date().toISOString()
  };
  await writeAdminSettings(settings);
  return settings.system;
}

export async function getFormAvailability(formType: FormType) {
  return (await getAdminSettings()).forms[formType];
}

export async function assertFormOpen(formType: FormType) {
  const form = await getFormAvailability(formType);
  if (form.status === "closed") throw new Error(form.notice || "This form is currently closed.");
}

async function writeAdminSettings(settings: AdminSettings) {
  const storedSettings: AdminSettings = {
    ...settings,
    system: {
      ...settings.system,
      smtpPassword: protectSettingSecret(settings.system.smtpPassword)
    }
  };
  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(storedSettings, null, 2), { mode: 0o600 });
}

function mergeDefaults(settings: AdminSettings): AdminSettings {
  const defaults = defaultSettings();
  return {
    forms: { ...defaults.forms, ...(settings.forms || {}) },
    system: { ...defaults.system, ...(settings.system || {}), semesters: normalizeSemesters(settings.system?.semesters || defaults.system.semesters) }
  };
}

function defaultSemesters() {
  return ["Semester 1", "Semester 2", "Summer"];
}

function normalizeSemesters(values?: string[]) {
  const cleaned = (values || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned)).length > 0 ? Array.from(new Set(cleaned)) : defaultSemesters();
}
