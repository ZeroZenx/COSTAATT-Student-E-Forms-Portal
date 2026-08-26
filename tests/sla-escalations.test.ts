import { mkdtemp, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubmissionRecord } from "../lib/types";

function submission(overrides: Partial<SubmissionRecord>): SubmissionRecord {
  return {
    id: "sub-1",
    formType: "course-override",
    status: "pending_advisor_review",
    student: {
      studentId: "00012345",
      firstName: "Darren",
      lastName: "Headley",
      email: "student@example.edu",
      roles: ["student"]
    },
    payload: {
      formType: "course-override",
      requestType: "Override Pre-requisite",
      academicYear: "2026/2027",
      semester: "Semester 1",
      programme: "AAS - IT",
      degree: "Associate Degree",
      advisorName: "Advisor",
      courses: [{ crn: "12345", courseCode: "COMP 101", courseTitle: "Computing" }],
      declarations: []
    },
    assignedTo: {
      name: "Alex Lecturer",
      email: "alex.lecturer@costaatt.edu.tt",
      role: "lecturer"
    },
    createdAt: "2026-05-18T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    ...overrides
  };
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete process.env.EMAIL_LOG_PATH;
  delete process.env.EMAIL_DELIVERY_MODE;
  delete process.env.REGISTRY_NOTIFICATION_EMAIL;
  delete process.env.SLA_ESCALATION_SECRET;
});

describe("SLA escalation selection", () => {
  const now = new Date("2026-05-22T12:00:00.000Z");

  it("selects overdue reviewer, Registry, and no-reviewer mapping requests", async () => {
    const { selectSlaEscalationTargets } = await import("../lib/sla-escalations");
    const targets = selectSlaEscalationTargets([
      submission({ id: "reviewer" }),
      submission({ id: "registry", status: "pending_registry_review" }),
      submission({ id: "triage", status: "pending_registry_review", assignedTo: undefined, routingFlags: ["no_reviewer_mapping"] })
    ], now);

    expect(targets.map((target) => [target.submission.id, target.target])).toEqual([
      ["reviewer", "reviewer"],
      ["registry", "registry_final_review"],
      ["triage", "registry_triage"]
    ]);
  });

  it("skips due-soon, final, and already escalated today records", async () => {
    const { selectSlaEscalationTargets } = await import("../lib/sla-escalations");
    const targets = selectSlaEscalationTargets([
      submission({ id: "due-soon", createdAt: "2026-05-19T12:00:00.000Z" }),
      submission({ id: "final", status: "registry_approved" }),
      submission({
        id: "deduped",
        auditTrail: [{
          id: "audit-1",
          at: "2026-05-22T08:00:00.000Z",
          actorId: "system",
          actorName: "System Scheduler",
          action: "sla.reviewer_overdue_email",
          targetType: "submission",
          targetId: "deduped"
        }]
      })
    ], now);

    expect(targets).toHaveLength(0);
  });
});

describe("SLA escalation execution", () => {
  it("logs escalation emails and audit events in log mode", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "costaatt-sla-"));
    process.env.EMAIL_LOG_PATH = path.join(dir, "email-log.jsonl");
    process.env.EMAIL_DELIVERY_MODE = "log";
    process.env.REGISTRY_NOTIFICATION_EMAIL = "registrar@costaatt.edu.tt";

    vi.doMock("../lib/admin-settings", () => ({
      getAdminSettings: vi.fn().mockResolvedValue({
        system: {
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
          updatedAt: "2026-06-01T00:00:00.000Z"
        }
      })
    }));
    const appendSubmissionAuditEvent = vi.fn().mockResolvedValue(null);
    vi.doMock("../lib/repository", () => ({
      listAllSubmissions: vi.fn().mockResolvedValue([
        submission({ id: "reviewer" }),
        submission({ id: "registry", status: "pending_registry_review" })
      ]),
      appendSubmissionAuditEvent
    }));
    const { runSlaEscalations } = await import("../lib/sla-escalations");

    const result = await runSlaEscalations({ now: new Date("2026-05-22T12:00:00.000Z") });

    expect(result.overdue).toBe(2);
    expect(result.loggedOrSent).toBe(2);
    expect(appendSubmissionAuditEvent).toHaveBeenCalledTimes(2);
    const entries = (await readFile(process.env.EMAIL_LOG_PATH, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
    expect(entries.map((entry) => entry.event)).toEqual(["sla.reviewer_overdue", "sla.registry_overdue"]);
  });

  it("validates bearer secrets for scheduler execution", async () => {
    process.env.SLA_ESCALATION_SECRET = "test-secret";
    const { hasMatchingEscalationSecret } = await import("../lib/sla-escalations");

    expect(hasMatchingEscalationSecret("Bearer test-secret")).toBe(true);
    expect(hasMatchingEscalationSecret("Bearer wrong-secret")).toBe(false);
    expect(hasMatchingEscalationSecret(null)).toBe(false);
  });
});
