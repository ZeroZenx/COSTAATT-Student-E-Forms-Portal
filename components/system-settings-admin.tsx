"use client";

import { useState } from "react";
import type { SystemSettings } from "@/lib/admin-settings";

export default function SystemSettingsAdmin({ initialSettings, passwordConfigured }: { initialSettings: SystemSettings; passwordConfigured: boolean }) {
  const [settings, setSettings] = useState(initialSettings);
  const [hasPassword, setHasPassword] = useState(passwordConfigured);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [newAcademicYear, setNewAcademicYear] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...settings, smtpPassword })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Settings could not be saved.");
      return;
    }
    setSettings(result.settings);
    setSmtpPassword("");
    setHasPassword(Boolean(result.passwordConfigured));
    setMessage("Settings saved.");
  }

  function addAcademicYear() {
    const value = newAcademicYear.trim();
    if (!value || settings.academicYears.includes(value)) return;
    setSettings({ ...settings, academicYears: [...settings.academicYears, value] });
    setNewAcademicYear("");
  }

  function updateAcademicYear(index: number, value: string) {
    setSettings({
      ...settings,
      academicYears: settings.academicYears.map((academicYear, academicYearIndex) => academicYearIndex === index ? value : academicYear)
    });
  }

  function removeAcademicYear(index: number) {
    setSettings({
      ...settings,
      academicYears: settings.academicYears.filter((_, academicYearIndex) => academicYearIndex !== index)
    });
  }

  function addSemester() {
    const value = newSemester.trim();
    if (!value || settings.semesters.includes(value)) return;
    setSettings({ ...settings, semesters: [...settings.semesters, value] });
    setNewSemester("");
  }

  function updateSemester(index: number, value: string) {
    setSettings({
      ...settings,
      semesters: settings.semesters.map((semester, semesterIndex) => semesterIndex === index ? value : semester)
    });
  }

  function removeSemester(index: number) {
    setSettings({
      ...settings,
      semesters: settings.semesters.filter((_, semesterIndex) => semesterIndex !== index)
    });
  }

  return (
    <section className="settings-card">
      {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
      <div className="field-grid two">
        <Field label="Portal base URL" value={settings.portalBaseUrl} onChange={(portalBaseUrl) => setSettings({ ...settings, portalBaseUrl })} />
        <Field label="Registry notification email" value={settings.registryNotificationEmail} onChange={(registryNotificationEmail) => setSettings({ ...settings, registryNotificationEmail })} />
        <SelectField label="Email delivery mode" value={settings.emailDeliveryMode} options={["log", "smtp"]} onChange={(emailDeliveryMode) => setSettings({ ...settings, emailDeliveryMode })} />
        <Field label="SMTP host" value={settings.smtpHost} onChange={(smtpHost) => setSettings({ ...settings, smtpHost })} />
        <Field label="SMTP port" value={String(settings.smtpPort)} onChange={(smtpPort) => setSettings({ ...settings, smtpPort: Number(smtpPort) })} />
        <Field label="SMTP username / email" value={settings.smtpUser} onChange={(smtpUser) => setSettings({ ...settings, smtpUser })} />
        <Field label={hasPassword ? "SMTP password (saved; leave blank to keep)" : "SMTP password"} value={smtpPassword} type="password" onChange={setSmtpPassword} helperText={hasPassword ? "A password is saved. Enter a new value only when replacing it." : undefined} />
        <Field label="From email" value={settings.smtpFrom} onChange={(smtpFrom) => setSettings({ ...settings, smtpFrom })} />
        <label className="field checkbox-field">
          SMTP secure SSL/TLS
          <input type="checkbox" checked={settings.smtpSecure} onChange={(event) => setSettings({ ...settings, smtpSecure: event.target.checked })} />
        </label>
        <Field label="Upload max MB" value={String(settings.uploadMaxMb)} onChange={(uploadMaxMb) => setSettings({ ...settings, uploadMaxMb: Number(uploadMaxMb) })} />
        <Field label="Upload file types" value={settings.uploadTypes} onChange={(uploadTypes) => setSettings({ ...settings, uploadTypes })} />
      </div>
      <section className="settings-subsection">
        <h2>Academic year options</h2>
        <p>These options appear on all student Registry forms.</p>
        <div className="semester-list">
          {settings.academicYears.map((academicYear, index) => (
            <div className="semester-row" key={`${academicYear}-${index}`}>
              <input aria-label={`Academic year ${index + 1}`} value={academicYear} onChange={(event) => updateAcademicYear(index, event.target.value)} />
              <button className="secondary-button" type="button" onClick={() => removeAcademicYear(index)}>Remove</button>
            </div>
          ))}
          <div className="semester-row">
            <input aria-label="New academic year" placeholder="Add academic year..." value={newAcademicYear} onChange={(event) => setNewAcademicYear(event.target.value)} />
            <button className="secondary-button" type="button" onClick={addAcademicYear}>Add academic year</button>
          </div>
        </div>
      </section>
      <section className="settings-subsection">
        <h2>Semester options</h2>
        <p>These options appear on all student forms.</p>
        <div className="semester-list">
          {settings.semesters.map((semester, index) => (
            <div className="semester-row" key={`${semester}-${index}`}>
              <input aria-label={`Semester ${index + 1}`} value={semester} onChange={(event) => updateSemester(index, event.target.value)} />
              <button className="secondary-button" type="button" onClick={() => removeSemester(index)}>Remove</button>
            </div>
          ))}
          <div className="semester-row">
            <input aria-label="New semester" placeholder="Add semester..." value={newSemester} onChange={(event) => setNewSemester(event.target.value)} />
            <button className="secondary-button" type="button" onClick={addSemester}>Add semester</button>
          </div>
        </div>
      </section>
      <p className="notice-banner">SMTP passwords are encrypted in the local settings file when SETTINGS_ENCRYPTION_KEY is configured. SSO signing keys and other portal secrets remain controlled by environment variables.</p>
      <button className="primary-button" type="button" onClick={save}>Save settings</button>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", helperText }: { label: string; value: string; onChange: (value: string) => void; type?: string; helperText?: string }) {
  return (
    <label className="field">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {helperText ? <small>{helperText}</small> : null}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
