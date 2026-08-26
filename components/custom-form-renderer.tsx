"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import type { CustomFormField, CustomFormRecord, SsoUser } from "@/lib/types";

const steps = ["Complete form", "Review", "Confirmation"];

export default function CustomFormRenderer({ form, user, preview = false }: { form: CustomFormRecord; user: SsoUser; preview?: boolean }) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sortedFields = useMemo(() => [...form.fields].sort((left, right) => left.sortOrder - right.sortOrder), [form.fields]);

  async function submit() {
    if (preview) {
      setMessage("Preview mode does not submit data.");
      setStep(2);
      return;
    }
    setSubmitting(true);
    setMessage("");
    const data = new FormData();
    data.set("responses", JSON.stringify(responses));
    Object.entries(files).forEach(([key, file]) => data.set(key, file));
    const response = await fetch(`/api/custom-forms/${form.id}/submissions`, { method: "POST", body: data });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error || "Submission could not be saved.");
      return;
    }
    setMessage(`Submitted successfully. Reference ${result.submission.id.slice(0, 8).toUpperCase()}.`);
    setStep(2);
  }

  return (
    <section className="wizard-layout">
      <aside className="step-rail">
        {steps.map((label, index) => (
          <button key={label} type="button" className={step === index ? "active" : index < step ? "complete" : ""} onClick={() => setStep(index)}>
            <span>{index < step ? <Check size={15} /> : index + 1}</span>
            {label}
          </button>
        ))}
      </aside>
      <form className="form-surface" onSubmit={(event) => event.preventDefault()}>
        {step === 0 ? (
          <div className="form-section">
            <h2>{form.title}</h2>
            <p className="empty-state">{form.description}</p>
            <div className="field-grid">
              {sortedFields.map((field) => (
                <DynamicField
                  field={field}
                  key={field.id}
                  user={user}
                  value={responses[field.key]}
                  file={files[field.key]}
                  onChange={(value) => setResponses((current) => ({ ...current, [field.key]: value }))}
                  onFile={(file) => setFiles((current) => file ? { ...current, [field.key]: file } : current)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-section">
            <h2>Review before submit</h2>
            <div className="review-list">
              {sortedFields.filter((field) => !["section_header", "instructions"].includes(field.type)).map((field) => (
                <div key={field.id}>
                  <span>{field.label}</span>
                  <strong>{displayValue(field, responses[field.key], files[field.key], user)}</strong>
                </div>
              ))}
            </div>
            {message && !message.startsWith("Submitted") ? <p className="error-message">{message}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-section">
            <h2>{message.startsWith("Submitted") ? "Request submitted" : "Preview complete"}</h2>
            <p className={message.startsWith("Submitted") ? "success-message" : "notice-banner"}>{message || "No submission was created."}</p>
          </div>
        ) : null}

        <div className="wizard-actions">
          <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <ChevronLeft size={17} /> Back
          </button>
          {step === 0 ? (
            <button type="button" className="primary-button" onClick={() => setStep(1)}>
              Continue <ChevronRight size={17} />
            </button>
          ) : null}
          {step === 1 ? (
            <button type="button" className="primary-button" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting..." : preview ? "Finish preview" : "Submit request"}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function DynamicField({
  field,
  user,
  value,
  file,
  onChange,
  onFile
}: {
  field: CustomFormField;
  user: SsoUser;
  value: unknown;
  file?: File;
  onChange: (value: unknown) => void;
  onFile: (file?: File) => void;
}) {
  if (field.type === "section_header") return <h2 className="custom-section-heading">{field.label}</h2>;
  if (field.type === "instructions") return <p className="notice-banner">{field.helpText || field.label}</p>;
  if (field.type === "student_profile") return <ReadOnlyField label={field.label} value={String(profileValue(field.profileBinding, user))} />;
  if (field.type === "long_text") return <TextAreaField field={field} value={String(value || "")} onChange={onChange} />;
  if (field.type === "dropdown") return <SelectField field={field} value={String(value || "")} onChange={onChange} />;
  if (field.type === "multi_select") return <OptionGroup field={field} value={Array.isArray(value) ? value.map(String) : []} onChange={onChange} multiple />;
  if (field.type === "radio") return <OptionGroup field={field} value={String(value || "")} onChange={onChange} />;
  if (field.type === "checkbox" || field.type === "declaration_checkbox") {
    return (
      <label className="declaration-list single">
        <span>
          <input type="checkbox" checked={Boolean(value)} required={field.required} onChange={(event) => onChange(event.target.checked)} />
          {field.label}{field.required ? " *" : ""}
        </span>
      </label>
    );
  }
  if (field.type === "file_upload") {
    return (
      <label className="upload-zone">
        <UploadCloud size={28} />
        <strong>{file?.name || field.label}</strong>
        <span>{field.helpText || "Upload an attachment"}</span>
        <input type="file" required={field.required} onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
    );
  }
  return (
    <label className="field">
      {field.label}{field.required ? " *" : ""}
      <input type={inputType(field.type)} required={field.required} value={String(value || "")} onChange={(event) => onChange(event.target.value)} />
      {field.helpText ? <small>{field.helpText}</small> : null}
    </label>
  );
}

function TextAreaField({ field, value, onChange }: { field: CustomFormField; value: string; onChange: (value: unknown) => void }) {
  return (
    <label className="textarea-field">
      {field.label}{field.required ? " *" : ""}
      <textarea required={field.required} value={value} onChange={(event) => onChange(event.target.value)} />
      {field.helpText ? <small>{field.helpText}</small> : null}
    </label>
  );
}

function SelectField({ field, value, onChange }: { field: CustomFormField; value: string; onChange: (value: unknown) => void }) {
  return (
    <label className="field">
      {field.label}{field.required ? " *" : ""}
      <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        {(field.options || []).map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function OptionGroup({ field, value, onChange, multiple = false }: { field: CustomFormField; value: string[] | string; onChange: (value: unknown) => void; multiple?: boolean }) {
  return (
    <fieldset className="request-type-picker">
      <legend>{field.label}{field.required ? " *" : ""}</legend>
      {(field.options || []).map((option) => (
        <label key={option}>
          <input
            type={multiple ? "checkbox" : "radio"}
            name={field.key}
            checked={multiple ? (value as string[]).includes(option) : value === option}
            onChange={() => {
              if (!multiple) onChange(option);
              else onChange((value as string[]).includes(option) ? (value as string[]).filter((item) => item !== option) : [...(value as string[]), option]);
            }}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field readonly">
      {label}
      <input value={value} readOnly />
    </label>
  );
}

function inputType(type: CustomFormField["type"]) {
  if (type === "email") return "email";
  if (type === "phone") return "tel";
  if (type === "date") return "date";
  return "text";
}

function displayValue(field: CustomFormField, value: unknown, file: File | undefined, user: SsoUser) {
  if (field.type === "student_profile") return String(profileValue(field.profileBinding, user));
  if (field.type === "file_upload") return file?.name || "No file selected";
  if (Array.isArray(value)) return value.join(", ") || "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value || "Not provided");
}

function profileValue(binding: CustomFormField["profileBinding"], user: SsoUser) {
  if (binding === "studentId") return user.studentId;
  if (binding === "firstName") return user.firstName;
  if (binding === "lastName") return user.lastName;
  if (binding === "email") return user.email;
  if (binding === "fullName") return `${user.firstName} ${user.lastName}`;
  return "";
}
