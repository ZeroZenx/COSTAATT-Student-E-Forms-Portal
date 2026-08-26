"use client";

import { useState } from "react";
import type { CustomSubmissionRecord, CustomSubmissionStatus } from "@/lib/types";

const statuses: CustomSubmissionStatus[] = ["in_review", "needs_information", "approved", "declined", "completed", "closed"];

export default function CustomSubmissionDetail({ initialSubmission }: { initialSubmission: CustomSubmissionRecord }) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [status, setStatus] = useState<CustomSubmissionStatus>(initialSubmission.status);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const response = await fetch(`/api/admin/custom-submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, comment })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Submission could not be updated.");
      return;
    }
    setSubmission(result.submission);
    setComment("");
    setMessage("Updated.");
  }

  return (
    <section className="detail-shell">
      <div className="detail-panel">
        <div className="detail-head detail-head-wrap">
          <div>
            <p className="eyeline">{submission.id}</p>
            <h2>{submission.formTitle}</h2>
            <p className="detail-summary">{submission.student.firstName} {submission.student.lastName} - {submission.student.studentId} - {submission.student.email}</p>
          </div>
          <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
        </div>

        <section className="detail-section">
          <h3>Responses</h3>
          <div className="review-list">
            {submission.responses.map((response) => (
              <div key={response.fieldKey}>
                <span>{response.fieldKey}</span>
                <strong>{response.attachment ? response.attachment.fileName : displayValue(response.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h3>Workflow assignments</h3>
          <div className="audit-list">
            {submission.assignments.map((assignment) => (
              <div key={assignment.id}>
                <strong>{assignment.assignedTo.name}</strong>
                <span>{assignment.assignedTo.email} - {assignment.assignedTo.role}</span>
                <small>{assignment.status}{assignment.actedAt ? ` - ${new Date(assignment.actedAt).toLocaleString()}` : ""}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h3>Comments</h3>
          <div className="comment-stack">
            {submission.comments.map((item) => (
              <div key={item.id}>
                <span>{item.actor.firstName} {item.actor.lastName} - {new Date(item.createdAt).toLocaleString()}</span>
                <p>{item.comment}</p>
              </div>
            ))}
            {submission.comments.length === 0 ? <p className="empty-state">No comments yet.</p> : null}
          </div>
        </section>

        <section className="detail-section">
          <h3>Audit trail</h3>
          <div className="audit-list">
            {(submission.auditTrail || []).map((event) => (
              <div key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.actorName}</span>
                <small>{new Date(event.at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="detail-actions">
        <h3>Update request</h3>
        <select value={status} onChange={(event) => setStatus(event.target.value as CustomSubmissionStatus)}>
          {statuses.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
        </select>
        <textarea className="inline-comment" placeholder="Comment" value={comment} onChange={(event) => setComment(event.target.value)} />
        <button type="button" className="primary-button" onClick={save}>Save update</button>
        {message ? <p className={message === "Updated." ? "success-message" : "error-message"}>{message}</p> : null}
      </aside>
    </section>
  );
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value || "Not provided");
}
