"use client";

import { useMemo, useState } from "react";
import type { ReferenceKind, ReferenceRecord } from "@/lib/reference-admin";

const kinds: { value: ReferenceKind; label: string }[] = [
  { value: "course", label: "Courses" },
  { value: "crn", label: "CRNs" },
  { value: "lecturer", label: "Lecturers" },
  { value: "advisor", label: "Advisors" },
  { value: "programme_mapping", label: "Programme mappings" }
];

type Draft = {
  id?: string;
  key: string;
  label: string;
  email: string;
  courseCode: string;
  courseTitle: string;
  crn: string;
  campus: string;
  section: string;
  term: string;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: "advisor" | "lecturer";
  programme: string;
};

const emptyDraft: Draft = {
  key: "",
  label: "",
  email: "",
  courseCode: "",
  courseTitle: "",
  crn: "",
  campus: "",
  section: "",
  term: "",
  reviewerName: "",
  reviewerEmail: "",
  reviewerRole: "advisor",
  programme: ""
};

export default function ReferenceDataAdmin({ initialRecords, initialKind = "course" }: { initialRecords: ReferenceRecord[]; initialKind?: ReferenceKind }) {
  const [records, setRecords] = useState(initialRecords);
  const [kind, setKind] = useState<ReferenceKind>(initialKind);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return records.filter((record) => record.kind === kind && (!needle || JSON.stringify(record).toLowerCase().includes(needle)));
  }, [kind, query, records]);

  function switchKind(nextKind: ReferenceKind) {
    setKind(nextKind);
    setDraft(emptyDraft);
    setMessage("");
  }

  function editRecord(record: ReferenceRecord) {
    setMessage("");
    setDraft({
      ...emptyDraft,
      id: record.id,
      key: record.key,
      label: record.label,
      email: record.email || String(record.data.email || record.data.reviewerEmail || record.data.advisorEmail || ""),
      courseCode: String(record.data.courseCode || record.key || ""),
      courseTitle: String(record.data.courseTitle || record.label || ""),
      crn: String(record.data.crn || (record.kind === "crn" ? record.key : "")),
      campus: String(record.data.campus || ""),
      section: String(record.data.section || ""),
      term: String(record.data.term || ""),
      reviewerName: String(record.data.reviewerName || record.data.advisorName || record.data.name || record.label || ""),
      reviewerEmail: String(record.data.reviewerEmail || record.data.advisorEmail || record.data.email || record.email || ""),
      reviewerRole: String(record.data.reviewerRole || "advisor") === "lecturer" ? "lecturer" : "advisor",
      programme: String(record.data.programme || record.key || "")
    });
  }

  async function saveRecord() {
    setMessage("");
    const payload = buildPayload(kind, draft);
    const response = await fetch(draft.id ? `/api/admin/reference-data/${draft.id}` : "/api/admin/reference-data", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Record could not be saved.");
      return;
    }
    setRecords((current) => {
      const exists = current.some((record) => record.id === result.record.id);
      return exists
        ? current.map((record) => record.id === result.record.id ? result.record : record)
        : [result.record, ...current];
    });
    setDraft(emptyDraft);
    setMessage("Reference record saved.");
  }

  async function deactivate(id: string) {
    const response = await fetch(`/api/admin/reference-data/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: false })
    });
    const result = await response.json();
    if (response.ok) {
      setRecords((current) => current.map((record) => record.id === id ? result.record : record));
    } else {
      setMessage(result.error || "Record could not be deactivated.");
    }
  }

  return (
    <section className="reference-layout">
      <aside className="step-rail">
        {kinds.map((item) => (
          <button key={item.value} className={item.value === kind ? "active" : ""} onClick={() => switchKind(item.value)}>
            <span>{records.filter((record) => record.kind === item.value).length}</span>{item.label}
          </button>
        ))}
      </aside>
      <div className="detail-panel">
        <div className="reference-toolbar">
          <input placeholder={`Search ${kind.replace("_", " ")}`} value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="secondary-button" type="button" onClick={() => setDraft(emptyDraft)}>New {kind.replace("_", " ")}</button>
        </div>
        <ReferenceEditor kind={kind} draft={draft} setDraft={setDraft} onSave={saveRecord} />
        {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
        <div className="reference-table">
          <div className="reference-head">
            <span>Key</span>
            <span>Label</span>
            <span>Email</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {filtered.slice(0, 200).map((record) => (
            <div key={record.id} className="reference-row">
              <strong>{record.key}</strong>
              <span>{record.label}</span>
              <span>{record.email || String(record.data.reviewerEmail || record.data.advisorEmail || record.data.email || "")}</span>
              <em className={`status-pill ${record.active ? "status-approved" : "status-declined"}`}>{record.active ? "active" : "inactive"}</em>
              <div className="row-actions">
                <button className="secondary-button" type="button" onClick={() => editRecord(record)}>Edit</button>
                <button className="secondary-button" disabled={!record.active} type="button" onClick={() => deactivate(record.id)}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReferenceEditor({
  kind,
  draft,
  setDraft,
  onSave
}: {
  kind: ReferenceKind;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  onSave: () => void;
}) {
  return (
    <div className="reference-editor">
      {kind === "course" ? (
        <>
          <Field label="Course code" value={draft.courseCode} onChange={(courseCode) => setDraft({ ...draft, courseCode })} />
          <Field label="Course title" value={draft.courseTitle} onChange={(courseTitle) => setDraft({ ...draft, courseTitle })} />
          <Field label="Assigned reviewer" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Reviewer email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
          <RoleSelect draft={draft} setDraft={setDraft} />
        </>
      ) : null}
      {kind === "crn" ? (
        <>
          <Field label="CRN" value={draft.crn} onChange={(crn) => setDraft({ ...draft, crn })} />
          <Field label="Course code" value={draft.courseCode} onChange={(courseCode) => setDraft({ ...draft, courseCode })} />
          <Field label="Course title" value={draft.courseTitle} onChange={(courseTitle) => setDraft({ ...draft, courseTitle })} />
          <Field label="Campus" value={draft.campus} onChange={(campus) => setDraft({ ...draft, campus })} />
          <Field label="Section" value={draft.section} onChange={(section) => setDraft({ ...draft, section })} />
          <Field label="Term" value={draft.term} onChange={(term) => setDraft({ ...draft, term })} />
          <Field label="Assigned reviewer" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Reviewer email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
          <RoleSelect draft={draft} setDraft={setDraft} />
        </>
      ) : null}
      {kind === "lecturer" || kind === "advisor" ? (
        <>
          <Field label="Name" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} />
          <Field label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
        </>
      ) : null}
      {kind === "programme_mapping" ? (
        <>
          <Field label="Programme" value={draft.programme} onChange={(programme) => setDraft({ ...draft, programme })} />
          <Field label="Advisor name" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Advisor email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
        </>
      ) : null}
      <button className="primary-button" type="button" onClick={onSave}>{draft.id ? "Save changes" : "Add record"}</button>
    </div>
  );
}

function RoleSelect({ draft, setDraft }: { draft: Draft; setDraft: (draft: Draft) => void }) {
  return (
    <label className="field">
      Reviewer role
      <select value={draft.reviewerRole} onChange={(event) => setDraft({ ...draft, reviewerRole: event.target.value as Draft["reviewerRole"] })}>
        <option value="advisor">Advisor</option>
        <option value="lecturer">Lecturer</option>
      </select>
    </label>
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

function buildPayload(kind: ReferenceKind, draft: Draft) {
  if (kind === "course") {
    return {
      id: draft.id,
      kind,
      key: draft.courseCode,
      label: draft.courseTitle || draft.courseCode,
      email: draft.reviewerEmail || undefined,
      data: {
        courseCode: draft.courseCode,
        courseTitle: draft.courseTitle,
        reviewerName: draft.reviewerName,
        reviewerEmail: draft.reviewerEmail,
        reviewerRole: draft.reviewerRole
      }
    };
  }
  if (kind === "crn") {
    return {
      id: draft.id,
      kind,
      key: draft.crn,
      label: draft.courseTitle || draft.courseCode || draft.crn,
      email: draft.reviewerEmail || undefined,
      data: {
        crn: draft.crn,
        courseCode: draft.courseCode,
        courseTitle: draft.courseTitle,
        campus: draft.campus,
        section: draft.section,
        term: draft.term,
        reviewerName: draft.reviewerName,
        reviewerEmail: draft.reviewerEmail,
        reviewerRole: draft.reviewerRole
      }
    };
  }
  if (kind === "programme_mapping") {
    return {
      id: draft.id,
      kind,
      key: draft.programme,
      label: draft.programme,
      email: draft.reviewerEmail || undefined,
      data: {
        programme: draft.programme,
        advisorName: draft.reviewerName,
        advisorEmail: draft.reviewerEmail
      }
    };
  }
  return {
    id: draft.id,
    kind,
    key: draft.email,
    label: draft.label,
    email: draft.email,
    data: {
      name: draft.label,
      email: draft.email
    }
  };
}
