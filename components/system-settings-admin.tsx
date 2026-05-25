"use client";

import { useState } from "react";
import type { SystemSettings } from "@/lib/admin-settings";

export default function SystemSettingsAdmin({ initialSettings }: { initialSettings: SystemSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Settings could not be saved.");
      return;
    }
    setSettings(result.settings);
    setMessage("Settings saved.");
  }

  return (
    <section className="settings-card">
      {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
      <div className="field-grid two">
        <Field label="Portal base URL" value={settings.portalBaseUrl} onChange={(portalBaseUrl) => setSettings({ ...settings, portalBaseUrl })} />
        <Field label="Registry notification email" value={settings.registryNotificationEmail} onChange={(registryNotificationEmail) => setSettings({ ...settings, registryNotificationEmail })} />
        <Field label="Email delivery mode" value={settings.emailDeliveryMode} onChange={(emailDeliveryMode) => setSettings({ ...settings, emailDeliveryMode })} />
        <Field label="Upload max MB" value={String(settings.uploadMaxMb)} onChange={(uploadMaxMb) => setSettings({ ...settings, uploadMaxMb: Number(uploadMaxMb) })} />
        <Field label="Upload file types" value={settings.uploadTypes} onChange={(uploadTypes) => setSettings({ ...settings, uploadTypes })} />
      </div>
      <p className="notice-banner">Secrets such as SMTP passwords and SSO signing keys remain in environment variables and are not editable here.</p>
      <button className="primary-button" type="button" onClick={save}>Save settings</button>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
