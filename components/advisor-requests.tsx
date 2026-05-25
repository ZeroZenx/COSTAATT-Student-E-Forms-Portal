"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formShortLabel, formatDateTime, statusLabel } from "@/lib/display";
import { slaState, submissionOperationalSummary } from "@/lib/dashboard";
import type { SubmissionRecord } from "@/lib/types";

type Tab = "pending" | "overdue" | "decided" | "all";

export default function AdvisorRequests({ submissions }: { submissions: SubmissionRecord[] }) {
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    pending: submissions.filter((submission) => submission.status === "pending_advisor_review").length,
    overdue: submissions.filter((submission) => slaState(submission) === "overdue").length,
    decided: submissions.filter((submission) => submission.status !== "pending_advisor_review").length,
    all: submissions.length
  }), [submissions]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    return submissions.filter((submission) => {
      const matchesTab =
        tab === "all" ||
        (tab === "pending" && submission.status === "pending_advisor_review") ||
        (tab === "overdue" && slaState(submission) === "overdue") ||
        (tab === "decided" && submission.status !== "pending_advisor_review");
      const haystack = [
        submission.id,
        submission.student.firstName,
        submission.student.lastName,
        submission.student.studentId,
        submission.status,
        submission.payload.courses.map((course) => `${course.crn} ${course.courseCode} ${course.courseTitle}`).join(" ")
      ].join(" ").toLowerCase();
      return matchesTab && (!term || haystack.includes(term));
    });
  }, [query, submissions, tab]);

  if (submissions.length === 0) {
    return <p className="empty-state">No requests are assigned to this account.</p>;
  }

  return (
    <section className="queue-workspace">
      <div className="decision-tabs">
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>Pending <span>{counts.pending}</span></button>
        <button className={tab === "overdue" ? "active" : ""} onClick={() => setTab("overdue")}>Overdue <span>{counts.overdue}</span></button>
        <button className={tab === "decided" ? "active" : ""} onClick={() => setTab("decided")}>Decided <span>{counts.decided}</span></button>
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All <span>{counts.all}</span></button>
      </div>
      <label className="search-box">
        <Search size={17} />
        <input placeholder="Search by student, CRN, course, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="queue-table">
        {filtered.map((submission) => {
          const operational = submissionOperationalSummary(submission);
          return (
            <Link className="queue-card" href={`/advisor/requests/${submission.id}`} key={submission.id}>
              <div>
                <p className="eyeline">{submission.id}</p>
                <h3>{formShortLabel(submission.formType)}</h3>
                <p>{submission.student.firstName} {submission.student.lastName} · {submission.student.studentId}</p>
              </div>
              <div className="queue-meta">
                <span>{submission.payload.courses[0]?.courseCode || "No course"}</span>
                <span>{submission.payload.courses[0]?.courseTitle || "No course title"}</span>
                <span>Created {formatDateTime(submission.createdAt)}</span>
              </div>
              <div className="queue-status-cell">
                <span className={`status-pill status-${submission.status}`}>{statusLabel(submission.status)}</span>
                <small className={`sla-pill sla-${operational.state}`}>{operational.stateLabel} · {operational.age} business days</small>
                {submission.reviewerComment ? <small>{submission.reviewerComment}</small> : null}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 ? (
          <div className="empty-card">
            <h3>No assigned requests match this view.</h3>
            <p>Switch tabs or clear the search field to see more requests.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
