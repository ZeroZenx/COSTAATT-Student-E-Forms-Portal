import crypto from "crypto";
import { formDefinitions } from "./forms";
import { lookupCourseByCrnOrCode } from "./reference-data";
import type { AuditEvent, CourseLine, FormType, SsoUser, SubmissionPayload, SubmissionStatus, WorkflowEvent } from "./types";

export function enrichCourseLine(course: CourseLine): CourseLine {
  const match = lookupCourseByCrnOrCode(course.crn || course.courseCode);
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
