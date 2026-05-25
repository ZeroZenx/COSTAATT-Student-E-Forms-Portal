"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formDefinitions, submissionStatuses } from "@/lib/forms";
import { formShortLabel, formatDateTime, reviewerDisplay, statusLabel } from "@/lib/display";
import type { FormType, SubmissionRecord, SubmissionStatus } from "@/lib/types";

const queueCounters: SubmissionStatus[] = [
  "pending_advisor_review",
  "pending_registry_review",
  "needs_information",
  "registry_approved",
  "registry_declined",
  "closed"
];

export default function AdminSubmissions({ initialSubmissions }: { initialSubmissions: SubmissionRecord[] }) {
  const [query, setQuery] = useState("");
  const [formType, setFormType] = useState<FormType | "all">("all");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");
  const [reviewer, setReviewer] = useState("all");
  const [flag, setFlag] = useState<"all" | "no_reviewer_mapping">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const reviewers = useMemo(() => {
    return Array.from(new Set(initialSubmissions.map((submission) => submission.assignedTo?.email).filter(Boolean) as string[])).sort();
  }, [initialSubmissions]);

  const counters = useMemo(() => {
    return queueCounters.map((item) => ({
      status: item,
      count: initialSubmissions.filter((submission) => submission.status === item).length
    }));
  }, [initialSubmissions]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const end = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return initialSubmissions.filter((submission) => {
      const created = new Date(submission.createdAt).getTime();
      const haystack = [
        submission.id,
        formDefinitions[submission.formType].title,
        submission.status,
        submission.student.studentId,
        submission.student.firstName,
        submission.student.lastName,
        submission.student.email,
        submission.assignedTo?.name,
        submission.assignedTo?.email,
        submission.payload.courses.map((course) => `${course.crn} ${course.courseCode} ${course.courseTitle}`).join(" ")
      ].join(" ").toLowerCase();

      return (
        (!term || haystack.includes(term)) &&
        (formType === "all" || submission.formType === formType) &&
        (status === "all" || submission.status === status) &&
        (reviewer === "all" || submission.assignedTo?.email === reviewer) &&
        (flag === "all" || submission.routingFlags?.includes(flag)) &&
        (!start || created >= start) &&
        (!end || created <= end)
      );
    });
  }, [flag, formType, fromDate, initialSubmissions, query, reviewer, status, toDate]);

  return (
    <section className="queue-workspace">
      <div className="queue-metrics">
        {counters.map((counter) => (
          <button
            className={status === counter.status ? "metric-card active-metric" : "metric-card"}
            key={counter.status}
            onClick={() => setStatus(status === counter.status ? "all" : counter.status)}
          >
            <span>{statusLabel(counter.status)}</span>
            <strong>{counter.count}</strong>
          </button>
        ))}
      </div>

      <div className="queue-filter-panel">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search student, ID, email, CRN, course, reviewer, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="queue-filters">
          <select value={formType} onChange={(event) => setFormType(event.target.value as FormType | "all")}>
            <option value="all">All forms</option>
            {Object.entries(formDefinitions).map(([key, definition]) => <option key={key} value={key}>{definition.shortTitle}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as SubmissionStatus | "all")}>
            <option value="all">All statuses</option>
            {submissionStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
          <select value={reviewer} onChange={(event) => setReviewer(event.target.value)}>
            <option value="all">All reviewers</option>
            {reviewers.map((email) => <option key={email} value={email}>{email}</option>)}
          </select>
          <select value={flag} onChange={(event) => setFlag(event.target.value as "all" | "no_reviewer_mapping")}>
            <option value="all">All routing</option>
            <option value="no_reviewer_mapping">No reviewer mapping</option>
          </select>
          <input aria-label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input aria-label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </div>

      <div className="queue-table">
        {filtered.map((submission) => (
          <Link className="queue-card" href={`/admin/submissions/${submission.id}`} key={submission.id}>
            <div>
              <p className="eyeline">{submission.id}</p>
              <h3>{formShortLabel(submission.formType)}</h3>
              <p>{submission.student.firstName} {submission.student.lastName} · {submission.student.studentId}</p>
            </div>
            <div className="queue-meta">
              <span>{submission.payload.courses[0]?.courseCode || "No course"}</span>
              <span>{reviewerDisplay(submission)}</span>
              <span>{formatDateTime(submission.createdAt)}</span>
            </div>
            <div className="queue-status-cell">
              <span className={`status-pill status-${submission.status}`}>{statusLabel(submission.status)}</span>
              {submission.routingFlags?.includes("no_reviewer_mapping") ? <small>No reviewer mapping</small> : null}
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <div className="empty-card">
            <h3>No submissions match these filters.</h3>
            <p>Try clearing the search, changing the status, or widening the date range.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
