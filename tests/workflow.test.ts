import { mkdtemp } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSsoToken, verifySsoToken } from "../lib/auth";
import { lookupCourseReferences, normalizeCourseMatch } from "../lib/reference-data";
import { reviewerPatchSchema } from "../lib/validation";
import {
  assignmentForPayload,
  enrichCourseLine,
  initialWorkflowStatus,
  routingFlagsForPayload,
  sanitizeText,
  statusForReviewerAction
} from "../lib/workflow";
import type { SubmissionPayload } from "../lib/types";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

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
    expect(user?.roles).toEqual(["registry_staff", "registry_admin", "student"]);
  });

  it("adds internal Registry and system roles from email when SSO omits roles", () => {
    const registryToken = createSsoToken({
      studentId: "REG-RC",
      firstName: "Rhonda",
      lastName: "Cumberbatch",
      email: "rcumberbatch@costaatt.edu.tt"
    });
    const systemToken = createSsoToken({
      studentId: "SYS-DH",
      firstName: "Darren",
      lastName: "Headley",
      email: "dheadley@costaatt.edu.tt"
    });
    const leaToken = createSsoToken({
      studentId: "REG-LS",
      firstName: "Lea-Andro",
      lastName: "Sandiford",
      email: "lsandiford@costaatt.edu.tt"
    });

    expect(verifySsoToken(registryToken)?.roles).toEqual(["registry_admin", "registry_staff", "system_admin", "student"]);
    expect(verifySsoToken(systemToken)?.roles).toEqual(["system_admin", "student"]);
    expect(verifySsoToken(leaToken)?.roles).toEqual(["registry_staff", "student"]);

    for (const [email, roles] of [
      ["kbanfield@costaatt.edu.tt", ["registry_staff", "system_admin", "student"]],
      ["nithomas@costaatt.edu.tt", ["registry_staff", "system_admin", "student"]],
      ["gking@costaatt.edu.tt", ["registry_admin", "registry_staff", "system_admin", "student"]],
      ["rcumberbatch@costaatt.edu.tt", ["registry_admin", "registry_staff", "system_admin", "student"]]
    ] as const) {
      const bridgeToken = createSsoToken({
        studentId: "REG-BRIDGE",
        firstName: "Temporary",
        lastName: "Bridge",
        email
      });
      expect(verifySsoToken(bridgeToken)?.roles).toEqual(roles);
    }
  });
});

describe("development identity simulator", () => {
  it("creates assigned reviewer identities from manual input", async () => {
    const { reviewerIdentityFromInput } = await import("../lib/dev-identities");

    expect(reviewerIdentityFromInput({
      name: "Jesinta Tobas",
      email: "nursingdepartment@costaatt.edu.tt",
      role: "lecturer"
    })).toEqual({
      studentId: "LECTURER-DEV",
      firstName: "Jesinta",
      lastName: "Tobas",
      email: "nursingdepartment@costaatt.edu.tt",
      roles: ["lecturer"]
    });
  });

  it("builds switchable demo identities with route destinations", async () => {
    const { devIdentityFromOptionId, devIdentityOptions, devPresetRedirectFor } = await import("../lib/dev-identities");

    expect(devPresetRedirectFor("registry_admin")).toBe("/admin/dashboard");
    expect(devPresetRedirectFor("registry_staff")).toBe("/admin/submissions");
    expect(devIdentityFromOptionId("preset:student").redirectTo).toBe("/forms");
    expect(devIdentityFromOptionId("preset:nigel_all_access").email).toBe("NiThomas@costaatt.edu.tt");
    expect(devIdentityFromOptionId("preset:kempson_all_access").email).toBe("KBanfield@costaatt.edu.tt");
    expect(devIdentityOptions().some((option) => option.group === "Course reviewers" && option.email.toLowerCase() === "nursingdepartment@costaatt.edu.tt")).toBe(true);
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

  it("requires reviewer comments for decline and needs-information decisions", () => {
    expect(reviewerPatchSchema.safeParse({ action: "decline" }).success).toBe(false);
    expect(reviewerPatchSchema.safeParse({ action: "needs_information" }).success).toBe(false);
    expect(reviewerPatchSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(reviewerPatchSchema.safeParse({ action: "decline", comment: "Prerequisite not met." }).success).toBe(true);
  });

  it("accepts multiple Course Override request types", async () => {
    const { submissionPayloadSchema } = await import("../lib/validation");

    expect(submissionPayloadSchema.safeParse({
      ...basePayload,
      requestType: "Override Co-requisite, Override Pre-requisite",
      requestTypes: ["Override Co-requisite", "Override Pre-requisite"],
      semester: "Semester 1",
      advisorName: "Advisor",
      courses: [{ crn: "23021", courseCode: "NURS 411", courseTitle: "Professional Development" }],
      declarations: [
        "I have met with an Academic Advisor to determine the course for which I am requesting an override.",
        "I understand that Registry may place me in the next available CRN where applicable."
      ]
    }).success).toBe(true);
  });
});

describe("Registry form settings", () => {
  it("merges default academic year options into system settings", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "registry-settings-"));
    vi.spyOn(process, "cwd").mockReturnValue(dir);
    const { updateSystemSettings } = await import("../lib/admin-settings");
    const settings = await updateSystemSettings({
      academicYears: ["2026/2027", "2027/2028"],
      semesters: ["Semester 1"]
    });

    expect(settings.academicYears).toEqual(["2026/2027", "2027/2028"]);
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
