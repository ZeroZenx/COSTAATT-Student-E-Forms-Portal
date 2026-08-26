import crypto from "crypto";
import path from "path";
import { readJsonFile, writeJsonFile } from "./json-store";
import { auditEvent, sanitizeText } from "./workflow";
import type {
  AttachmentRecord,
  CustomEmailTemplate,
  CustomFieldResponse,
  CustomFormField,
  CustomFormRecord,
  CustomFormVersion,
  CustomSubmissionRecord,
  CustomSubmissionStatus,
  CustomWorkflowAssignment,
  CustomWorkflowStep,
  SsoUser
} from "./types";
import type { CustomFormInput } from "./custom-form-validation";

type CustomStore = {
  forms: CustomFormRecord[];
  versions: CustomFormVersion[];
  submissions: CustomSubmissionRecord[];
};

const storePath = path.join(process.cwd(), "data", "custom-eforms.json");

async function readStore(): Promise<CustomStore> {
  return readJsonFile<CustomStore>(storePath, { forms: [], versions: [], submissions: [] });
}

async function writeStore(store: CustomStore) {
  await writeJsonFile(storePath, store);
}

export async function listCustomForms() {
  const store = await readStore();
  return store.forms.filter((form) => form.status !== "archived").sort(byUpdatedDesc);
}

export async function listPublishedCustomForms(now = new Date()) {
  const forms = await listCustomForms();
  return forms.filter((form) => isCustomFormAvailable(form, now));
}

export async function getCustomForm(idOrSlug: string) {
  const store = await readStore();
  return store.forms.find((form) => form.id === idOrSlug || form.slug === idOrSlug) || null;
}

export async function getCustomFormVersion(id: string) {
  const store = await readStore();
  return store.versions.find((version) => version.id === id) || null;
}

export async function createCustomForm(input: CustomFormInput, actor: SsoUser, ipAddress?: string) {
  const store = await readStore();
  const now = new Date().toISOString();
  const form: CustomFormRecord = {
    id: crypto.randomUUID(),
    slug: uniqueSlug(input.slug || slugify(input.title), store.forms),
    title: input.title,
    description: input.description,
    department: input.department,
    targetAudience: input.targetAudience,
    status: "draft",
    openAt: input.openAt || undefined,
    closeAt: input.closeAt || undefined,
    createdBy: actor,
    fields: normalizeFields(input.fields),
    workflowSteps: normalizeWorkflowSteps(input.workflowSteps),
    emailTemplates: normalizeEmailTemplates(input.emailTemplates),
    versionNumber: 0,
    createdAt: now,
    updatedAt: now
  };
  form.emailTemplates = form.emailTemplates.length ? form.emailTemplates : defaultEmailTemplates(form.title);
  store.forms.unshift(form);
  await writeStore(store);
  await appendCustomAudit("custom_form.created", "custom_form", form.id, actor, ipAddress, { title: form.title });
  return form;
}

export async function updateCustomForm(id: string, input: Partial<CustomFormInput>, actor: SsoUser, ipAddress?: string) {
  const store = await readStore();
  const index = store.forms.findIndex((form) => form.id === id);
  if (index === -1) return null;
  const existing = store.forms[index];
  const next: CustomFormRecord = {
    ...existing,
    slug: input.slug && input.slug !== existing.slug ? uniqueSlug(input.slug, store.forms.filter((form) => form.id !== id)) : existing.slug,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    department: input.department ?? existing.department,
    targetAudience: input.targetAudience ?? existing.targetAudience,
    openAt: input.openAt ?? existing.openAt,
    closeAt: input.closeAt ?? existing.closeAt,
    fields: input.fields ? normalizeFields(input.fields) : existing.fields,
    workflowSteps: input.workflowSteps ? normalizeWorkflowSteps(input.workflowSteps) : existing.workflowSteps,
    emailTemplates: input.emailTemplates ? normalizeEmailTemplates(input.emailTemplates) : existing.emailTemplates,
    status: existing.status === "published" ? "unpublished" : existing.status,
    updatedAt: new Date().toISOString()
  };
  store.forms[index] = next;
  await writeStore(store);
  await appendCustomAudit("custom_form.updated", "custom_form", id, actor, ipAddress);
  return next;
}

export async function publishCustomForm(id: string, actor: SsoUser, ipAddress?: string) {
  const store = await readStore();
  const index = store.forms.findIndex((form) => form.id === id);
  if (index === -1) return null;
  const form = store.forms[index];
  const now = new Date().toISOString();
  const versionNumber = form.versionNumber + 1;
  const version: CustomFormVersion = {
    id: crypto.randomUUID(),
    formId: form.id,
    versionNumber,
    definition: { ...form, versionNumber },
    publishedBy: actor,
    publishedAt: now,
    createdAt: now
  };
  store.versions.unshift(version);
  store.forms[index] = {
    ...form,
    status: "published",
    currentVersionId: version.id,
    versionNumber,
    updatedAt: now
  };
  await writeStore(store);
  await appendCustomAudit("custom_form.published", "custom_form", id, actor, ipAddress, { versionNumber });
  return store.forms[index];
}

export async function setCustomFormStatus(id: string, status: "unpublished" | "archived", actor: SsoUser, ipAddress?: string) {
  const store = await readStore();
  const index = store.forms.findIndex((form) => form.id === id);
  if (index === -1) return null;
  store.forms[index] = {
    ...store.forms[index],
    status,
    archivedAt: status === "archived" ? new Date().toISOString() : store.forms[index].archivedAt,
    updatedAt: new Date().toISOString()
  };
  await writeStore(store);
  await appendCustomAudit(`custom_form.${status}`, "custom_form", id, actor, ipAddress);
  return store.forms[index];
}

export async function cloneCustomForm(id: string, actor: SsoUser, ipAddress?: string) {
  const source = await getCustomForm(id);
  if (!source) return null;
  return createCustomForm({
    slug: `${source.slug}-copy`,
    title: `${source.title} Copy`,
    description: source.description,
    department: source.department,
    targetAudience: source.targetAudience,
    openAt: source.openAt,
    closeAt: source.closeAt,
    fields: source.fields,
    workflowSteps: source.workflowSteps,
    emailTemplates: source.emailTemplates
  }, actor, ipAddress);
}

export function isCustomFormAvailable(form: CustomFormRecord, now = new Date()) {
  const afterOpen = !form.openAt || new Date(form.openAt).getTime() <= now.getTime();
  const beforeClose = !form.closeAt || new Date(form.closeAt).getTime() >= now.getTime();
  return form.status === "published" && Boolean(form.currentVersionId) && afterOpen && beforeClose;
}

export async function createCustomSubmission(input: {
  form: CustomFormRecord;
  student: SsoUser;
  responses: Record<string, unknown>;
  attachments?: Record<string, AttachmentRecord>;
  ipAddress?: string;
}) {
  const store = await readStore();
  const version = store.versions.find((item) => item.id === input.form.currentVersionId);
  if (!version) throw new Error("This form does not have a published version.");
  const now = new Date().toISOString();
  const assignments = version.definition.workflowSteps
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((step): CustomWorkflowAssignment => ({
      id: crypto.randomUUID(),
      submissionId: "",
      stepId: step.id,
      assignedTo: step.assignee,
      status: "pending",
      createdAt: now
    }));
  const submission: CustomSubmissionRecord = {
    id: crypto.randomUUID(),
    formId: input.form.id,
    formVersionId: version.id,
    formTitle: version.definition.title,
    formSlug: version.definition.slug,
    student: input.student,
    status: assignments.length > 0 ? "in_review" : "submitted",
    responses: toResponseList(version.definition.fields, input.responses, input.attachments || {}),
    assignments: assignments.map((assignment) => ({ ...assignment, submissionId: "" })),
    comments: [],
    auditTrail: [auditEvent(input.student, "custom_submission.created", "custom_submission", "pending", input.ipAddress, { formId: input.form.id })],
    submittedAt: now,
    createdAt: now,
    updatedAt: now
  };
  submission.assignments = submission.assignments.map((assignment) => ({ ...assignment, submissionId: submission.id }));
  submission.auditTrail = submission.auditTrail.map((event) => ({ ...event, targetId: submission.id }));
  store.submissions.unshift(submission);
  await writeStore(store);
  return submission;
}

export async function listCustomSubmissions() {
  const store = await readStore();
  return store.submissions.sort(byUpdatedDesc);
}

export async function listStudentCustomSubmissions(studentId: string) {
  const submissions = await listCustomSubmissions();
  return submissions.filter((submission) => submission.student.studentId === studentId);
}

export async function listAssignedCustomSubmissions(user: SsoUser) {
  const submissions = await listCustomSubmissions();
  return submissions.filter((submission) => submission.assignments.some((assignment) => assignment.assignedTo.email.toLowerCase() === user.email.toLowerCase()));
}

export async function getCustomSubmission(id: string) {
  const store = await readStore();
  return store.submissions.find((submission) => submission.id.toLowerCase() === id.toLowerCase()) || null;
}

export async function updateCustomSubmission(id: string, patch: { status?: CustomSubmissionStatus; comment?: string }, actor: SsoUser, ipAddress?: string) {
  const store = await readStore();
  const index = store.submissions.findIndex((submission) => submission.id === id);
  if (index === -1) return null;
  const existing = store.submissions[index];
  const comment = sanitizeText(patch.comment);
  const now = new Date().toISOString();
  const next: CustomSubmissionRecord = {
    ...existing,
    status: patch.status || existing.status,
    comments: comment ? [...existing.comments, { id: crypto.randomUUID(), actor, comment, createdAt: now }] : existing.comments,
    auditTrail: [
      ...(existing.auditTrail || []),
      auditEvent(actor, "custom_submission.updated", "custom_submission", id, ipAddress, {
        status: patch.status,
        comment: Boolean(comment)
      })
    ],
    updatedAt: now
  };
  if (patch.status === "approved" || patch.status === "declined" || patch.status === "needs_information" || patch.status === "completed") {
    const assignmentStatus: CustomWorkflowAssignment["status"] = patch.status;
    next.assignments = next.assignments.map((assignment) => (
      assignment.status === "pending"
        ? {
            ...assignment,
            status: assignmentStatus,
            decision: patch.status,
            comment,
            actedBy: actor,
            actedAt: now
          }
        : assignment
    ));
  }
  store.submissions[index] = next;
  await writeStore(store);
  return next;
}

export async function appendCustomAudit(action: string, targetType: string, targetId: string, actor: SsoUser, ipAddress?: string, metadata?: Record<string, unknown>) {
  const store = await readStore();
  const event = auditEvent(actor, action, targetType, targetId, ipAddress, metadata);
  const submissionIndex = store.submissions.findIndex((submission) => submission.id === targetId);
  if (submissionIndex !== -1) {
    store.submissions[submissionIndex] = {
      ...store.submissions[submissionIndex],
      auditTrail: [...(store.submissions[submissionIndex].auditTrail || []), event],
      updatedAt: new Date().toISOString()
    };
    await writeStore(store);
  }
  return event;
}

function normalizeFields(fields: Array<Omit<CustomFormField, "id"> & { id?: string }>) {
  return fields.map((field, index) => ({
    ...field,
    id: field.id || crypto.randomUUID(),
    sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : index,
    required: Boolean(field.required),
    options: field.options?.map(String).filter(Boolean)
  }));
}

function normalizeWorkflowSteps(steps: Array<Omit<CustomWorkflowStep, "id"> & { id?: string }>) {
  return steps.map((step, index) => ({
    ...step,
    id: step.id || crypto.randomUUID(),
    sortOrder: Number.isFinite(step.sortOrder) ? step.sortOrder : index,
    required: step.required !== false
  }));
}

function normalizeEmailTemplates(templates: Array<Omit<CustomEmailTemplate, "id"> & { id?: string }>) {
  return templates.map((template) => ({
    ...template,
    id: template.id || crypto.randomUUID(),
    enabled: template.enabled !== false,
    cc: template.cc || []
  }));
}

function defaultEmailTemplates(formTitle: string): CustomEmailTemplate[] {
  return [
    {
      id: crypto.randomUUID(),
      event: "submission_confirmation",
      enabled: true,
      subject: "{form_title} submitted",
      body: "Hello {student_name}, your {form_title} request was received. Submission ID: {submission_id}.",
      recipientGroup: "requester",
      cc: []
    },
    {
      id: crypto.randomUUID(),
      event: "reviewer_notification",
      enabled: true,
      subject: `${formTitle} requires review`,
      body: "{student_name} submitted {form_title}. Open the request: {direct_submission_link}",
      recipientGroup: "reviewer",
      cc: []
    },
    {
      id: crypto.randomUUID(),
      event: "approved",
      enabled: true,
      subject: "{form_title} approved",
      body: "Your {form_title} request has been approved.",
      recipientGroup: "requester",
      cc: []
    },
    {
      id: crypto.randomUUID(),
      event: "declined",
      enabled: true,
      subject: "{form_title} declined",
      body: "Your {form_title} request has been declined.",
      recipientGroup: "requester",
      cc: []
    },
    {
      id: crypto.randomUUID(),
      event: "completed",
      enabled: true,
      subject: "{form_title} completed",
      body: "Your {form_title} request has been completed.",
      recipientGroup: "requester",
      cc: []
    }
  ];
}

function toResponseList(fields: CustomFormField[], responses: Record<string, unknown>, attachments: Record<string, AttachmentRecord>): CustomFieldResponse[] {
  return fields
    .filter((field) => field.type !== "section_header" && field.type !== "instructions")
    .map((field) => ({
      fieldKey: field.key,
      fieldType: field.type,
      value: field.type === "file_upload" ? undefined : responses[field.key],
      attachment: attachments[field.key]
    }));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "custom-form";
}

function uniqueSlug(base: string, forms: CustomFormRecord[]) {
  let slug = slugify(base);
  let suffix = 2;
  while (forms.some((form) => form.slug === slug)) {
    slug = `${slugify(base)}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function byUpdatedDesc<T extends { updatedAt: string }>(left: T, right: T) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}
