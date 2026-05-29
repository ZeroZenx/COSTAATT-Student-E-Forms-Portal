import { appendFile, mkdir } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { getAdminSettings } from "./admin-settings";
import { formDefinitions } from "./forms";
import type { ReviewerPatch, SubmissionRecord } from "./types";

type EmailMessage = {
  to?: string;
  subject: string;
  text: string;
  html: string;
  event: string;
};

type EmailConfig = {
  mode: "log" | "smtp";
  registryEmail: string;
  portalBaseUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpFrom: string;
  smtpSecure: boolean;
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

function registryEmail(config?: EmailConfig) {
  return config?.registryEmail || process.env.REGISTRY_NOTIFICATION_EMAIL || "registrar@costaatt.edu.tt";
}

export function emailDeliveryMode() {
  return process.env.EMAIL_DELIVERY_MODE === "smtp" ? "smtp" : "log";
}

function portalLink(submission: SubmissionRecord, path = `/forms?submission=${submission.id}`, config?: EmailConfig) {
  const baseUrl = config?.portalBaseUrl || process.env.PORTAL_BASE_URL || "http://localhost:5001";
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

function details(submission: SubmissionRecord, linkPath?: string, config?: EmailConfig) {
  const studentName = `${submission.student.firstName} ${submission.student.lastName}`;
  return [
    ["Student", `${studentName} (${submission.student.studentId})`],
    ["Submission ID", submission.id],
    ["Form", formDefinitions[submission.formType].title],
    ["Status", statusLabel(submission)],
    ["Course/CRN", courseSummary(submission) || "Not provided"],
    ["Assigned reviewer", submission.assignedTo?.name || "Registry triage"],
    ["Direct request link", portalLink(submission, linkPath, config)]
  ];
}

function renderEmail(
  submission: SubmissionRecord,
  event: string,
  to: string | undefined,
  subject: string,
  body: string,
  linkPath?: string,
  config?: EmailConfig
): EmailMessage {
  const rows = details(submission, linkPath, config);
  const textDetails = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlDetails = rows
    .map(([label, value]) => `<tr><th style="width:38%;padding:12px 14px;text-align:left;background:#edf4f4;border-bottom:1px solid #d8e2e3;color:#122c46;font-size:13px;">${escapeHtml(label)}</th><td style="padding:12px 14px;border-bottom:1px solid #d8e2e3;color:#102027;font-size:14px;">${escapeHtml(value)}</td></tr>`)
    .join("");

  return {
    to,
    subject,
    event,
    text: `${body}\n\n${textDetails}`,
    html: brandedEmailHtml(subject, body, htmlDetails)
  };
}

export async function sendSubmissionCreatedEmails(submission: SubmissionRecord) {
  const config = await resolveEmailConfig();
  const messages = [
    renderEmail(
      submission,
      "student.submission_created",
      submission.student.email,
      "COSTAATT e-form submitted",
      "Your e-form request has been received.",
      `/student/dashboard/${submission.id}`,
      config
    ),
    submission.assignedTo
      ? renderEmail(
          submission,
          "reviewer.assignment_created",
          submission.assignedTo.email,
          "COSTAATT e-form requires your review",
          `A student has submitted a ${formDefinitions[submission.formType].title} request that has been assigned to you for review.`,
          `/advisor/requests/${submission.id}`,
          config
        )
      : renderEmail(
          submission,
          "registry.triage_required",
          registryEmail(config),
          "COSTAATT e-form requires Registry triage",
          "A request has no mapped lecturer or advisor and requires Registry review.",
          `/admin/submissions/${submission.id}`,
          config
        )
  ];
  await sendAll(messages);
}

export async function sendReviewerActionEmails(submission: SubmissionRecord, action: ReviewerPatch["action"]) {
  const config = await resolveEmailConfig();
  const actionText = action === "approve" ? "approved" : action === "decline" ? "declined" : "marked as needing more information";
  const messages = [
    renderEmail(
      submission,
      `student.reviewer_${action}`,
      submission.student.email,
      `COSTAATT e-form reviewer update: ${actionText}`,
      `Your e-form request was ${actionText} by the assigned reviewer.`,
      `/student/dashboard/${submission.id}`,
      config
    )
  ];

  if (action === "approve") {
    messages.push(
      renderEmail(
        submission,
        "registry.final_review_required",
        registryEmail(config),
        "COSTAATT e-form ready for Registry review",
        "A reviewer approved this request. Registry final review is now required.",
        `/admin/submissions/${submission.id}`,
        config
      )
    );
  }

  await sendAll(messages);
}

export async function sendRegistryStatusEmail(submission: SubmissionRecord) {
  const config = await resolveEmailConfig();
  await sendAll([
    renderEmail(
      submission,
      "student.registry_status_changed",
      submission.student.email,
      `COSTAATT e-form status: ${statusLabel(submission)}`,
      "Your e-form request status has changed.",
      `/student/dashboard/${submission.id}`,
      config
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
  const config = await resolveEmailConfig();
  const messages: Record<typeof target, EmailMessage> = {
    reviewer: renderEmail(
      submission,
      "sla.reviewer_overdue",
      submission.assignedTo?.email,
      "COSTAATT e-form SLA reminder: review overdue",
      "This assigned e-form request is overdue and requires your review.",
      `/advisor/requests/${submission.id}`,
      config
    ),
    registry_final_review: renderEmail(
      submission,
      "sla.registry_overdue",
      registryEmail(config),
      "COSTAATT e-form SLA reminder: Registry review overdue",
      "This e-form request is overdue and requires Registry action.",
      `/admin/submissions/${submission.id}`,
      config
    ),
    registry_triage: renderEmail(
      submission,
      "sla.registry_triage_overdue",
      registryEmail(config),
      "COSTAATT e-form SLA reminder: unmapped request overdue",
      "This e-form request has no mapped reviewer and requires Registry triage.",
      `/admin/submissions/${submission.id}`,
      config
    )
  };

  return sendEmailSafely(messages[target]);
}

export async function sendOperationalTestEmail(to: string, label = "Operations test") {
  const config = await resolveEmailConfig();
  return sendEmailSafely({
    to,
    event: "operations.test_email",
    subject: "COSTAATT e-forms email test",
    text: [
      "This is a COSTAATT Student E-Forms Portal test email.",
      `Label: ${label}`,
      `Mode: ${config.mode}`,
      `Generated: ${new Date().toISOString()}`
    ].join("\n"),
    html: `<p>This is a COSTAATT Student E-Forms Portal test email.</p><ul><li><strong>Label:</strong> ${escapeHtml(label)}</li><li><strong>Mode:</strong> ${escapeHtml(config.mode)}</li><li><strong>Generated:</strong> ${escapeHtml(new Date().toISOString())}</li></ul>`
  });
}

async function sendAll(messages: EmailMessage[]) {
  for (const message of messages) {
    await sendEmailSafely(message);
  }
}

async function sendEmailSafely(message: EmailMessage) {
  const config = await resolveEmailConfig();
  const mode = config.mode;
  if (!message.to) {
    return logOutcome({ message, mode, outcome: "skipped", error: "Missing recipient" });
  }

  if (mode !== "smtp") {
    return logOutcome({ message, mode, outcome: "logged" });
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: config.smtpUser && config.smtpPassword
        ? {
            user: config.smtpUser,
            pass: config.smtpPassword
          }
        : undefined
    });

    const result = await transport.sendMail({
      from: config.smtpFrom || "registry@costaatt.edu.tt",
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

async function resolveEmailConfig(): Promise<EmailConfig> {
  const settings = await getAdminSettings().catch(() => null);
  const system = settings?.system;
  const mode = process.env.EMAIL_DELIVERY_MODE || system?.emailDeliveryMode || "log";
  return {
    mode: mode === "smtp" ? "smtp" : "log",
    registryEmail: process.env.REGISTRY_NOTIFICATION_EMAIL || system?.registryNotificationEmail || "registrar@costaatt.edu.tt",
    portalBaseUrl: process.env.PORTAL_BASE_URL || system?.portalBaseUrl || "http://localhost:5001",
    smtpHost: process.env.SMTP_HOST || system?.smtpHost || "",
    smtpPort: Number(process.env.SMTP_PORT || system?.smtpPort || 587),
    smtpUser: process.env.SMTP_USER || system?.smtpUser || "",
    smtpPassword: process.env.SMTP_PASSWORD || system?.smtpPassword || "",
    smtpFrom: process.env.SMTP_FROM || system?.smtpFrom || system?.smtpUser || "registry@costaatt.edu.tt",
    smtpSecure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : Boolean(system?.smtpSecure)
  };
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

function brandedEmailHtml(subject: string, body: string, rows: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f8f8;font-family:Arial,Helvetica,sans-serif;color:#102027;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f8f8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #d8e2e3;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#122c46;color:#ffffff;padding:22px 26px;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#a9d7d9;font-weight:700;">COSTAATT Student E-Forms Portal</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">${escapeHtml(body)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #d8e2e3;border-radius:8px;overflow:hidden;">
                  ${rows}
                </table>
                <p style="margin:20px 0 0;color:#65757a;font-size:13px;line-height:1.5;">This automated message was sent by the COSTAATT Student E-Forms Portal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
