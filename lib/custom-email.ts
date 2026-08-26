import { appendFile, mkdir } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { getAdminSettings } from "./admin-settings";
import { appendCustomAudit } from "./custom-form-repository";
import type { CustomEmailEvent, CustomEmailTemplate, CustomFormRecord, CustomSubmissionRecord, SsoUser } from "./types";

type RecipientContext = {
  requester?: SsoUser;
  reviewer?: { name: string; email: string };
  approver?: { name: string; email: string };
  processor?: { name: string; email: string };
  internal?: { name: string; email: string };
};

export async function sendCustomFormEmails(
  event: CustomEmailEvent,
  form: CustomFormRecord,
  submission: CustomSubmissionRecord,
  actor: SsoUser
) {
  const templates = form.emailTemplates.filter((template) => template.event === event && template.enabled);
  const outcomes = [];
  for (const template of templates) {
    const outcome = await sendTemplate(template, form, submission, actor);
    outcomes.push(outcome);
    await appendCustomAudit("custom_email.triggered", "custom_submission", submission.id, actor, undefined, {
      event,
      to: outcome.to,
      outcome: outcome.outcome
    });
  }
  return outcomes;
}

async function sendTemplate(template: CustomEmailTemplate, form: CustomFormRecord, submission: CustomSubmissionRecord, actor: SsoUser) {
  const settings = await getAdminSettings();
  const recipients = recipientContext(settings.system.registryNotificationEmail, submission);
  const to = recipientFor(template.recipientGroup, recipients);
  const subject = renderTemplate(template.subject, form, submission, actor, settings.system.portalBaseUrl);
  const text = renderTemplate(template.body, form, submission, actor, settings.system.portalBaseUrl);
  const html = `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
  const mode = settings.system.emailDeliveryMode === "smtp" ? "smtp" : "log";

  if (!to) return logOutcome({ event: template.event, to, subject, text, html, outcome: "skipped", mode, error: "Missing recipient" });
  if (mode !== "smtp") return logOutcome({ event: template.event, to, subject, text, html, outcome: "logged", mode });

  try {
    const transport = nodemailer.createTransport({
      host: settings.system.smtpHost,
      port: settings.system.smtpPort,
      secure: settings.system.smtpSecure,
      auth: settings.system.smtpUser && settings.system.smtpPassword
        ? { user: settings.system.smtpUser, pass: settings.system.smtpPassword }
        : undefined
    });
    const sent = await transport.sendMail({
      from: settings.system.smtpFrom || settings.system.smtpUser || "registry@costaatt.edu.tt",
      to,
      cc: template.cc,
      subject,
      text,
      html
    });
    return logOutcome({ event: template.event, to, subject, text, html, outcome: "sent", mode, messageId: String(sent.messageId || "") });
  } catch (error) {
    return logOutcome({
      event: template.event,
      to,
      subject,
      text,
      html,
      outcome: "failed",
      mode,
      error: error instanceof Error ? error.message : "SMTP send failed"
    });
  }
}

function recipientContext(internalEmail: string, submission: CustomSubmissionRecord): RecipientContext {
  const reviewer = submission.assignments.find((assignment) => assignment.assignedTo.role === "reviewer")?.assignedTo;
  const approver = submission.assignments.find((assignment) => assignment.assignedTo.role === "approver")?.assignedTo;
  const processor = submission.assignments.find((assignment) => assignment.assignedTo.role === "processor")?.assignedTo;
  return {
    requester: submission.student,
    reviewer,
    approver,
    processor,
    internal: { name: "Internal mailbox", email: internalEmail }
  };
}

function recipientFor(group: CustomEmailTemplate["recipientGroup"], recipients: RecipientContext) {
  if (group === "requester") return recipients.requester?.email;
  if (group === "reviewer") return recipients.reviewer?.email;
  if (group === "approver") return recipients.approver?.email;
  if (group === "processor") return recipients.processor?.email;
  return recipients.internal?.email;
}

export function renderTemplate(template: string, form: CustomFormRecord, submission: CustomSubmissionRecord, actor: SsoUser, portalBaseUrl = "http://localhost:5001") {
  const reviewer = submission.assignments.find((assignment) => assignment.assignedTo.role === "reviewer")?.assignedTo;
  const values: Record<string, string> = {
    student_name: `${submission.student.firstName} ${submission.student.lastName}`,
    student_id: submission.student.studentId,
    form_title: form.title,
    submission_id: submission.id,
    status: submission.status.replace(/_/g, " "),
    reviewer_name: reviewer?.name || actor.firstName,
    direct_submission_link: `${portalBaseUrl.replace(/\/$/, "")}/admin/custom-submissions/${submission.id}`
  };
  return template.replace(/\{([a-z_]+)\}/g, (_match, key) => values[key] || "");
}

async function logOutcome(entry: {
  event: string;
  to?: string;
  subject: string;
  text: string;
  html: string;
  mode: string;
  outcome: "logged" | "sent" | "skipped" | "failed";
  error?: string;
  messageId?: string;
}) {
  const logPath = process.env.EMAIL_LOG_PATH || path.join(process.cwd(), "data", "email-log.jsonl");
  const fullEntry = { at: new Date().toISOString(), ...entry };
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, `${JSON.stringify(fullEntry)}\n`);
  return fullEntry;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
