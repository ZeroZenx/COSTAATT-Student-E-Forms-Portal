import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { formDefinitions } from "./forms";
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
  uploadMaxMb: number;
  uploadTypes: string;
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
      uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 8),
      uploadTypes: "PDF, PNG, JPG",
      updatedAt: now
    }
  };
}

export async function getAdminSettings() {
  try {
    const parsed = JSON.parse(await readFile(settingsPath, "utf8")) as AdminSettings;
    return mergeDefaults(parsed);
  } catch {
    const settings = defaultSettings();
    await writeAdminSettings(settings);
    return settings;
  }
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
    uploadMaxMb: Number(input.uploadMaxMb ?? settings.system.uploadMaxMb),
    uploadTypes: input.uploadTypes ?? settings.system.uploadTypes,
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
  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));
}

function mergeDefaults(settings: AdminSettings): AdminSettings {
  const defaults = defaultSettings();
  return {
    forms: { ...defaults.forms, ...(settings.forms || {}) },
    system: { ...defaults.system, ...(settings.system || {}) }
  };
}
