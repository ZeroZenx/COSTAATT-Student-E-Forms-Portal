import crypto from "crypto";
import { formDefinitions } from "./forms";
import { lookupCourseByCrnOrCode, lookupCourseReferences } from "./reference-data";
import type {
  AuditEvent,
  CourseLine,
  FormType,
  RoutingFlag,
  SsoUser,
  SubmissionPayload,
  SubmissionRecord,
  SubmissionStatus,
  WorkflowEvent
} from "./types";

export function enrichCourseLine(course: CourseLine): CourseLine {
  const match = lookupCourseByCrnOrCode(course.crn || course.courseCode) ||
    lookupCourseReferences("courseTitle", course.courseTitle)[0];
  if (!match) {
    return {
      ...course,
      noLecturerAssigned: true
    };
  }

  return {
    ...course,
    crn: course.crn || match.crn || "",
    courseCode: course.courseCode || match.courseCode,
    courseTitle: course.courseTitle || match.courseTitle || match.courseCode,
    advisorName: match.advisorName,
    advisorEmail: match.advisorEmail,
    lecturerName: match.lecturerName || match.advisorName,
    lecturerEmail: match.lecturerEmail || match.advisorEmail,
    campus: match.campus || "Not assigned",
    section: match.section || "Not assigned",
    noLecturerAssigned: !match.lecturerName && !match.advisorName
  };
}

export function enrichSubmissionPayload(payload: SubmissionPayload): SubmissionPayload {
  const courses = payload.courses.map(enrichCourseLine);
  const firstMappedCourse = courses.find((course) => course.advisorName || course.lecturerName);
  return {
    ...payload,
    advisorName: payload.advisorName || firstMappedCourse?.advisorName || firstMappedCourse?.lecturerName || "",
    courses
  };
}

export function initialWorkflowStatus(formType: FormType, payload: SubmissionPayload): SubmissionStatus {
  const hasMissingAssignment = payload.courses.some((course) => course.noLecturerAssigned);
  if (hasMissingAssignment) return "pending_registry_review";
  if (formDefinitions[formType]) return "pending_advisor_review";
  return "submitted";
}

export function assignmentForPayload(payload: SubmissionPayload) {
  const course = payload.courses.find((item) => item.lecturerEmail || item.advisorEmail);
  if (!course) return undefined;
  return {
    name: course.lecturerName || course.advisorName || payload.advisorName,
    email: course.lecturerEmail || course.advisorEmail || "",
    role: course.lecturerEmail ? "lecturer" as const : "advisor" as const
  };
}

export function routingFlagsForPayload(payload: SubmissionPayload): RoutingFlag[] {
  return payload.courses.some((course) => course.noLecturerAssigned) ? ["no_reviewer_mapping"] : [];
}

export function isAssignedReviewer(submission: SubmissionRecord, user: SsoUser) {
  return Boolean(submission.assignedTo?.email.toLowerCase() === user.email.toLowerCase());
}

export function isRegistryReady(submission: SubmissionRecord) {
  return (
    submission.status === "pending_registry_review" ||
    submission.status === "registry_approved" ||
    submission.status === "registry_declined" ||
    submission.status === "needs_information" ||
    submission.status === "closed" ||
    Boolean(submission.routingFlags?.includes("no_reviewer_mapping"))
  );
}

export function statusForReviewerAction(action: "approve" | "decline" | "needs_information"): SubmissionStatus {
  if (action === "approve") return "pending_registry_review";
  if (action === "decline") return "advisor_declined";
  return "needs_information";
}

export function decisionForReviewerAction(action: "approve" | "decline" | "needs_information") {
  if (action === "approve") return "approved" as const;
  if (action === "decline") return "declined" as const;
  return "needs_information" as const;
}

export function registryDecisionForStatus(status: SubmissionStatus) {
  if (status === "registry_approved") return "approved" as const;
  if (status === "registry_declined") return "declined" as const;
  if (status === "needs_information") return "needs_information" as const;
  if (status === "closed") return "closed" as const;
  return undefined;
}

export function workflowEvent(
  actor: SsoUser,
  action: string,
  fromStatus?: SubmissionStatus,
  toStatus?: SubmissionStatus,
  comment?: string
): WorkflowEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actorId: actor.studentId,
    actorName: `${actor.firstName} ${actor.lastName}`,
    action,
    fromStatus,
    toStatus,
    comment: sanitizeText(comment)
  };
}

export function auditEvent(
  actor: SsoUser,
  action: string,
  targetType: string,
  targetId: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actorId: actor.studentId,
    actorName: `${actor.firstName} ${actor.lastName}`,
    action,
    targetType,
    targetId,
    ipAddress,
    metadata
  };
}

export function sanitizeText(value?: string) {
  return value?.replace(/[<>]/g, "").trim();
}
