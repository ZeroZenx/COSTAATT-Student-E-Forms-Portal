export type FormType = "course-override" | "academic-standing-petition" | "repeat-rule";

export type SubmissionStatus =
  | "submitted"
  | "pending_advisor_review"
  | "advisor_approved"
  | "advisor_declined"
  | "needs_information"
  | "pending_registry_review"
  | "registry_approved"
  | "registry_declined"
  | "closed"
  // Legacy values are retained so existing records continue to load.
  | "in_review"
  | "approved"
  | "declined";

export type UserRole =
  | "student"
  | "advisor"
  | "lecturer"
  | "registry_staff"
  | "registry_admin"
  | "system_admin"
  | "form_creator"
  | "form_manager"
  | "reviewer"
  | "approver";

export type SsoUser = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: UserRole[];
};

export type CourseLine = {
  crn: string;
  courseCode: string;
  courseTitle: string;
  lecturerName?: string;
  lecturerEmail?: string;
  advisorName?: string;
  advisorEmail?: string;
  campus?: string;
  section?: string;
  noLecturerAssigned?: boolean;
};

export type RoutingFlag = "no_reviewer_mapping";

export type SubmissionPayload = {
  formType: FormType;
  requestType?: string;
  requestTypes?: string[];
  academicYear: string;
  semester: string;
  programme: string;
  degree: string;
  phone?: string;
  advisorName: string;
  advisorDate?: string;
  courses: CourseLine[];
  declarations: string[];
  studentComment?: string;
};

export type WorkflowEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  fromStatus?: SubmissionStatus;
  toStatus?: SubmissionStatus;
  comment?: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
};

export type AttachmentRecord = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  storageKey: string;
};

export type SubmissionRecord = {
  id: string;
  formType: FormType;
  status: SubmissionStatus;
  student: SsoUser;
  payload: SubmissionPayload;
  attachment?: AttachmentRecord;
  adminComment?: string;
  internalNotes?: string;
  routingFlags?: RoutingFlag[];
  reviewerDecision?: "approved" | "declined" | "needs_information";
  reviewerComment?: string;
  registryDecision?: "approved" | "declined" | "needs_information" | "closed";
  registryComment?: string;
  assignedTo?: {
    name: string;
    email: string;
    role: "advisor" | "lecturer" | "registry";
  };
  workflowHistory?: WorkflowEvent[];
  auditTrail?: AuditEvent[];
  createdAt: string;
  updatedAt: string;
};

export type StudentNotificationType =
  | "submission_created"
  | "reviewer_approved"
  | "reviewer_declined"
  | "reviewer_needs_information"
  | "registry_approved"
  | "registry_declined"
  | "registry_needs_information"
  | "registry_closed"
  | "registry_status_changed";

export type StudentNotification = {
  id: string;
  studentId: string;
  submissionId: string;
  type: StudentNotificationType;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
};

export type AdminPatch = {
  status?: SubmissionStatus;
  adminComment?: string;
  internalNotes?: string;
  registryDecision?: SubmissionRecord["registryDecision"];
  registryComment?: string;
};

export type ReviewerPatch = {
  action: "approve" | "decline" | "needs_information";
  comment?: string;
};

export type CustomFormStatus = "draft" | "published" | "unpublished" | "archived";

export type CustomSubmissionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_information"
  | "approved"
  | "declined"
  | "completed"
  | "closed";

export type CustomFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "dropdown"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "date"
  | "file_upload"
  | "declaration_checkbox"
  | "student_profile"
  | "section_header"
  | "instructions";

export type CustomFormField = {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  helpText?: string;
  required: boolean;
  sortOrder: number;
  options?: string[];
  profileBinding?: "studentId" | "firstName" | "lastName" | "email" | "fullName";
};

export type CustomWorkflowStep = {
  id: string;
  key: string;
  label: string;
  type: "review" | "approval" | "processing";
  sortOrder: number;
  assignee: {
    name: string;
    email: string;
    role: "reviewer" | "approver" | "processor";
  };
  required: boolean;
};

export type CustomEmailEvent =
  | "submission_confirmation"
  | "reviewer_notification"
  | "approved"
  | "declined"
  | "completed"
  | "internal_notification";

export type CustomEmailTemplate = {
  id: string;
  event: CustomEmailEvent;
  enabled: boolean;
  subject: string;
  body: string;
  recipientGroup: "requester" | "reviewer" | "approver" | "processor" | "internal";
  cc?: string[];
};

export type CustomFormRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  department: string;
  targetAudience: string;
  status: CustomFormStatus;
  openAt?: string;
  closeAt?: string;
  createdBy: SsoUser;
  fields: CustomFormField[];
  workflowSteps: CustomWorkflowStep[];
  emailTemplates: CustomEmailTemplate[];
  currentVersionId?: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type CustomFormVersion = {
  id: string;
  formId: string;
  versionNumber: number;
  definition: CustomFormRecord;
  publishedBy: SsoUser;
  publishedAt: string;
  createdAt: string;
};

export type CustomFieldResponse = {
  fieldKey: string;
  fieldType: CustomFieldType;
  value?: unknown;
  attachment?: AttachmentRecord;
};

export type CustomWorkflowAssignment = {
  id: string;
  submissionId: string;
  stepId: string;
  assignedTo: CustomWorkflowStep["assignee"];
  status: "pending" | "approved" | "declined" | "needs_information" | "completed";
  decision?: string;
  comment?: string;
  actedBy?: SsoUser;
  actedAt?: string;
  createdAt: string;
};

export type CustomSubmissionRecord = {
  id: string;
  formId: string;
  formVersionId: string;
  formTitle: string;
  formSlug: string;
  student: SsoUser;
  status: CustomSubmissionStatus;
  responses: CustomFieldResponse[];
  assignments: CustomWorkflowAssignment[];
  comments: Array<{
    id: string;
    actor: SsoUser;
    comment: string;
    createdAt: string;
  }>;
  auditTrail: AuditEvent[];
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
};
