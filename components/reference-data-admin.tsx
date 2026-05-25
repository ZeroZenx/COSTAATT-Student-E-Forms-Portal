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

export default function ReferenceDataAdmin({ initialRecords }: { initialRecords: ReferenceRecord[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [kind, setKind] = useState<ReferenceKind>("course");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ key: "", label: "", email: "" });

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return records.filter((record) => record.kind === kind && (!needle || JSON.stringify(record).toLowerCase().includes(needle)));
  }, [kind, query, records]);

  async function saveRecord() {
    setMessage("");
    const response = await fetch("/api/admin/reference-data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind,
        key: draft.key,
        label: draft.label,
        email: draft.email || undefined,
        data: {
          key: draft.key,
          label: draft.label,
          email: draft.email
        }
      })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Record could not be saved.");
      return;
    }
    setRecords((current) => [result.record, ...current]);
    setDraft({ key: "", label: "", email: "" });
    setMessage("Reference record saved.");
  }

  async function deactivate(id: string) {
    const response = await fetch(`/api/admin/reference-data/${id}`, { method: "PATCH" });
    const result = await response.json();
    if (response.ok) {
      setRecords((current) => current.map((record) => record.id === id ? result.record : record));
    }
  }

  return (
    <section className="reference-layout">
      <aside className="step-rail">
        {kinds.map((item) => (
          <button key={item.value} className={item.value === kind ? "active" : ""} onClick={() => setKind(item.value)}>
            <span>{filtered.length}</span>{item.label}
          </button>
        ))}
      </aside>
      <div className="detail-panel">
        <div className="reference-toolbar">
          <input placeholder="Search records" value={query} onChange={(event) => setQuery(event.target.value)} />
          <input placeholder="Unique key" value={draft.key} onChange={(event) => setDraft({ ...draft, key: event.target.value })} />
          <input placeholder="Label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          <input placeholder="Email if applicable" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          <button className="primary-button" type="button" onClick={saveRecord}>Add record</button>
        </div>
        {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
        <div className="reference-table">
          <div className="reference-head">
            <span>Key</span>
            <span>Label</span>
            <span>Email</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {filtered.slice(0, 150).map((record) => (
            <div key={record.id} className="reference-row">
              <strong>{record.key}</strong>
              <span>{record.label}</span>
              <span>{record.email || String(record.data.advisorEmail || record.data.email || "")}</span>
              <em className={`status-pill ${record.active ? "status-approved" : "status-declined"}`}>{record.active ? "active" : "inactive"}</em>
              <button className="secondary-button" disabled={!record.active} onClick={() => deactivate(record.id)}>Deactivate</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
