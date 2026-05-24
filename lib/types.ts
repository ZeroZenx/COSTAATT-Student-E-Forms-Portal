export type FormType = "course-override" | "academic-standing-petition" | "repeat-rule";

export type SubmissionStatus =
  | "submitted"
  | "in_review"
  | "needs_information"
  | "approved"
  | "declined"
  | "closed";

export type SsoUser = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
};

export type CourseLine = {
  crn: string;
  courseCode: string;
  courseTitle: string;
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
  createdAt: string;
  updatedAt: string;
};

export type AdminPatch = {
  status?: SubmissionStatus;
  adminComment?: string;
};
