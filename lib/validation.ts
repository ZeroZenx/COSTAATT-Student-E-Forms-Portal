import { z } from "zod";
import { formDefinitions, submissionStatuses } from "./forms";

export const courseLineSchema = z.object({
  crn: z.string().trim().min(3, "CRN is required."),
  courseCode: z.string().trim().min(3, "Course code is required."),
  courseTitle: z.string().trim().min(3, "Course title is required.")
});

export const submissionPayloadSchema = z.object({
  formType: z.enum(["course-override", "academic-standing-petition", "repeat-rule"]),
  requestType: z.string().trim().optional(),
  requestTypes: z.array(z.string().trim()).optional(),
  academicYear: z.string().trim().min(4, "Academic year is required."),
  semester: z.string().trim().min(3, "Semester is required."),
  programme: z.string().trim().min(2, "Programme is required."),
  degree: z.string().trim().min(2, "Certificate or degree is required."),
  phone: z.string().trim().optional(),
  advisorName: z.string().trim().min(2, "Academic advisor is required."),
  advisorDate: z.string().trim().optional(),
  courses: z.array(courseLineSchema).min(1, "At least one course is required.").max(5),
  declarations: z.array(z.string()).min(1),
  studentComment: z.string().trim().max(1500).optional()
}).superRefine((value, ctx) => {
  const definition = formDefinitions[value.formType];
  const missingDeclarations = definition.declarations.filter((declaration) => !value.declarations.includes(declaration));
  if (missingDeclarations.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["declarations"],
      message: "All required declarations must be confirmed."
    });
  }

  const requestTypes = normalizedRequestTypes(value.requestTypes, value.requestType);
  if (requestTypes.length === 0 || requestTypes.some((requestType) => !definition.requestTypes.includes(requestType))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["requestTypes"],
      message: "Select a valid request type."
    });
  }
});

function normalizedRequestTypes(requestTypes?: string[], requestType?: string) {
  const values = requestTypes?.length ? requestTypes : String(requestType || "").split(",");
  return values.map((value) => value.trim()).filter(Boolean);
}

export const adminPatchSchema = z.object({
  status: z.enum(submissionStatuses).optional(),
  adminComment: z.string().trim().max(2000).optional(),
  internalNotes: z.string().trim().max(3000).optional(),
  registryDecision: z.enum(["approved", "declined", "needs_information", "closed"]).optional(),
  registryComment: z.string().trim().max(2000).optional()
});

export const reviewerPatchSchema = z.object({
  action: z.enum(["approve", "decline", "needs_information"]),
  comment: z.string().trim().max(2000).optional()
}).superRefine((value, ctx) => {
  if ((value.action === "decline" || value.action === "needs_information") && !value.comment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["comment"],
      message: "A comment is required for decline or needs-information decisions."
    });
  }
});
