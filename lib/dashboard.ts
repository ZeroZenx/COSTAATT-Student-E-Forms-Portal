import { formDefinitions } from "./forms";
import { latestVisibleComment, reviewerDisplay, statusLabel } from "./display";
import type { FormType, SubmissionRecord, SubmissionStatus } from "./types";

export const SLA_BUSINESS_DAYS = 3;

export type SlaState = "on_track" | "due_soon" | "overdue" | "final";
export type AgingBucket = "0-1 days" | "2-3 days" | "4-5 days" | "6+ days";

const finalStatuses = new Set<SubmissionStatus>([
  "registry_approved",
  "registry_declined",
  "closed",
  "approved",
  "declined"
]);

const actionableStatuses = new Set<SubmissionStatus>([
  "pending_advisor_review",
  "pending_registry_review",
  "needs_information"
]);

export function isFinalStatus(status: SubmissionStatus) {
  return finalStatuses.has(status);
}

export function isActionableStatus(status: SubmissionStatus) {
  return actionableStatuses.has(status);
}

export function workflowAgeStart(submission: SubmissionRecord) {
  const transition = [...(submission.workflowHistory || [])]
    .reverse()
    .find((event) => event.toStatus === submission.status);
  return transition?.at || submission.createdAt;
}

export function businessDaysBetween(start: string | Date, end: string | Date = new Date()) {
  const startDate = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  if (endDate <= startDate) return 0;

  let days = 0;
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= endDate) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function ageInBusinessDays(submission: SubmissionRecord, now: Date = new Date()) {
  return businessDaysBetween(workflowAgeStart(submission), now);
}

export function agingBucket(days: number): AgingBucket {
  if (days <= 1) return "0-1 days";
  if (days <= 3) return "2-3 days";
  if (days <= 5) return "4-5 days";
  return "6+ days";
}

export function slaState(submission: SubmissionRecord, now: Date = new Date()): SlaState {
  if (isFinalStatus(submission.status)) return "final";
  if (!isActionableStatus(submission.status)) return "on_track";
  const days = ageInBusinessDays(submission, now);
  if (days > SLA_BUSINESS_DAYS) return "overdue";
  if (days === SLA_BUSINESS_DAYS) return "due_soon";
  return "on_track";
}

export function slaLabel(state: SlaState) {
  if (state === "overdue") return "Overdue";
  if (state === "due_soon") return "Due soon";
  if (state === "final") return "Final";
  return "On track";
}

export function submissionOperationalSummary(submission: SubmissionRecord, now: Date = new Date()) {
  const age = ageInBusinessDays(submission, now);
  const state = slaState(submission, now);
  return {
    age,
    bucket: agingBucket(age),
    state,
    stateLabel: slaLabel(state)
  };
}

export function registryDashboardSummary(submissions: SubmissionRecord[], now: Date = new Date()) {
  const byStatus = countBy(submissions, (submission) => submission.status);
  const byForm = countBy(submissions, (submission) => submission.formType);
  const byAging = countBy(submissions, (submission) => submissionOperationalSummary(submission, now).bucket);
  const overdue = submissions.filter((submission) => slaState(submission, now) === "overdue");
  const needsAction = submissions.filter((submission) => isActionableStatus(submission.status));

  return {
    total: submissions.length,
    pendingReviewer: byStatus.pending_advisor_review || 0,
    pendingRegistry: byStatus.pending_registry_review || 0,
    needsInformation: byStatus.needs_information || 0,
    approved: (byStatus.registry_approved || 0) + (byStatus.approved || 0),
    declined: (byStatus.registry_declined || 0) + (byStatus.declined || 0),
    closed: byStatus.closed || 0,
    noReviewerMapping: submissions.filter((submission) => submission.routingFlags?.includes("no_reviewer_mapping")).length,
    overdue: overdue.length,
    byForm,
    byAging,
    overdueRequests: sortOldest(overdue, now),
    needsActionToday: sortOldest(needsAction, now)
  };
}

export function csvOperationalRows(submissions: SubmissionRecord[], now: Date = new Date()) {
  return submissions.flatMap((submission) => {
    const summary = submissionOperationalSummary(submission, now);
    const courses = submission.payload.courses.length > 0 ? submission.payload.courses : [undefined];
    return courses.map((course) => [
      submission.id,
      formDefinitions[submission.formType].title,
      statusLabel(submission.status),
      submission.student.studentId,
      `${submission.student.firstName} ${submission.student.lastName}`,
      submission.student.email,
      submission.payload.programme,
      course?.courseCode || "",
      course?.crn || "",
      course?.courseTitle || "",
      submission.assignedTo?.name || reviewerDisplay(submission),
      submission.assignedTo?.email || "",
      submission.routingFlags?.join("; ") || "",
      submission.createdAt,
      submission.updatedAt,
      summary.age,
      summary.stateLabel,
      submission.reviewerDecision || "",
      submission.registryDecision || "",
      latestVisibleComment(submission)
    ]);
  });
}

function countBy<T, K extends string>(items: T[], keyFor: (item: T) => K): Partial<Record<K, number>> {
  return items.reduce<Partial<Record<K, number>>>((counts, item) => {
    const key = keyFor(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortOldest(submissions: SubmissionRecord[], now: Date) {
  return [...submissions].sort((left, right) => ageInBusinessDays(right, now) - ageInBusinessDays(left, now));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
