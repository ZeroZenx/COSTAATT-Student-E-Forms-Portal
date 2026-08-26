"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, Plus, Save, Trash2, Upload } from "lucide-react";
import type { CustomEmailTemplate, CustomFieldType, CustomFormField, CustomFormRecord, CustomWorkflowStep } from "@/lib/types";

const fieldTypes: Array<{ value: CustomFieldType; label: string }> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "radio", label: "Radio buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "file_upload", label: "File upload" },
  { value: "declaration_checkbox", label: "Declaration checkbox" },
  { value: "student_profile", label: "Student profile field" },
  { value: "section_header", label: "Section header" },
  { value: "instructions", label: "Instructions text" }
];

export default function CustomFormBuilder({ initialForm }: { initialForm?: CustomFormRecord }) {
  const [form, setForm] = useState<Partial<CustomFormRecord>>(() => initialForm || newFormDraft());
  const [message, setMessage] = useState("");
  const sortedFields = useMemo(() => [...(form.fields || [])].sort((left, right) => left.sortOrder - right.sortOrder), [form.fields]);

  async function save() {
    setMessage("");
    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      department: form.department,
      targetAudience: form.targetAudience,
      openAt: form.openAt,
      closeAt: form.closeAt,
      fields: sortedFields,
      workflowSteps: form.workflowSteps || [],
      emailTemplates: form.emailTemplates || []
    };
    const response = await fetch(form.id ? `/api/admin/custom-forms/${form.id}` : "/api/admin/custom-forms", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Form could not be saved.");
      return;
    }
    setForm(result.form);
    setMessage("Saved.");
  }

  async function action(name: "publish" | "unpublish" | "archive" | "clone") {
    if (!form.id) {
      setMessage("Save the form before using this action.");
      return;
    }
    if (name === "archive" && !window.confirm("Delete this custom form? It will be hidden from staff and students, but existing submissions and audit history will be preserved.")) {
      return;
    }
    const response = await fetch(`/api/admin/custom-forms/${form.id}/${name}`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Action failed.");
      return;
    }
    if (name === "clone") window.location.href = `/admin/custom-forms/${result.form.id}/edit`;
    setForm(result.form);
    setMessage(`${name} complete.`);
  }

  function addField() {
    const next = [...(form.fields || [])];
    next.push({
      id: draftId(),
      key: `field_${next.length + 1}`,
      label: "New field",
      type: "short_text",
      required: false,
      sortOrder: next.length,
      options: []
    });
    setForm({ ...form, fields: next });
  }

  function updateField(id: string, patch: Partial<CustomFormField>) {
    setForm({
      ...form,
      fields: (form.fields || []).map((field) => field.id === id ? { ...field, ...patch } : field)
    });
  }

  function removeField(id: string) {
    setForm({ ...form, fields: (form.fields || []).filter((field) => field.id !== id).map((field, index) => ({ ...field, sortOrder: index })) });
  }

  function moveField(id: string, direction: -1 | 1) {
    const fields = sortedFields;
    const index = fields.findIndex((field) => field.id === id);
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, fields: next.map((field, sortOrder) => ({ ...field, sortOrder })) });
  }

  return (
    <section className="builder-layout">
      <div className="builder-main">
        <section className="settings-card">
          <div className="detail-head">
            <div>
              <p className="eyeline">Form builder</p>
              <h2>{form.title || "New custom e-form"}</h2>
            </div>
            <span className={`status-pill status-${form.status || "draft"}`}>{form.status || "draft"}</span>
          </div>
          <div className="field-grid three">
            <Field label="Title" value={form.title || ""} onChange={(title) => setForm({ ...form, title })} />
            <Field
              label="Slug"
              title="URL-friendly form address. Leave blank to auto-generate from the title, for example graduation-sign-up-2026."
              value={form.slug || ""}
              onChange={(slug) => setForm({ ...form, slug })}
            />
            <Field label="Department" value={form.department || ""} onChange={(department) => setForm({ ...form, department })} />
            <Field label="Target audience" value={form.targetAudience || ""} onChange={(targetAudience) => setForm({ ...form, targetAudience })} />
            <Field label="Open date" type="datetime-local" value={toLocalInput(form.openAt)} onChange={(openAt) => setForm({ ...form, openAt })} />
            <Field label="Close date" type="datetime-local" value={toLocalInput(form.closeAt)} onChange={(closeAt) => setForm({ ...form, closeAt })} />
          </div>
          <label className="textarea-field">
            Description
            <textarea value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
        </section>

        <section className="settings-card">
          <div className="detail-head">
            <div>
              <p className="eyeline">Fields</p>
              <h2>Student form fields</h2>
            </div>
            <button type="button" className="secondary-button" onClick={addField}><Plus size={17} /> Add field</button>
          </div>
          <div className="builder-field-list">
            {sortedFields.map((field, index) => (
              <article className="builder-field" key={field.id}>
                <div className="field-grid three">
                  <Field label="Label" value={field.label} onChange={(label) => updateField(field.id, { label })} />
                  <Field label="Key" value={field.key} onChange={(key) => updateField(field.id, { key })} />
                  <label className="field">
                    Type
                    <select value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as CustomFieldType })}>
                      {fieldTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </label>
                  <Field label="Help text" value={field.helpText || ""} onChange={(helpText) => updateField(field.id, { helpText })} />
                  <Field label="Options" value={(field.options || []).join("\n")} onChange={(value) => updateField(field.id, { options: value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
                  <label className="field">
                    Student profile binding
                    <select value={field.profileBinding || ""} onChange={(event) => updateField(field.id, { profileBinding: event.target.value as CustomFormField["profileBinding"] || undefined })}>
                      <option value="">None</option>
                      <option value="studentId">Student ID</option>
                      <option value="firstName">First name</option>
                      <option value="lastName">Last name</option>
                      <option value="email">Email</option>
                      <option value="fullName">Full name</option>
                    </select>
                  </label>
                </div>
                <div className="row-actions">
                  <label className="toggle-row"><input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} /> Required</label>
                  <button type="button" className="secondary-button" disabled={index === 0} onClick={() => moveField(field.id, -1)}>Move up</button>
                  <button type="button" className="secondary-button" disabled={index === sortedFields.length - 1} onClick={() => moveField(field.id, 1)}>Move down</button>
                  <button type="button" className="secondary-button" onClick={() => removeField(field.id)}><Trash2 size={16} /> Remove</button>
                </div>
              </article>
            ))}
            {sortedFields.length === 0 ? <p className="empty-state">No fields yet.</p> : null}
          </div>
        </section>

        <WorkflowEditor steps={form.workflowSteps || []} onChange={(workflowSteps) => setForm({ ...form, workflowSteps })} />
        <EmailEditor templates={form.emailTemplates || []} onChange={(emailTemplates) => setForm({ ...form, emailTemplates })} />
      </div>

      <aside className="detail-actions">
        <h3>Actions</h3>
        <button type="button" className="primary-button" onClick={save}><Save size={17} /> Save</button>
        <button type="button" className="secondary-button" onClick={() => action("publish")}><Upload size={17} /> Publish</button>
        <button type="button" className="secondary-button" onClick={() => action("unpublish")}>Unpublish</button>
        <button type="button" className="secondary-button" onClick={() => action("clone")}><Copy size={17} /> Clone</button>
        <button type="button" className="secondary-button danger-button" onClick={() => action("archive")}>Delete</button>
        {form.id ? <a className="secondary-button" href={`/admin/custom-forms/${form.id}/preview`}><Eye size={17} /> Preview</a> : null}
        {message ? <p className={message.includes("could") || message.includes("failed") ? "error-message" : "success-message"}>{message}</p> : null}
      </aside>
    </section>
  );
}

function WorkflowEditor({ steps, onChange }: { steps: CustomWorkflowStep[]; onChange: (steps: CustomWorkflowStep[]) => void }) {
  function addStep() {
    onChange([...steps, {
      id: draftId(),
      key: `step_${steps.length + 1}`,
      label: "Review step",
      type: "review",
      sortOrder: steps.length,
      assignee: { name: "", email: "", role: "reviewer" },
      required: true
    }]);
  }

  function updateStep(id: string, patch: Partial<CustomWorkflowStep>) {
    onChange(steps.map((step) => step.id === id ? { ...step, ...patch } : step));
  }

  return (
    <section className="settings-card">
      <div className="detail-head">
        <div>
          <p className="eyeline">Workflow</p>
          <h2>Review and approval routing</h2>
        </div>
        <button type="button" className="secondary-button" onClick={addStep}><Plus size={17} /> Add step</button>
      </div>
      {steps.map((step) => (
        <article className="builder-field" key={step.id}>
          <div className="field-grid three">
            <Field label="Label" value={step.label} onChange={(label) => updateStep(step.id, { label })} />
            <label className="field">
              Step type
              <select value={step.type} onChange={(event) => updateStep(step.id, { type: event.target.value as CustomWorkflowStep["type"] })}>
                <option value="review">Reviewer</option>
                <option value="approval">Approver</option>
                <option value="processing">Final processor</option>
              </select>
            </label>
            <Field label="Assignee name" value={step.assignee.name} onChange={(name) => updateStep(step.id, { assignee: { ...step.assignee, name } })} />
            <Field label="Assignee email" value={step.assignee.email} onChange={(email) => updateStep(step.id, { assignee: { ...step.assignee, email } })} />
            <label className="field">
              Assignee role
              <select value={step.assignee.role} onChange={(event) => updateStep(step.id, { assignee: { ...step.assignee, role: event.target.value as CustomWorkflowStep["assignee"]["role"] } })}>
                <option value="reviewer">Reviewer</option>
                <option value="approver">Approver</option>
                <option value="processor">Processor</option>
              </select>
            </label>
          </div>
        </article>
      ))}
    </section>
  );
}

function EmailEditor({ templates, onChange }: { templates: CustomEmailTemplate[]; onChange: (templates: CustomEmailTemplate[]) => void }) {
  function updateTemplate(id: string, patch: Partial<CustomEmailTemplate>) {
    onChange(templates.map((template) => template.id === id ? { ...template, ...patch } : template));
  }

  return (
    <section className="settings-card">
      <p className="eyeline">Email setup</p>
      <h2>Notification templates</h2>
      <p className="empty-state">Placeholders: {"{student_name}"}, {"{student_id}"}, {"{form_title}"}, {"{submission_id}"}, {"{status}"}, {"{reviewer_name}"}, {"{direct_submission_link}"}</p>
      {templates.map((template) => (
        <article className="builder-field" key={template.id}>
          <div className="field-grid three">
            <Field label="Subject" value={template.subject} onChange={(subject) => updateTemplate(template.id, { subject })} />
            <label className="field">
              Recipient group
              <select value={template.recipientGroup} onChange={(event) => updateTemplate(template.id, { recipientGroup: event.target.value as CustomEmailTemplate["recipientGroup"] })}>
                <option value="requester">Requester</option>
                <option value="reviewer">Reviewer</option>
                <option value="approver">Approver</option>
                <option value="processor">Processor</option>
                <option value="internal">Internal</option>
              </select>
            </label>
            <Field label="CC" value={(template.cc || []).join(", ")} onChange={(cc) => updateTemplate(template.id, { cc: cc.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </div>
          <label className="textarea-field">
            Message body
            <textarea value={template.body} onChange={(event) => updateTemplate(template.id, { body: event.target.value })} />
          </label>
          <label className="toggle-row"><input type="checkbox" checked={template.enabled} onChange={(event) => updateTemplate(template.id, { enabled: event.target.checked })} /> Enabled</label>
        </article>
      ))}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", title }: { label: string; value: string; onChange: (value: string) => void; type?: string; title?: string }) {
  return (
    <label className="field" title={title}>
      <span className="field-label-text">
        {label}
        {title ? <span className="help-dot" aria-label={title}>?</span> : null}
      </span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function newFormDraft(): Partial<CustomFormRecord> {
  return {
    title: "",
    description: "",
    department: "",
    targetAudience: "All students",
    status: "draft",
    fields: [],
    workflowSteps: [],
    emailTemplates: [],
    versionNumber: 0
  };
}

function toLocalInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 16);
}

function draftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
