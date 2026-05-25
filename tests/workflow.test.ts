import { describe, expect, it } from "vitest";
import { createSsoToken, verifySsoToken } from "../lib/auth";
import { enrichCourseLine, initialWorkflowStatus, sanitizeText } from "../lib/workflow";
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
  });

  it("sanitizes comments before storage", () => {
    expect(sanitizeText("<script>Need help</script>")).toBe("scriptNeed help/script");
  });
});
