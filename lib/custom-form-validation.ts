import { z } from "zod";
import type { CustomFormField, SsoUser } from "./types";

export const customFormStatuses = ["draft", "published", "unpublished", "archived"] as const;
export const customSubmissionStatuses = ["draft", "submitted", "in_review", "needs_information", "approved", "declined", "completed", "closed"] as const;
export const customFieldTypes = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "dropdown",
  "multi_select",
  "radio",
  "checkbox",
  "date",
  "file_upload",
  "declaration_checkbox",
  "student_profile",
  "section_header",
  "instructions"
] as const;

const slugSchema = z.preprocess(
  (value) => {
    const text = String(value || "").trim();
    if (!text) return undefined;
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  },
  z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes.").optional()
);

export const customFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(2).max(80).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Field keys must start with a letter and use letters, numbers, or underscores."),
  label: z.string().trim().min(1).max(160),
  type: z.enum(customFieldTypes),
  helpText: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  options: z.array(z.string().trim().min(1).max(160)).optional(),
  profileBinding: z.enum(["studentId", "firstName", "lastName", "email", "fullName"]).optional()
}).superRefine((field, ctx) => {
  if (["dropdown", "multi_select", "radio"].includes(field.type) && (!field.options || field.options.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Options are required for this field type." });
  }
  if (field.type === "student_profile" && !field.profileBinding) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["profileBinding"], message: "Choose the student profile value." });
  }
});

export const customWorkflowStepSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(2).max(80),
  label: z.string().trim().min(1).max(160),
  type: z.enum(["review", "approval", "processing"]),
  sortOrder: z.number().int().min(0).default(0),
  assignee: z.object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().email(),
    role: z.enum(["reviewer", "approver", "processor"])
  }),
  required: z.boolean().default(true)
});

export const customEmailTemplateSchema = z.object({
  id: z.string().optional(),
  event: z.enum(["submission_confirmation", "reviewer_notification", "approved", "declined", "completed", "internal_notification"]),
  enabled: z.boolean().default(true),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  recipientGroup: z.enum(["requester", "reviewer", "approver", "processor", "internal"]),
  cc: z.array(z.string().trim().email()).optional()
});

export const customFormInputSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(3).max(2000),
  department: z.string().trim().min(2).max(160),
  targetAudience: z.string().trim().min(2).max(300),
  openAt: z.string().trim().optional(),
  closeAt: z.string().trim().optional(),
  fields: z.array(customFieldSchema).default([]),
  workflowSteps: z.array(customWorkflowStepSchema).default([]),
  emailTemplates: z.array(customEmailTemplateSchema).default([])
}).superRefine((form, ctx) => {
  const keys = form.fields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fields"], message: "Field keys must be unique." });
  }
  if (form.openAt && form.closeAt && new Date(form.openAt).getTime() > new Date(form.closeAt).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["closeAt"], message: "Close date must be after open date." });
  }
});

export const customSubmissionPatchSchema = z.object({
  status: z.enum(customSubmissionStatuses).optional(),
  comment: z.string().trim().max(2000).optional()
});

export type CustomFormInput = z.infer<typeof customFormInputSchema>;

export function validateCustomResponses(fields: CustomFormField[], responses: Record<string, unknown>, user: SsoUser) {
  const errors: string[] = [];
  const normalized: Record<string, unknown> = {};

  for (const field of fields.sort((left, right) => left.sortOrder - right.sortOrder)) {
    if (field.type === "section_header" || field.type === "instructions") continue;
    const value = field.type === "student_profile" ? profileValue(field.profileBinding, user) : responses[field.key];
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0) || value === false;

    if (field.required && empty) errors.push(`${field.label} is required.`);
    if (!empty && field.type === "email" && typeof value === "string" && !z.string().email().safeParse(value).success) errors.push(`${field.label} must be a valid email address.`);
    if (!empty && field.type === "phone" && typeof value === "string" && !/^[0-9+()\-\s.]{7,}$/.test(value)) errors.push(`${field.label} must be a valid phone number.`);
    if (!empty && ["dropdown", "radio"].includes(field.type) && field.options && !field.options.includes(String(value))) errors.push(`${field.label} has an invalid selection.`);
    if (!empty && field.type === "multi_select" && field.options && Array.isArray(value) && value.some((item) => !field.options?.includes(String(item)))) errors.push(`${field.label} has an invalid selection.`);
    normalized[field.key] = value;
  }

  return { errors, normalized };
}

function profileValue(binding: CustomFormField["profileBinding"], user: SsoUser) {
  if (binding === "studentId") return user.studentId;
  if (binding === "firstName") return user.firstName;
  if (binding === "lastName") return user.lastName;
  if (binding === "email") return user.email;
  if (binding === "fullName") return `${user.firstName} ${user.lastName}`;
  return "";
}
