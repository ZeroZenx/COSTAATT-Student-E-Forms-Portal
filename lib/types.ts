export type FormType = "course-override" | "academic-standing-petition" | "repeat-rule";

export type SubmissionStatus =
  | "submitted"
  | "pending_advisor_review"
  | "advisor_approved"
  | "advisor_declined"
  | "in_review"
  | "needs_information"
  | "pending_registry_review"
  | "registry_approved"
  | "registry_declined"
  | "approved"
  | "declined"
  | "closed";

export type UserRole =
  | "student"
  | "advisor"
  | "lecturer"
  | "registry_staff"
  | "registry_admin"
  | "system_admin";

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

export type SubmissionPayload = {
  formType: FormType;
  requestType?: string;
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

export type AdminPatch = {
  status?: SubmissionStatus;
  adminComment?: string;
  internalNotes?: string;
};
