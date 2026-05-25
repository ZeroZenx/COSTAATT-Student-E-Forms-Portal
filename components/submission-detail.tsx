"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, MessageSquare, XCircle } from "lucide-react";
import { submissionStatuses } from "@/lib/forms";
import {
  actionLabel,
  attachmentMeta,
  eventStatusLabel,
  formLabel,
  formatDateTime,
  reviewerDisplay,
  statusLabel,
  studentStatusLabel
} from "@/lib/display";
import type { ReviewerPatch, SubmissionRecord, SubmissionStatus } from "@/lib/types";

type Viewer = "registry" | "reviewer" | "student";

export default function SubmissionDetail({
  initialSubmission,
  viewer,
  canAct = true
}: {
  initialSubmission: SubmissionRecord;
  viewer: Viewer;
  canAct?: boolean;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const studentView = viewer === "student";
  const firstCourse = submission.payload.courses[0];
  const hasAnyComment = Boolean(
    submission.registryComment ||
    submission.adminComment ||
    submission.reviewerComment ||
    submission.payload.studentComment
  );

  return (
    <section className="detail-shell">
      <div className="detail-panel">
        <div className="detail-head detail-head-wrap">
          <div>
            <p className="eyeline">{submission.id}</p>
            <h2>{formLabel(submission.formType)}</h2>
            <p className="detail-summary">
              {submission.student.firstName} {submission.student.lastName}
              {firstCourse ? ` · ${firstCourse.courseCode} · CRN ${firstCourse.crn}` : ""}
            </p>
          </div>
          <span className={`status-pill status-${submission.status}`}>
            {studentView ? studentStatusLabel(submission.status) : statusLabel(submission.status)}
          </span>
        </div>

        {submission.routingFlags?.includes("no_reviewer_mapping") ? (
          <p className="notice-banner">No lecturer or advisor mapping was found. This request is routed to Registry triage.</p>
        ) : null}

        <section className="detail-section">
          <h3>Student identity</h3>
          <div className="detail-grid">
            <Detail label="Student" value={`${submission.student.firstName} ${submission.student.lastName}`} />
            <Detail label="Student ID" value={submission.student.studentId} />
            <Detail label="Email" value={submission.student.email} />
            <Detail label="Phone" value={submission.payload.phone} />
            <Detail label="Programme" value={submission.payload.programme} />
            <Detail label="Degree" value={submission.payload.degree} />
          </div>
        </section>

        <section className="detail-section">
          <h3>Request details</h3>
          <div className="detail-grid">
            <Detail label="Academic period" value={`${submission.payload.academicYear} · ${submission.payload.semester}`} />
            <Detail label="Request type" value={submission.payload.requestType} />
            <Detail label="Academic advisor" value={submission.payload.advisorName} />
            <Detail label="Assigned reviewer" value={reviewerDisplay(submission)} />
            <Detail label="Reviewer decision" value={submission.reviewerDecision ? submission.reviewerDecision.replace(/_/g, " ") : "Not decided"} />
            <Detail label="Registry decision" value={submission.registryDecision ? submission.registryDecision.replace(/_/g, " ") : "Not decided"} />
          </div>
        </section>

        <section className="detail-section">
          <h3>Courses</h3>
          <div className="course-review dense-course-review">
            {submission.payload.courses.map((course, index) => (
              <div key={`${course.crn}-${course.courseCode}-${index}`}>
                <span>CRN {course.crn || "Not provided"}</span>
                <span>{course.courseCode || "No course code"}</span>
                <strong>{course.courseTitle || "No course title"}</strong>
                <small>
                  {course.lecturerName || course.advisorName || "No lecturer assigned"}
                  {course.lecturerEmail || course.advisorEmail ? ` · ${course.lecturerEmail || course.advisorEmail}` : ""}
                  {course.campus ? ` · ${course.campus}` : ""}
                  {course.section ? ` · Section ${course.section}` : ""}
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section two-column-section">
          <div>
            <h3>Attachment</h3>
            <div className="attachment-review">
              {submission.attachment ? (
                viewer === "student" ? (
                  <p>{attachmentMeta(submission)}</p>
                ) : (
                <div className="attachment-actions">
                  <p>{submission.attachment.fileName} · {(submission.attachment.size / 1024).toFixed(1)} KB</p>
                  <div className="row-actions">
                    <a href={`/api/admin/submissions/${submission.id}/attachment`} target="_blank" rel="noreferrer">
                      <Eye size={16} /> View
                    </a>
                    <a href={`/api/admin/submissions/${submission.id}/attachment?download=1`}>
                      <Download size={16} /> Download
                    </a>
                  </div>
                </div>
                )
              ) : (
                <p>No attachment stored.</p>
              )}
            </div>
          </div>
          <div>
            <h3>Comments</h3>
            <div className="comment-stack">
              <Comment label="Student comment" value={submission.payload.studentComment} />
              <Comment label="Reviewer comment" value={submission.reviewerComment} />
              <Comment label="Registry comment" value={submission.registryComment || submission.adminComment} />
              {!hasAnyComment && <p className="empty-state">No comments have been added yet.</p>}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>Declarations</h3>
          <div className="declaration-chip-list">
            {submission.payload.declarations.length > 0 ? submission.payload.declarations.map((declaration) => (
              <span key={declaration}>{declaration}</span>
            )) : <p className="empty-state">No declarations recorded.</p>}
          </div>
        </section>

        <Timeline submission={submission} studentView={studentView} />
      </div>

      {viewer === "registry" ? (
        <RegistryActions submission={submission} onUpdate={setSubmission} />
      ) : null}

      {viewer === "reviewer" ? (
        <ReviewerActions submission={submission} canAct={canAct} onUpdate={setSubmission} />
      ) : null}
    </section>
  );
}

function RegistryActions({
  submission,
  onUpdate
}: {
  submission: SubmissionRecord;
  onUpdate: (submission: SubmissionRecord) => void;
}) {
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [registryComment, setRegistryComment] = useState(submission.registryComment || submission.adminComment || "");
  const [internalNotes, setInternalNotes] = useState(submission.internalNotes || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, registryComment, adminComment: registryComment, internalNotes })
    });
    const result = await response.json();
    setSaving(false);
    if (response.ok) {
      onUpdate(result.submission);
      setMessage("Registry update saved.");
    } else {
      setMessage(result.error || "Could not save Registry update.");
    }
  }

  return (
    <aside className="detail-actions">
      <h3>Registry decision</h3>
      <label className="field">
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value as SubmissionStatus)}>
          {submissionStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
        </select>
      </label>
      <label className="textarea-field">
        Student-visible comment
        <textarea value={registryComment} onChange={(event) => setRegistryComment(event.target.value)} />
      </label>
      <label className="textarea-field">
        Internal notes
        <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
      </label>
      <button className="primary-button" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save Registry update"}</button>
      {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
    </aside>
  );
}

function ReviewerActions({
  submission,
  canAct,
  onUpdate
}: {
  submission: SubmissionRecord;
  canAct: boolean;
  onUpdate: (submission: SubmissionRecord) => void;
}) {
  const [comment, setComment] = useState(submission.reviewerComment || "");
  const [message, setMessage] = useState("");
  const [savingAction, setSavingAction] = useState<ReviewerPatch["action"] | "">("");
  const pending = submission.status === "pending_advisor_review" && canAct;
  const historyMessage = useMemo(() => {
    if (pending) return "";
    if (submission.reviewerDecision) return `Reviewer decision saved: ${submission.reviewerDecision.replace(/_/g, " ")}.`;
    return "This request is not awaiting reviewer action.";
  }, [pending, submission.reviewerDecision]);

  async function submit(action: ReviewerPatch["action"]) {
    if ((action === "decline" || action === "needs_information") && comment.trim().length < 3) {
      setMessage("A comment is required for decline or needs-information decisions.");
      return;
    }
    setSavingAction(action);
    setMessage("");
    const response = await fetch(`/api/advisor/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, comment })
    });
    const result = await response.json();
    setSavingAction("");
    if (response.ok) {
      onUpdate(result.submission);
      setMessage("Reviewer decision saved.");
    } else {
      setMessage(result.error || "Could not save reviewer decision.");
    }
  }

  return (
    <aside className="detail-actions">
      <h3>Reviewer decision</h3>
      {pending ? (
        <>
          <label className="textarea-field">
            Comment
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          <div className="reviewer-button-grid">
            <button className="secondary-button" disabled={Boolean(savingAction)} onClick={() => submit("needs_information")}>
              <MessageSquare size={17} /> Needs information
            </button>
            <button className="secondary-button" disabled={Boolean(savingAction)} onClick={() => submit("decline")}>
              <XCircle size={17} /> Decline
            </button>
            <button className="primary-button" disabled={Boolean(savingAction)} onClick={() => submit("approve")}>
              <CheckCircle2 size={17} /> Approve
            </button>
          </div>
        </>
      ) : (
        <p className="empty-state">{historyMessage}</p>
      )}
      {message ? <p className={message.includes("saved") ? "success-message" : "error-message"}>{message}</p> : null}
    </aside>
  );
}

function Timeline({ submission, studentView }: { submission: SubmissionRecord; studentView: boolean }) {
  return (
    <section className="detail-section">
      <h3>Timeline</h3>
      <div className="timeline timeline-rich">
        {(submission.workflowHistory || []).map((event) => (
          <div key={event.id}>
            <span className="timeline-dot" />
            <strong>{actionLabel(event.action)}</strong>
            <span>{formatDateTime(event.at)} · {event.actorName}{eventStatusLabel(event, studentView) ? ` · ${eventStatusLabel(event, studentView)}` : ""}</span>
            {event.comment ? <p>{event.comment}</p> : null}
          </div>
        ))}
        {(submission.workflowHistory || []).length === 0 ? <p className="empty-state">No workflow activity has been recorded.</p> : null}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

function Comment({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
