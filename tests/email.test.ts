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
    .map((line) => JSON.parse(line) as { event: string; to: string; outcome: string; subject: string; text: string });
}

async function prepareLog() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "costaatt-email-"));
  const logPath = path.join(dir, "email-log.jsonl");
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
  delete process.env.SMTP_FROM;
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
    const logPath = await prepareLog();
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
    const logPath = await prepareLog();
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
});
