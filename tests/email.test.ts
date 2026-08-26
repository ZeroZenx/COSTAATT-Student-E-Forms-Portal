import { mkdtemp, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubmissionRecord } from "../lib/types";

const baseSubmission: SubmissionRecord = {
  id: "sub-001",
  formType: "course-override",
  status: "pending_advisor_review",
  student: {
    studentId: "00012345",
    firstName: "Asha",
    lastName: "Student",
    email: "asha.student@costaatt.edu.tt",
    roles: ["student"]
  },
  payload: {
    formType: "course-override",
    requestType: "Override Pre-requisite",
    academicYear: "2026/2027",
    semester: "Semester 1",
    programme: "Information Technology",
    degree: "Associate Degree",
    advisorName: "Alex Lecturer",
    courses: [
      {
        crn: "12345",
        courseCode: "COMP 101",
        courseTitle: "Introduction to Computing"
      }
    ],
    declarations: [],
    studentComment: "Please review."
  },
  assignedTo: {
    name: "Alex Lecturer",
    email: "alex.lecturer@costaatt.edu.tt",
    role: "lecturer"
  },
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z"
};

async function logLines(filePath: string) {
  return (await readFile(filePath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; to: string; outcome: string; subject: string; text: string; html: string; mode?: string });
}

function testSystemSettings(overrides: Record<string, unknown> = {}) {
  return {
    portalBaseUrl: "http://localhost:5001",
    registryNotificationEmail: "registrar@costaatt.edu.tt",
    emailDeliveryMode: "log",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFrom: "registry@costaatt.edu.tt",
    smtpSecure: false,
    uploadMaxMb: 8,
    uploadTypes: "PDF, PNG, JPG",
    semesters: ["Semester 1"],
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides
  };
}

async function prepareLog(settingsOverrides: Record<string, unknown> = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "costaatt-email-"));
  const logPath = path.join(dir, "email-log.jsonl");
  vi.doMock("../lib/admin-settings", () => ({
    getAdminSettings: vi.fn().mockResolvedValue({
      system: testSystemSettings(settingsOverrides)
    })
  }));
  process.env.EMAIL_LOG_PATH = logPath;
  process.env.EMAIL_DELIVERY_MODE = "log";
  process.env.PORTAL_BASE_URL = "http://localhost:5001";
  process.env.REGISTRY_NOTIFICATION_EMAIL = "registrar@costaatt.edu.tt";
  return logPath;
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete process.env.EMAIL_LOG_PATH;
  delete process.env.EMAIL_DELIVERY_MODE;
  delete process.env.PORTAL_BASE_URL;
  delete process.env.REGISTRY_NOTIFICATION_EMAIL;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  delete process.env.SMTP_FROM;
  delete process.env.SMTP_SECURE;
});

describe("email notification engine", () => {
  it("logs student and reviewer messages for mapped submissions", async () => {
    const logPath = await prepareLog();
    const { sendSubmissionCreatedEmails } = await import("../lib/email");

    await sendSubmissionCreatedEmails(baseSubmission);

    const entries = await logLines(logPath);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.event)).toEqual(["student.submission_created", "reviewer.assignment_created"]);
    expect(entries[0].text).toContain("Submission ID: sub-001");
    expect(entries[1].to).toBe("alex.lecturer@costaatt.edu.tt");
  });

  it("renders direct request links as hyperlinks in HTML emails", async () => {
    const logPath = await prepareLog();
    const { sendSubmissionCreatedEmails } = await import("../lib/email");

    await sendSubmissionCreatedEmails(baseSubmission);

    const entries = await logLines(logPath);
    expect(entries[0].html).toContain('href="http://localhost:5001/student/dashboard/sub-001"');
    expect(entries[0].html).toContain(">View request</a>");
  });

  it("logs Registry triage email when no reviewer is mapped", async () => {
    const logPath = await prepareLog();
    const { sendSubmissionCreatedEmails } = await import("../lib/email");

    await sendSubmissionCreatedEmails({ ...baseSubmission, assignedTo: undefined, routingFlags: ["no_reviewer_mapping"] });

    const entries = await logLines(logPath);
    expect(entries.map((entry) => entry.event)).toEqual(["student.submission_created", "registry.triage_required"]);
    expect(entries[1].to).toBe("registrar@costaatt.edu.tt");
  });

  it("sends reviewer approval emails to student and Registry", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "smtp-1" });
    vi.doMock("nodemailer", () => ({
      default: {
        createTransport: vi.fn(() => ({ sendMail }))
      }
    }));
    const logPath = await prepareLog({
      emailDeliveryMode: "smtp",
      smtpHost: "smtp.example.edu",
      smtpFrom: "registry@costaatt.edu.tt"
    });
    process.env.EMAIL_DELIVERY_MODE = "smtp";
    process.env.SMTP_HOST = "smtp.example.edu";
    process.env.SMTP_FROM = "registry@costaatt.edu.tt";
    const { sendReviewerActionEmails } = await import("../lib/email");

    await sendReviewerActionEmails({ ...baseSubmission, status: "pending_registry_review" }, "approve");

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[1][0].to).toBe("registrar@costaatt.edu.tt");
    const entries = await logLines(logPath);
    expect(entries.every((entry) => entry.outcome === "sent")).toBe(true);
  });

  it("logs SMTP failures without throwing", async () => {
    vi.doMock("nodemailer", () => ({
      default: {
        createTransport: vi.fn(() => ({
          sendMail: vi.fn().mockRejectedValue(new Error("SMTP unavailable"))
        }))
      }
    }));
    const logPath = await prepareLog({
      emailDeliveryMode: "smtp",
      smtpHost: "smtp.example.edu",
      smtpFrom: "registry@costaatt.edu.tt"
    });
    process.env.EMAIL_DELIVERY_MODE = "smtp";
    const { sendRegistryStatusEmail } = await import("../lib/email");

    await expect(sendRegistryStatusEmail(baseSubmission)).resolves.toBeUndefined();
    const entries = await logLines(logPath);
    expect(entries[0].outcome).toBe("failed");
    expect(entries[0].subject).toContain("COSTAATT e-form status");
  });

  it("logs reviewer SLA escalation emails", async () => {
    const logPath = await prepareLog();
    const { sendSlaEscalationEmail } = await import("../lib/email");

    const outcome = await sendSlaEscalationEmail(baseSubmission, "reviewer");

    expect(outcome.outcome).toBe("logged");
    const entries = await logLines(logPath);
    expect(entries[0].event).toBe("sla.reviewer_overdue");
    expect(entries[0].to).toBe("alex.lecturer@costaatt.edu.tt");
  });

  it("logs operations diagnostic test emails", async () => {
    const logPath = await prepareLog();
    const { sendOperationalTestEmail } = await import("../lib/email");

    const outcome = await sendOperationalTestEmail("registry@costaatt.edu.tt", "Go-live check");

    expect(outcome.outcome).toBe("logged");
    const entries = await logLines(logPath);
    expect(entries[0].event).toBe("operations.test_email");
    expect(entries[0].to).toBe("registry@costaatt.edu.tt");
    expect(entries[0].text).toContain("Go-live check");
  });

  it("uses saved admin SMTP settings ahead of environment defaults", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "settings-smtp-1" });
    const createTransport = vi.fn(() => ({ sendMail }));
    vi.doMock("nodemailer", () => ({
      default: { createTransport }
    }));
    const logPath = await prepareLog({
      portalBaseUrl: "http://portal.internal:5001",
      registryNotificationEmail: "registry@costaatt.edu.tt",
      emailDeliveryMode: "smtp",
      smtpHost: "smtp.office365.com",
      smtpUser: "registry@costaatt.edu.tt",
      smtpPassword: "saved-password",
      smtpFrom: "registry@costaatt.edu.tt"
    });
    process.env.EMAIL_DELIVERY_MODE = "log";
    process.env.SMTP_HOST = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";
    process.env.SMTP_FROM = "registry@costaatt.edu.tt";
    process.env.SMTP_SECURE = "true";
    const { sendOperationalTestEmail } = await import("../lib/email");

    const outcome = await sendOperationalTestEmail("student@costaatt.edu.tt", "Saved SMTP");

    expect(outcome.outcome).toBe("sent");
    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "registry@costaatt.edu.tt",
        pass: "saved-password"
      }
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "registry@costaatt.edu.tt",
      to: "student@costaatt.edu.tt"
    }));
    const entries = await logLines(logPath);
    expect(entries[0]).toMatchObject({ mode: "smtp", outcome: "sent" });
  });
});
