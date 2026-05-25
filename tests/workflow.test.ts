import { describe, expect, it } from "vitest";
import { createSsoToken, verifySsoToken } from "../lib/auth";
import { lookupCourseReferences, normalizeCourseMatch } from "../lib/reference-data";
import {
  assignmentForPayload,
  enrichCourseLine,
  initialWorkflowStatus,
  routingFlagsForPayload,
  sanitizeText,
  statusForReviewerAction
} from "../lib/workflow";
import type { SubmissionPayload } from "../lib/types";

describe("QuickLaunch-compatible local SSO", () => {
  it("round-trips signed mock identities and normalizes roles", () => {
    const token = createSsoToken({
      studentId: "00012345",
      firstName: "Asha",
      lastName: "Student",
      email: "asha@student.costaatt.edu.tt",
      roles: ["registry_staff", "registry_admin"]
    });

    const user = verifySsoToken(token);
    expect(user?.roles).toEqual(["registry_staff", "registry_admin"]);
  });
});

describe("workflow routing", () => {
  const basePayload: SubmissionPayload = {
    formType: "course-override",
    requestType: "Override Pre-requisite",
    academicYear: "2026/2027",
    semester: "Semester 1",
    programme: "AAS - Information Technology",
    degree: "Associate Degree",
    advisorName: "",
    courses: [],
    declarations: [],
    studentComment: "<please review>"
  };

  it("flags unmapped CRNs for Registry review", () => {
    const enriched = enrichCourseLine({ crn: "NO-SUCH-CRN", courseCode: "", courseTitle: "" });
    expect(enriched.noLecturerAssigned).toBe(true);
    expect(initialWorkflowStatus("course-override", { ...basePayload, courses: [enriched] })).toBe("pending_registry_review");
    expect(routingFlagsForPayload({ ...basePayload, courses: [enriched] })).toEqual(["no_reviewer_mapping"]);
  });

  it("routes mapped reviewer approvals to Registry review", () => {
    const payload = {
      ...basePayload,
      courses: [{
        crn: "12345",
        courseCode: "COMP 101",
        courseTitle: "Computing",
        lecturerName: "Alex Lecturer",
        lecturerEmail: "alex.lecturer@costaatt.edu.tt"
      }]
    };
    expect(assignmentForPayload(payload)).toEqual({
      name: "Alex Lecturer",
      email: "alex.lecturer@costaatt.edu.tt",
      role: "lecturer"
    });
    expect(initialWorkflowStatus("course-override", payload)).toBe("pending_advisor_review");
    expect(statusForReviewerAction("approve")).toBe("pending_registry_review");
  });

  it("sanitizes comments before storage", () => {
    expect(sanitizeText("<script>Need help</script>")).toBe("scriptNeed help/script");
  });
});

describe("course lookup", () => {
  it("returns normalized reviewer data for course-code lookup", () => {
    const matches = lookupCourseReferences("courseCode", "ACCT 126");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      courseCode: "ACCT 126",
      courseTitle: "ACCT 126",
      reviewerName: "Jerome Khan",
      reviewerEmail: "jkhan@costaatt.edu.tt",
      reviewerRole: "advisor"
    });
  });

  it("supports course-title lookup and lecturer priority when section data is present", () => {
    const match = normalizeCourseMatch({
      crn: "12345",
      courseCode: "COMP 101",
      courseTitle: "Introduction to Computing",
      advisorName: "Fallback Advisor",
      advisorEmail: "advisor@costaatt.edu.tt",
      lecturerName: "Primary Lecturer",
      lecturerEmail: "lecturer@costaatt.edu.tt",
      campus: "City Campus",
      section: "01"
    });

    expect(match).toMatchObject({
      crn: "12345",
      courseCode: "COMP 101",
      courseTitle: "Introduction to Computing",
      reviewerName: "Primary Lecturer",
      reviewerEmail: "lecturer@costaatt.edu.tt",
      reviewerRole: "lecturer",
      campus: "City Campus",
      section: "01",
      noReviewerMapping: false
    });
  });
});
