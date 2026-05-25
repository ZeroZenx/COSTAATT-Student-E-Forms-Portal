import { formDefinitions } from "./forms";
import type { FormType, SubmissionRecord, SubmissionStatus, WorkflowEvent } from "./types";

const statusLabels: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  pending_advisor_review: "Pending reviewer review",
  advisor_approved: "Reviewer approved",
  advisor_declined: "Reviewer declined",
  needs_information: "Needs information",
  pending_registry_review: "Pending Registry review",
  registry_approved: "Registry approved",
  registry_declined: "Registry declined",
  closed: "Closed",
  in_review: "In review",
  approved: "Approved",
  declined: "Declined"
};

const studentStatusLabels: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  pending_advisor_review: "Awaiting Reviewer",
  advisor_approved: "Reviewer approved",
  advisor_declined: "Declined",
  needs_information: "Needs Information",
  pending_registry_review: "With Registry",
  registry_approved: "Approved",
  registry_declined: "Declined",
  closed: "Closed",
  in_review: "In review",
  approved: "Approved",
  declined: "Declined"
};

const actionLabels: Record<string, string> = {
  submitted: "Request submitted",
  "submission.created": "Request created",
  "submission.updated": "Request updated",
  "registry.status_changed": "Registry updated status",
  "reviewer.approve": "Reviewer approved",
  "reviewer.decline": "Reviewer declined",
  "reviewer.needs_information": "Reviewer requested information",
  "attachment.viewed": "Attachment viewed",
  "attachment.downloaded": "Attachment downloaded"
};

const registryActionLabels: Record<SubmissionStatus, string> = {
  submitted: "Mark submitted",
  pending_advisor_review: "Send to reviewer",
  advisor_approved: "Mark reviewer approved",
  advisor_declined: "Mark reviewer declined",
  needs_information: "Request information",
  pending_registry_review: "Send to Registry review",
  registry_approved: "Approve",
  registry_declined: "Decline",
  closed: "Close",
  in_review: "Mark in review",
  approved: "Approve",
  declined: "Decline"
};

export function statusLabel(status: SubmissionStatus) {
  return statusLabels[status] || titleize(status);
}

export function studentStatusLabel(status: SubmissionStatus) {
  return studentStatusLabels[status] || statusLabel(status);
}

export function formLabel(formType: FormType) {
  return formDefinitions[formType]?.title || titleize(formType);
}

export function formShortLabel(formType: FormType) {
  return formDefinitions[formType]?.shortTitle || formLabel(formType);
}

export function actionLabel(action: string) {
  return actionLabels[action] || titleize(action.replace(/\./g, " "));
}

export function eventStatusLabel(event: WorkflowEvent, studentView = false) {
  const status = event.toStatus || event.fromStatus;
  if (!status) return "";
  return studentView ? studentStatusLabel(status) : statusLabel(status);
}

export function formatDateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString();
}

export function latestVisibleComment(submission: SubmissionRecord) {
  return (
    submission.registryComment ||
    submission.adminComment ||
    submission.reviewerComment ||
    submission.payload.studentComment ||
    "No comments yet."
  );
}

export function reviewerDisplay(submission: SubmissionRecord) {
  if (submission.assignedTo) {
    return `${submission.assignedTo.name} (${submission.assignedTo.role})`;
  }
  return "Registry triage";
}

export function attachmentMeta(submission: SubmissionRecord) {
  if (!submission.attachment) return "No attachment stored";
  return `${submission.attachment.fileName} · ${(submission.attachment.size / 1024).toFixed(1)} KB`;
}

export function registryActionLabel(status: SubmissionStatus) {
  return registryActionLabels[status] || statusLabel(status);
}

function titleize(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
