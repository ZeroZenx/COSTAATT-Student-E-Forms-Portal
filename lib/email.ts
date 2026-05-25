import { appendFile, mkdir } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { formDefinitions } from "./forms";
import type { ReviewerPatch, SubmissionRecord } from "./types";

type EmailMessage = {
  to?: string;
  subject: string;
  text: string;
  html: string;
  event: string;
};

export type EmailOutcome = {
  at: string;
  mode: string;
  event: string;
  to?: string;
  subject: string;
  outcome: "logged" | "sent" | "skipped" | "failed";
  error?: string;
  messageId?: string;
};

function registryEmail() {
  return process.env.REGISTRY_NOTIFICATION_EMAIL || "registrar@costaatt.edu.tt";
}

function portalLink(submission: SubmissionRecord, path = `/forms?submission=${submission.id}`) {
  const baseUrl = process.env.PORTAL_BASE_URL || "http://localhost:5001";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function statusLabel(submission: SubmissionRecord) {
  return submission.status.replace(/_/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function courseSummary(submission: SubmissionRecord) {
  return submission.payload.courses
    .map((course) => `${course.crn || "No CRN"} - ${course.courseCode || "No code"} ${course.courseTitle || ""}`.trim())
    .join("; ");
}

function details(submission: SubmissionRecord, linkPath?: string) {
  const studentName = `${submission.student.firstName} ${submission.student.lastName}`;
  return [
    ["Student", `${studentName} (${submission.student.studentId})`],
    ["Submission ID", submission.id],
    ["Form", formDefinitions[submission.formType].title],
    ["Status", statusLabel(submission)],
    ["Course/CRN", courseSummary(submission) || "Not provided"],
    ["Assigned reviewer", submission.assignedTo?.name || "Registry triage"],
    ["Direct request link", portalLink(submission, linkPath)]
  ];
}

function renderEmail(
  submission: SubmissionRecord,
  event: string,
  to: string | undefined,
  subject: string,
  body: string,
  linkPath?: string
): EmailMessage {
  const rows = details(submission, linkPath);
  const textDetails = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlDetails = rows
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`)
    .join("");

  return {
    to,
    subject,
    event,
    text: `${body}\n\n${textDetails}`,
    html: `<p>${escapeHtml(body)}</p><ul>${htmlDetails}</ul>`
  };
}

export async function sendSubmissionCreatedEmails(submission: SubmissionRecord) {
  const messages = [
    renderEmail(
      submission,
      "student.submission_created",
      submission.student.email,
      "COSTAATT e-form submitted",
      "Your e-form request has been received.",
      `/student/dashboard/${submission.id}`
    ),
    submission.assignedTo
      ? renderEmail(
          submission,
          "reviewer.assignment_created",
          submission.assignedTo.email,
          "COSTAATT e-form requires your review",
          `A student has submitted a ${formDefinitions[submission.formType].title} request that has been assigned to you for review.`,
          `/advisor/requests/${submission.id}`
        )
      : renderEmail(
          submission,
          "registry.triage_required",
          registryEmail(),
          "COSTAATT e-form requires Registry triage",
          "A request has no mapped lecturer or advisor and requires Registry review.",
          `/admin/submissions/${submission.id}`
        )
  ];
  await sendAll(messages);
}

export async function sendReviewerActionEmails(submission: SubmissionRecord, action: ReviewerPatch["action"]) {
  const actionText = action === "approve" ? "approved" : action === "decline" ? "declined" : "marked as needing more information";
  const messages = [
    renderEmail(
      submission,
      `student.reviewer_${action}`,
      submission.student.email,
      `COSTAATT e-form reviewer update: ${actionText}`,
      `Your e-form request was ${actionText} by the assigned reviewer.`,
      `/student/dashboard/${submission.id}`
    )
  ];

  if (action === "approve") {
    messages.push(
      renderEmail(
        submission,
        "registry.final_review_required",
        registryEmail(),
        "COSTAATT e-form ready for Registry review",
        "A reviewer approved this request. Registry final review is now required.",
        `/admin/submissions/${submission.id}`
      )
    );
  }

  await sendAll(messages);
}

export async function sendRegistryStatusEmail(submission: SubmissionRecord) {
  await sendAll([
    renderEmail(
      submission,
      "student.registry_status_changed",
      submission.student.email,
      `COSTAATT e-form status: ${statusLabel(submission)}`,
      "Your e-form request status has changed.",
      `/student/dashboard/${submission.id}`
    )
  ]);
}

export async function sendStatusChangedEmail(submission: SubmissionRecord) {
  await sendRegistryStatusEmail(submission);
}

export async function sendSlaEscalationEmail(
  submission: SubmissionRecord,
  target: "reviewer" | "registry_final_review" | "registry_triage"
) {
  const messages: Record<typeof target, EmailMessage> = {
    reviewer: renderEmail(
      submission,
      "sla.reviewer_overdue",
      submission.assignedTo?.email,
      "COSTAATT e-form SLA reminder: review overdue",
      "This assigned e-form request is overdue and requires your review.",
      `/advisor/requests/${submission.id}`
    ),
    registry_final_review: renderEmail(
      submission,
      "sla.registry_overdue",
      registryEmail(),
      "COSTAATT e-form SLA reminder: Registry review overdue",
      "This e-form request is overdue and requires Registry action.",
      `/admin/submissions/${submission.id}`
    ),
    registry_triage: renderEmail(
      submission,
      "sla.registry_triage_overdue",
      registryEmail(),
      "COSTAATT e-form SLA reminder: unmapped request overdue",
      "This e-form request has no mapped reviewer and requires Registry triage.",
      `/admin/submissions/${submission.id}`
    )
  };

  return sendEmailSafely(messages[target]);
}

async function sendAll(messages: EmailMessage[]) {
  for (const message of messages) {
    await sendEmailSafely(message);
  }
}

async function sendEmailSafely(message: EmailMessage) {
  const mode = process.env.EMAIL_DELIVERY_MODE || "log";
  if (!message.to) {
    return logOutcome({ message, mode, outcome: "skipped", error: "Missing recipient" });
  }

  if (mode !== "smtp") {
    return logOutcome({ message, mode, outcome: "logged" });
  }

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        : undefined
    });

    const result = await transport.sendMail({
      from: process.env.SMTP_FROM || "registry@costaatt.edu.tt",
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    return logOutcome({ message, mode, outcome: "sent", messageId: String(result.messageId || "") });
  } catch (error) {
    return logOutcome({
      message,
      mode,
      outcome: "failed",
      error: error instanceof Error ? error.message : "SMTP send failed"
    });
  }
}

async function logOutcome({
  message,
  mode,
  outcome,
  error,
  messageId
}: {
  message: EmailMessage;
  mode: string;
  outcome: EmailOutcome["outcome"];
  error?: string;
  messageId?: string;
}) {
  const logPath = process.env.EMAIL_LOG_PATH || path.join(process.cwd(), "data", "email-log.jsonl");
  const entry: EmailOutcome & Pick<EmailMessage, "text" | "html"> = {
    at: new Date().toISOString(),
    mode,
    event: message.event,
    to: message.to,
    subject: message.subject,
    outcome,
    error,
    messageId,
    text: message.text,
    html: message.html
  };
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, `${JSON.stringify(entry)}\n`);
  return entry;
}
