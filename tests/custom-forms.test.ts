import { mkdtemp } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSsoToken, verifySsoToken } from "../lib/auth";
import { canManageCustomForm, canViewCustomSubmission } from "../lib/custom-permissions";
import { customFormInputSchema, validateCustomResponses } from "../lib/custom-form-validation";
import { renderTemplate } from "../lib/custom-email";
import type { CustomFormField, CustomFormRecord, CustomSubmissionRecord, SsoUser } from "../lib/types";

const actor: SsoUser = {
  studentId: "STAFF-001",
  firstName: "Form",
  lastName: "Manager",
  email: "forms@costaatt.edu.tt",
  roles: ["form_creator", "student"]
};

const student: SsoUser = {
  studentId: "00012345",
  firstName: "Asha",
  lastName: "Student",
  email: "asha@student.costaatt.edu.tt",
  roles: ["student"]
};

async function useTempStore() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "custom-eforms-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("custom e-forms", () => {
  it("normalizes new Phase 3 roles from SSO tokens", () => {
    const user = verifySsoToken(createSsoToken({
      ...actor,
      roles: ["form_creator", "form_manager", "reviewer", "approver"]
    }));

    expect(user?.roles).toEqual(["form_creator", "form_manager", "reviewer", "approver", "student"]);
  });

  it("creates forms and preserves immutable published versions", async () => {
    await useTempStore();
    const { createCustomForm, publishCustomForm, updateCustomForm, getCustomFormVersion } = await import("../lib/custom-form-repository");

    const form = await createCustomForm({
      title: "Graduation Sign-up",
      description: "Graduation registration and gown collection.",
      department: "Student Services",
      targetAudience: "Graduating students",
      fields: [{
        key: "gown_size",
        label: "Gown size",
        type: "dropdown",
        required: true,
        sortOrder: 0,
        options: ["S", "M", "L"]
      }],
      workflowSteps: [],
      emailTemplates: []
    }, actor);
    const published = await publishCustomForm(form.id, actor);
    await updateCustomForm(form.id, { title: "Graduation and Gown Collection" }, actor);
    const version = await getCustomFormVersion(published?.currentVersionId || "");

    expect(published?.versionNumber).toBe(1);
    expect(version?.definition.title).toBe("Graduation Sign-up");
  });

  it("validates required fields and field-specific values", () => {
    const fields: CustomFormField[] = [
      { id: "1", key: "email", label: "Email", type: "email", required: true, sortOrder: 0 },
      { id: "2", key: "service", label: "Service", type: "dropdown", required: true, sortOrder: 1, options: ["Counselling"] },
      { id: "3", key: "student_id", label: "Student ID", type: "student_profile", required: true, sortOrder: 2, profileBinding: "studentId" }
    ];

    expect(validateCustomResponses(fields, { email: "bad", service: "Other" }, student).errors).toHaveLength(2);
    expect(validateCustomResponses(fields, { email: "asha@student.costaatt.edu.tt", service: "Counselling" }, student).normalized.student_id).toBe("00012345");
  });

  it("normalizes blank and human-entered slugs before saving", () => {
    expect(customFormInputSchema.parse({
      slug: "Graduation Sign Up 2026",
      title: "Graduation Sign Up",
      description: "Graduation registration.",
      department: "Student Services",
      targetAudience: "Graduating students"
    }).slug).toBe("graduation-sign-up-2026");

    expect(customFormInputSchema.parse({
      slug: "",
      title: "Student Services Request",
      description: "Student services support.",
      department: "Student Services",
      targetAudience: "All students"
    }).slug).toBeUndefined();
  });

  it("enforces creator and student submission visibility rules", () => {
    const form = {
      id: "form-1",
      department: "Student Services",
      createdBy: actor
    } as CustomFormRecord;
    const submission = {
      student,
      assignments: [{ assignedTo: { name: "Reviewer", email: "reviewer@costaatt.edu.tt", role: "reviewer" }, status: "pending" }]
    } as CustomSubmissionRecord;

    expect(canManageCustomForm(actor, form)).toBe(true);
    expect(canViewCustomSubmission(student, submission, form)).toBe(true);
    expect(canViewCustomSubmission({ ...actor, email: "other@costaatt.edu.tt", roles: ["form_creator"] }, submission, form)).toBe(false);
  });

  it("renders configured email placeholders", () => {
    const form = { title: "Health Counselling", emailTemplates: [] } as unknown as CustomFormRecord;
    const submission = {
      id: "sub-1",
      student,
      status: "in_review",
      assignments: [{ assignedTo: { name: "Nurse Reviewer", email: "nurse@costaatt.edu.tt", role: "reviewer" } }]
    } as CustomSubmissionRecord;

    expect(renderTemplate("{student_name} {student_id} {form_title} {submission_id} {status} {reviewer_name}", form, submission, actor))
      .toBe("Asha Student 00012345 Health Counselling sub-1 in review Nurse Reviewer");
  });
});
