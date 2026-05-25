import { ageInBusinessDays, SLA_BUSINESS_DAYS, slaState } from "./dashboard";
import { sendSlaEscalationEmail, type EmailOutcome } from "./email";
import { appendSubmissionAuditEvent, listAllSubmissions } from "./repository";
import type { AuditEvent, SsoUser, SubmissionRecord } from "./types";

export type SlaEscalationTarget = {
  submission: SubmissionRecord;
  target: "reviewer" | "registry_final_review" | "registry_triage";
  recipient?: string;
  ageBusinessDays: number;
  auditAction: string;
};

export type SlaEscalationResult = {
  scanned: number;
  overdue: number;
  reviewerReminders: number;
  registryReminders: number;
  skipped: number;
  failed: number;
  loggedOrSent: number;
  dryRun: boolean;
  targets: Array<{
    submissionId: string;
    target: SlaEscalationTarget["target"];
    recipient?: string;
    status: SubmissionRecord["status"];
    ageBusinessDays: number;
  }>;
};

const systemActor: SsoUser = {
  studentId: "system",
  firstName: "System",
  lastName: "Scheduler",
  email: "system@costaatt.local",
  roles: ["system_admin"]
};

export async function runSlaEscalations({
  dryRun = false,
  now = new Date(),
  ipAddress,
  actor = systemActor
}: {
  dryRun?: boolean;
  now?: Date;
  ipAddress?: string;
  actor?: SsoUser;
} = {}): Promise<SlaEscalationResult> {
  const submissions = await listAllSubmissions();
  const targets = selectSlaEscalationTargets(submissions, now);
  const result: SlaEscalationResult = {
    scanned: submissions.length,
    overdue: targets.length,
    reviewerReminders: targets.filter((target) => target.target === "reviewer").length,
    registryReminders: targets.filter((target) => target.target !== "reviewer").length,
    skipped: 0,
    failed: 0,
    loggedOrSent: 0,
    dryRun,
    targets: targets.map((target) => ({
      submissionId: target.submission.id,
      target: target.target,
      recipient: target.recipient,
      status: target.submission.status,
      ageBusinessDays: target.ageBusinessDays
    }))
  };

  if (dryRun) return result;

  for (const target of targets) {
    const outcome = await sendSlaEscalationEmail(target.submission, target.target);
    if (outcome.outcome === "skipped") result.skipped += 1;
    if (outcome.outcome === "failed") result.failed += 1;
    if (outcome.outcome === "logged" || outcome.outcome === "sent") result.loggedOrSent += 1;
    if (outcome.outcome === "logged" || outcome.outcome === "sent") {
      await appendSubmissionAuditEvent(target.submission.id, actor, target.auditAction, ipAddress, {
        recipient: target.recipient,
        ageBusinessDays: target.ageBusinessDays,
        slaBusinessDays: SLA_BUSINESS_DAYS,
        emailOutcome: outcome.outcome,
        emailEvent: outcome.event
      });
    }
  }

  return result;
}

export function selectSlaEscalationTargets(submissions: SubmissionRecord[], now = new Date()): SlaEscalationTarget[] {
  const targets: SlaEscalationTarget[] = [];
  for (const submission of submissions) {
    if (slaState(submission, now) !== "overdue") continue;
    if (hasEscalationToday(submission.auditTrail || [], now)) continue;

    const ageBusinessDays = ageInBusinessDays(submission, now);
    if (submission.status === "pending_advisor_review") {
      targets.push({
        submission,
        target: "reviewer",
        recipient: submission.assignedTo?.email,
        ageBusinessDays,
        auditAction: "sla.reviewer_overdue_email"
      });
      continue;
    }

    if (submission.routingFlags?.includes("no_reviewer_mapping")) {
      targets.push({
        submission,
        target: "registry_triage",
        recipient: process.env.REGISTRY_NOTIFICATION_EMAIL || "registrar@costaatt.edu.tt",
        ageBusinessDays,
        auditAction: "sla.registry_triage_overdue_email"
      });
      continue;
    }

    if (submission.status === "pending_registry_review" || submission.status === "needs_information") {
      targets.push({
        submission,
        target: "registry_final_review",
        recipient: process.env.REGISTRY_NOTIFICATION_EMAIL || "registrar@costaatt.edu.tt",
        ageBusinessDays,
        auditAction: "sla.registry_overdue_email"
      });
    }
  }
  return targets;
}

export function hasMatchingEscalationSecret(authorizationHeader: string | null | undefined) {
  const expected = process.env.SLA_ESCALATION_SECRET;
  if (!expected) return false;
  const token = (authorizationHeader || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  return token === expected;
}

function hasEscalationToday(events: AuditEvent[], now: Date) {
  const today = dateKey(now);
  return events.some((event) => event.action.startsWith("sla.") && dateKey(event.at) === today);
}

function dateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}
