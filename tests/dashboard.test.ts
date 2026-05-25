import { describe, expect, it } from "vitest";
import {
  ageInBusinessDays,
  businessDaysBetween,
  registryDashboardSummary,
  slaState
} from "../lib/dashboard";
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
    createdAt: "2026-05-18T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    ...overrides
  };
}

describe("dashboard SLA reporting", () => {
  it("calculates business days excluding weekends", () => {
    expect(businessDaysBetween("2026-05-22T12:00:00.000Z", "2026-05-26T12:00:00.000Z")).toBe(2);
  });

  it("marks pending requests overdue after three business days", () => {
    const record = submission({ createdAt: "2026-05-18T12:00:00.000Z" });

    expect(ageInBusinessDays(record, new Date("2026-05-22T12:00:00.000Z"))).toBe(4);
    expect(slaState(record, new Date("2026-05-22T12:00:00.000Z"))).toBe("overdue");
  });

  it("does not mark final statuses overdue", () => {
    const record = submission({
      status: "registry_approved",
      createdAt: "2026-05-01T12:00:00.000Z"
    });

    expect(slaState(record, new Date("2026-05-25T12:00:00.000Z"))).toBe("final");
  });

  it("summarizes registry counters and routing exceptions", () => {
    const records = [
      submission({ id: "a", status: "pending_advisor_review" }),
      submission({ id: "b", status: "pending_registry_review", routingFlags: ["no_reviewer_mapping"] }),
      submission({ id: "c", status: "registry_approved" })
    ];
    const summary = registryDashboardSummary(records, new Date("2026-05-22T12:00:00.000Z"));

    expect(summary.total).toBe(3);
    expect(summary.pendingReviewer).toBe(1);
    expect(summary.pendingRegistry).toBe(1);
    expect(summary.approved).toBe(1);
    expect(summary.noReviewerMapping).toBe(1);
    expect(summary.overdue).toBe(2);
  });
});
