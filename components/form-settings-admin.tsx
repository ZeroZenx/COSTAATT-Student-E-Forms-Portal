"use client";

import { useState } from "react";
import { formDefinitions } from "@/lib/forms";
import type { FormAvailability } from "@/lib/admin-settings";
import type { FormType } from "@/lib/types";

export default function FormSettingsAdmin({ initialForms }: { initialForms: Record<FormType, FormAvailability> }) {
  const [forms, setForms] = useState(initialForms);
  const [message, setMessage] = useState("");

  async function save(formType: FormType) {
    setMessage("");
    const form = forms[formType];
    const response = await fetch("/api/admin/forms", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Form setting could not be saved.");
      return;
    }
    setForms((current) => ({ ...current, [formType]: result.form }));
    setMessage("Form setting saved.");
  }

  return (
    <section className="settings-list">
      {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
      {Object.entries(formDefinitions).map(([formType, definition]) => {
        const typed = formType as FormType;
        const form = forms[typed];
        return (
          <article className="settings-card" key={formType}>
            <div>
              <p className="eyeline">{definition.code}</p>
              <h2>{definition.title}</h2>
            </div>
            <label className="field">
              Status
              <select
                value={form.status}
                onChange={(event) => setForms((current) => ({
                  ...current,
                  [typed]: { ...current[typed], status: event.target.value as FormAvailability["status"] }
                }))}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="textarea-field">
              Student-facing notice
              <textarea
                value={form.notice}
                placeholder="Example: FORM CLOSED. SUBMISSIONS WILL NOT BE PROCESSED."
                onChange={(event) => setForms((current) => ({
                  ...current,
                  [typed]: { ...current[typed], notice: event.target.value }
                }))}
              />
            </label>
            <button className="primary-button" type="button" onClick={() => save(typed)}>Save form setting</button>
          </article>
        );
      })}
    </section>
  );
}
