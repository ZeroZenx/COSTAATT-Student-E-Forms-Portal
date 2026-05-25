"use client";

import { useState } from "react";
import { formDefinitions } from "@/lib/forms";
import type { ReviewerPatch, SubmissionRecord } from "@/lib/types";

export default function AdvisorRequests({ submissions: initialSubmissions }: { submissions: SubmissionRecord[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  async function update(id: string, action: ReviewerPatch["action"], comment: string) {
    const response = await fetch(`/api/advisor/submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, comment })
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
          <div className="course-review">
            {submission.payload.courses.map((course, index) => (
              <div key={`${course.crn}-${index}`}>
                <span>{course.crn}</span>
                <span>{course.courseCode}</span>
                <strong>{course.courseTitle}</strong>
              </div>
            ))}
          </div>
          {submission.status === "pending_advisor_review" ? (
            <ReviewerActions submissionId={submission.id} onUpdate={update} />
          ) : (
            <p className="empty-state">Reviewer decision saved: {submission.reviewerDecision || submission.status.replace(/_/g, " ")}.</p>
          )}
        </article>
      ))}
    </section>
  );
}

function ReviewerActions({
  submissionId,
  onUpdate
}: {
  submissionId: string;
  onUpdate: (id: string, action: ReviewerPatch["action"], comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  return (
    <>
      <textarea
        className="inline-comment"
        placeholder="Reviewer comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="wizard-actions">
        <button className="secondary-button" onClick={() => onUpdate(submissionId, "needs_information", comment)}>Needs information</button>
        <button className="secondary-button" onClick={() => onUpdate(submissionId, "decline", comment)}>Decline</button>
        <button className="primary-button" onClick={() => onUpdate(submissionId, "approve", comment)}>Approve</button>
      </div>
    </>
  );
}
