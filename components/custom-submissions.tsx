"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { CustomSubmissionRecord, CustomSubmissionStatus } from "@/lib/types";

const statuses: Array<CustomSubmissionStatus | "all"> = ["all", "submitted", "in_review", "needs_information", "approved", "declined", "completed", "closed"];

export default function CustomSubmissions({ initialSubmissions }: { initialSubmissions: CustomSubmissionRecord[] }) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState("all");
  const [status, setStatus] = useState<CustomSubmissionStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const forms = useMemo(() => Array.from(new Set(initialSubmissions.map((submission) => submission.formTitle))).sort(), [initialSubmissions]);
  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const end = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;
    return initialSubmissions.filter((submission) => {
      const created = new Date(submission.createdAt).getTime();
      const haystack = [
        submission.id,
        submission.formTitle,
        submission.status,
        submission.student.studentId,
        submission.student.firstName,
        submission.student.lastName,
        submission.student.email
      ].join(" ").toLowerCase();
      return (
        (!term || haystack.includes(term)) &&
        (form === "all" || submission.formTitle === form) &&
        (status === "all" || submission.status === status) &&
        (!start || created >= start) &&
        (!end || created <= end)
      );
    });
  }, [form, fromDate, initialSubmissions, query, status, toDate]);

  return (
    <section className="queue-workspace">
      <div className="queue-filter-panel">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search form, student, ID, email, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="queue-filters">
          <select value={form} onChange={(event) => setForm(event.target.value)}>
            <option value="all">All forms</option>
            {forms.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as CustomSubmissionStatus | "all")}>
            {statuses.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
          </select>
          <input aria-label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input aria-label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </div>

      <div className="queue-table">
        {filtered.map((submission) => (
          <Link className="queue-card" href={`/admin/custom-submissions/${submission.id}`} key={submission.id}>
            <div>
              <p className="eyeline">{submission.id}</p>
              <h3>{submission.formTitle}</h3>
              <p>{submission.student.firstName} {submission.student.lastName} - {submission.student.studentId}</p>
            </div>
            <div className="queue-meta">
              <span>{submission.student.email}</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
              <span>{submission.assignments[0]?.assignedTo.name || "No workflow assignment"}</span>
            </div>
            <div className="queue-status-cell">
              <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="empty-state">No custom submissions match these filters.</p> : null}
      </div>
    </section>
  );
}
