"use client";

import { useState } from "react";
import { formDefinitions } from "@/lib/forms";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

export default function AdvisorRequests({ submissions: initialSubmissions }: { submissions: SubmissionRecord[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  async function update(id: string, status: SubmissionStatus, comment: string) {
    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, adminComment: comment })
    });
    const result = await response.json();
    if (response.ok) setSubmissions((current) => current.map((item) => item.id === id ? result.submission : item));
  }

  if (submissions.length === 0) return <p className="empty-state">No requests are assigned to this account.</p>;

  return (
    <section className="submission-list">
      {submissions.map((submission) => (
        <article className="detail-panel" key={submission.id}>
          <div className="detail-head">
            <div>
              <p className="eyeline">{submission.id}</p>
              <h2>{formDefinitions[submission.formType].title}</h2>
            </div>
            <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
          </div>
          <p>{submission.student.firstName} {submission.student.lastName} · {submission.payload.courses[0]?.courseCode}</p>
          <textarea className="inline-comment" placeholder="Advisor comment" onBlur={(event) => event.currentTarget.dataset.comment = event.currentTarget.value} />
          <div className="wizard-actions">
            <button className="secondary-button" onClick={(event) => {
              const comment = event.currentTarget.parentElement?.previousElementSibling?.getAttribute("data-comment") || "";
              update(submission.id, "advisor_declined", comment);
            }}>Decline</button>
            <button className="primary-button" onClick={(event) => {
              const comment = event.currentTarget.parentElement?.previousElementSibling?.getAttribute("data-comment") || "";
              update(submission.id, "advisor_approved", comment);
            }}>Approve</button>
          </div>
        </article>
      ))}
    </section>
  );
}
