import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Pool } from "pg";
import { formDefinitions } from "./forms";
import { studentStatusLabel } from "./display";
import type { ReviewerPatch, StudentNotification, StudentNotificationType, SubmissionRecord } from "./types";

let pool: Pool | null = null;

function localNotificationsPath() {
  return process.env.NOTIFICATION_STORE_PATH || path.join(process.cwd(), "data", "student-notifications.json");
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function db() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function readLocal(): Promise<StudentNotification[]> {
  try {
    return JSON.parse(await readFile(localNotificationsPath(), "utf8")) as StudentNotification[];
  } catch {
    return [];
  }
}

async function writeLocal(notifications: StudentNotification[]) {
  const storePath = localNotificationsPath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(notifications, null, 2));
}

export async function createStudentNotification(input: Omit<StudentNotification, "id" | "createdAt">) {
  const notification: StudentNotification = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  if (hasDatabase()) {
    await db().query(
      `insert into student_notifications (id, student_id, submission_id, type, title, message, read_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        notification.id,
        notification.studentId,
        notification.submissionId,
        notification.type,
        notification.title,
        notification.message,
        notification.readAt || null,
        notification.createdAt
      ]
    );
  } else {
    const notifications = await readLocal();
    notifications.unshift(notification);
    await writeLocal(notifications);
  }

  return notification;
}

export async function listStudentNotifications(studentId: string) {
  if (hasDatabase()) {
    const result = await db().query(
      `select id, student_id, submission_id, type, title, message, read_at, created_at
       from student_notifications
       where student_id = $1
       order by created_at desc`,
      [studentId]
    );
    return result.rows.map(rowToNotification);
  }

  return (await readLocal())
    .filter((notification) => notification.studentId === studentId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function unreadStudentNotificationCount(studentId: string) {
  if (hasDatabase()) {
    const result = await db().query(
      `select count(*)::int as count
       from student_notifications
       where student_id = $1 and read_at is null`,
      [studentId]
    );
    return Number(result.rows[0]?.count || 0);
  }

  return (await readLocal()).filter((notification) => notification.studentId === studentId && !notification.readAt).length;
}

export async function markStudentNotificationRead(studentId: string, id: string) {
  const readAt = new Date().toISOString();
  if (hasDatabase()) {
    const result = await db().query(
      `update student_notifications
       set read_at = coalesce(read_at, $3)
       where id = $1 and student_id = $2
       returning id, student_id, submission_id, type, title, message, read_at, created_at`,
      [id, studentId, readAt]
    );
    return result.rows[0] ? rowToNotification(result.rows[0]) : null;
  }

  const notifications = await readLocal();
  const index = notifications.findIndex((notification) => notification.id === id && notification.studentId === studentId);
  if (index === -1) return null;
  notifications[index] = { ...notifications[index], readAt: notifications[index].readAt || readAt };
  await writeLocal(notifications);
  return notifications[index];
}

export async function markAllStudentNotificationsRead(studentId: string) {
  const readAt = new Date().toISOString();
  if (hasDatabase()) {
    const result = await db().query(
      `update student_notifications
       set read_at = coalesce(read_at, $2)
       where student_id = $1 and read_at is null`,
      [studentId, readAt]
    );
    return result.rowCount || 0;
  }

  const notifications = await readLocal();
  let count = 0;
  const updated = notifications.map((notification) => {
    if (notification.studentId === studentId && !notification.readAt) {
      count += 1;
      return { ...notification, readAt };
    }
    return notification;
  });
  await writeLocal(updated);
  return count;
}

export async function notifySubmissionCreated(submission: SubmissionRecord) {
  return createStudentNotification(notificationForSubmission(submission, "submission_created", "Request submitted", "Your e-form request was received."));
}

export async function notifyReviewerAction(submission: SubmissionRecord, action: ReviewerPatch["action"]) {
  const typeByAction: Record<ReviewerPatch["action"], StudentNotificationType> = {
    approve: "reviewer_approved",
    decline: "reviewer_declined",
    needs_information: "reviewer_needs_information"
  };
  const messageByAction: Record<ReviewerPatch["action"], string> = {
    approve: "Your reviewer approved this request. It is now with Registry for final review.",
    decline: "Your reviewer declined this request.",
    needs_information: "Your reviewer requested more information for this request."
  };
  return createStudentNotification(notificationForSubmission(
    submission,
    typeByAction[action],
    "Reviewer update",
    messageByAction[action]
  ));
}

export async function notifyRegistryStatusChange(submission: SubmissionRecord) {
  const typeByStatus: Partial<Record<SubmissionRecord["status"], StudentNotificationType>> = {
    registry_approved: "registry_approved",
    registry_declined: "registry_declined",
    needs_information: "registry_needs_information",
    closed: "registry_closed"
  };
  const type = typeByStatus[submission.status] || "registry_status_changed";
  return createStudentNotification(notificationForSubmission(
    submission,
    type,
    "Registry update",
    `Your request status changed to ${studentStatusLabel(submission.status)}.`
  ));
}

function notificationForSubmission(
  submission: SubmissionRecord,
  type: StudentNotificationType,
  title: string,
  message: string
): Omit<StudentNotification, "id" | "createdAt"> {
  return {
    studentId: submission.student.studentId,
    submissionId: submission.id,
    type,
    title: `${title}: ${formDefinitions[submission.formType].title}`,
    message,
    readAt: undefined
  };
}

function rowToNotification(row: Record<string, unknown>): StudentNotification {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    submissionId: String(row.submission_id),
    type: row.type as StudentNotification["type"],
    title: String(row.title),
    message: String(row.message),
    readAt: row.read_at ? new Date(row.read_at as string).toISOString() : undefined,
    createdAt: new Date(row.created_at as string).toISOString()
  };
}
