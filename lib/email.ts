import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { formDefinitions } from "./forms";
import type { SubmissionRecord } from "./types";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function portalLink(submission: SubmissionRecord) {
  const baseUrl = process.env.PORTAL_BASE_URL || "http://localhost:5000";
  return `${baseUrl}/forms?submission=${submission.id}`;
}

function renderEmail(submission: SubmissionRecord, title: string, body: string): EmailMessage {
  const form = formDefinitions[submission.formType].title;
  const studentName = `${submission.student.firstName} ${submission.student.lastName}`;
  const firstCourse = submission.payload.courses[0];
  const details = [
    `Student: ${studentName}`,
    `Submission ID: ${submission.id}`,
    `Form: ${form}`,
    `Course: ${firstCourse?.courseCode || "Not provided"} ${firstCourse?.courseTitle || ""}`.trim(),
    `CRN: ${firstCourse?.crn || "Not provided"}`,
    `Advisor/Lecturer: ${submission.assignedTo?.name || submission.payload.advisorName || "Not assigned"}`,
    `Portal link: ${portalLink(submission)}`
  ].join("\n");

  return {
    to: submission.assignedTo?.email || submission.student.email,
    subject: title,
    text: `${body}\n\n${details}`,
    html: `<p>${body}</p><ul>${details.split("\n").map((line) => `<li>${line}</li>`).join("")}</ul>`
  };
}

export async function sendSubmissionCreatedEmails(submission: SubmissionRecord) {
  const messages = [
    renderEmail(submission, "COSTAATT e-form submitted", "Your e-form request has been received."),
    submission.assignedTo
      ? renderEmail(submission, "COSTAATT e-form requires review", "A student request has been assigned for review.")
      : renderEmail(submission, "COSTAATT e-form requires Registry review", "A request has no mapped lecturer/advisor and requires Registry review.")
  ];
  await Promise.all(messages.map(sendEmail));
}

export async function sendStatusChangedEmail(submission: SubmissionRecord) {
  await sendEmail(renderEmail(submission, `COSTAATT e-form status: ${submission.status.replace(/_/g, " ")}`, "Your e-form request status has changed."));
}

async function sendEmail(message: EmailMessage) {
  const mode = process.env.EMAIL_DELIVERY_MODE || "log";
  if (mode !== "smtp") {
    const logPath = path.join(process.cwd(), "data", "email-log.jsonl");
    await mkdir(path.dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify({ ...message, at: new Date().toISOString() })}\n`);
    return;
  }

  // SMTP transport is intentionally isolated here so production can swap in nodemailer
  // or an institutional mail gateway without changing route/workflow code.
  console.info("SMTP email queued", {
    host: process.env.SMTP_HOST,
    to: message.to,
    subject: message.subject
  });
}
