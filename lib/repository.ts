import path from "path";
import crypto from "crypto";
import { hasDatabase, query, withReferenceDataSharedLockTransaction } from "./db";
import { readJsonFile, writeJsonFile } from "./json-store";
import type { AdminPatch, ReviewerPatch, SubmissionPayload, SubmissionRecord, SsoUser } from "./types";
import { assertActiveSubmissionReferences } from "./reference-consistency";
import {
  auditEvent,
  assignmentForPayload,
  decisionForReviewerAction,
  enrichSubmissionPayload,
  initialWorkflowStatus,
  isAssignedReviewer,
  isRegistryReady,
  registryDecisionForStatus,
  routingFlagsForPayload,
  sanitizeText,
  statusForReviewerAction,
  workflowEvent
} from "./workflow";

const localStorePath = path.join(process.cwd(), "data", "submissions.json");
const SUBMISSION_COLUMNS = "id, form_type, status, student, payload, attachment, admin_comment, internal_notes, assigned_to, workflow_history, audit_trail, routing_flags, reviewer_decision, reviewer_comment, registry_decision, registry_comment, created_at, updated_at";

async function readLocal(): Promise<SubmissionRecord[]> {
  return readJsonFile<SubmissionRecord[]>(localStorePath, []);
}

async function writeLocal(records: SubmissionRecord[]) {
  await writeJsonFile(localStorePath, records);
}

export async function createSubmission(
  user: SsoUser,
  payload: SubmissionPayload,
  attachment?: SubmissionRecord["attachment"],
  ipAddress?: string
) {
  const buildRecord = (enrichedPayload: SubmissionPayload): SubmissionRecord => {
    const now = new Date().toISOString();
    const status = initialWorkflowStatus(enrichedPayload.formType, enrichedPayload);
    const assignedTo = assignmentForPayload(enrichedPayload);
    const routingFlags = routingFlagsForPayload(enrichedPayload);
    const record: SubmissionRecord = {
      id: crypto.randomUUID(),
      formType: enrichedPayload.formType,
      status,
      student: user,
      payload: enrichedPayload,
      attachment,
      assignedTo,
      routingFlags,
      workflowHistory: [
        workflowEvent(user, "submitted", undefined, status)
      ],
      auditTrail: [],
      createdAt: now,
      updatedAt: now
    };
    record.auditTrail = [
      auditEvent(user, "submission.created", "submission", record.id, ipAddress, {
        formType: record.formType,
        assignedTo,
        routingFlags
      })
    ];
    return record;
  };

  if (hasDatabase()) {
    return withReferenceDataSharedLockTransaction(async (client) => {
      const enrichedPayload = enrichSubmissionPayload(payload);
      await assertActiveSubmissionReferences(client, enrichedPayload);
      const record = buildRecord(enrichedPayload);
      await client.query(
        `insert into submissions
          (id, form_type, status, student, payload, attachment, assigned_to, workflow_history, audit_trail, routing_flags, created_at, updated_at)
         values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12)`,
        [
          record.id,
          record.formType,
          record.status,
          JSON.stringify(record.student),
          JSON.stringify(record.payload),
          JSON.stringify(record.attachment || null),
          JSON.stringify(record.assignedTo || null),
          JSON.stringify(record.workflowHistory || []),
          JSON.stringify(record.auditTrail || []),
          JSON.stringify(record.routingFlags || []),
          record.createdAt,
          record.updatedAt
        ]
      );
      return record;
    });
  }

  const record = buildRecord(enrichSubmissionPayload(payload));
  const records = await readLocal();
  records.unshift(record);
  await writeLocal(records);
  return record;
}

export async function listStudentSubmissions(studentId: string) {
  if (hasDatabase()) {
    const result = await query(
      `select ${SUBMISSION_COLUMNS}
       from submissions
       where student->>'studentId' = $1
       order by created_at desc`,
      [studentId]
    );
    return result.rows.map(rowToRecord);
  }

  return (await readLocal()).filter((record) => record.student.studentId === studentId);
}

export async function listAllSubmissions() {
  if (hasDatabase()) {
    const result = await query(
      `select ${SUBMISSION_COLUMNS}
       from submissions
       order by created_at desc`
    );
    return result.rows.map(rowToRecord);
  }

  return readLocal();
}

export async function listRegistryQueueSubmissions() {
  const submissions = await listAllSubmissions();
  return submissions.filter(isRegistryReady);
}

export async function listAssignedSubmissions(user: SsoUser) {
  const submissions = await listAllSubmissions();
  return submissions.filter((submission) => isAssignedReviewer(submission, user));
}

export async function getSubmission(id: string) {
  if (hasDatabase()) {
    const result = await query(
      `select ${SUBMISSION_COLUMNS}
       from submissions
       where lower(id::text) = lower($1)`,
      [id]
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  return (await readLocal()).find((record) => record.id.toLowerCase() === id.toLowerCase()) || null;
}

export async function updateSubmission(id: string, patch: AdminPatch, actor?: SsoUser, ipAddress?: string) {
  const updatedAt = new Date().toISOString();
  const existing = await getSubmission(id);
  if (!existing) return null;
  const nextStatus = patch.status || existing.status;
  const registryDecision = patch.registryDecision || (patch.status ? registryDecisionForStatus(patch.status) : existing.registryDecision);
  const registryComment = sanitizeText(patch.registryComment || patch.adminComment);
  const historyEvents = patch.status && patch.status !== existing.status
    ? [workflowEvent(actor || existing.student, "registry.status_changed", existing.status, patch.status, registryComment)]
    : [];
  const nextAuditEvent = auditEvent(actor || existing.student, "submission.updated", "submission", id, ipAddress, {
    ...patch,
    actorRoles: actor?.roles || []
  });
  const history = [
    ...(existing.workflowHistory || []),
    ...historyEvents
  ];
  const auditTrail = [
    ...(existing.auditTrail || []),
    nextAuditEvent
  ];

  if (hasDatabase()) {
    const result = await query(
      `update submissions
       set status = coalesce($2, status),
           admin_comment = coalesce($3, admin_comment),
           internal_notes = coalesce($4, internal_notes),
           workflow_history = coalesce(workflow_history, '[]'::jsonb) || $5::jsonb,
           audit_trail = coalesce(audit_trail, '[]'::jsonb) || $6::jsonb,
           registry_decision = coalesce($7, registry_decision),
           registry_comment = coalesce($8, registry_comment),
           updated_at = $9
       where id = $1 and updated_at = $10
       returning ${SUBMISSION_COLUMNS}`,
      [
        id,
        nextStatus,
        sanitizeText(patch.adminComment) || null,
        sanitizeText(patch.internalNotes) || null,
        JSON.stringify(historyEvents),
        JSON.stringify([nextAuditEvent]),
        registryDecision || null,
        registryComment || null,
        updatedAt,
        existing.updatedAt
      ]
    );
    if (!result.rows[0]) throw new Error("This submission changed while you were reviewing it. Refresh and try again.");
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  const records = await readLocal();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = {
    ...records[index],
    status: nextStatus,
    adminComment: sanitizeText(patch.adminComment) || records[index].adminComment,
    internalNotes: sanitizeText(patch.internalNotes) || records[index].internalNotes,
    registryDecision: registryDecision || records[index].registryDecision,
    registryComment: registryComment || records[index].registryComment,
    workflowHistory: history,
    auditTrail,
    updatedAt
  };
  await writeLocal(records);
  return records[index];
}

export async function appendSubmissionAuditEvent(
  id: string,
  actor: SsoUser,
  action: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>
) {
  const updatedAt = new Date().toISOString();
  const existing = await getSubmission(id);
  if (!existing) return null;
  const nextAuditEvent = auditEvent(actor, action, "submission", id, ipAddress, {
    ...(metadata || {}),
    actorRoles: actor.roles || []
  });
  const auditTrail = [
    ...(existing.auditTrail || []),
    nextAuditEvent
  ];

  if (hasDatabase()) {
    const result = await query(
      `update submissions
       set audit_trail = coalesce(audit_trail, '[]'::jsonb) || $2::jsonb,
           updated_at = $3
       where id = $1
       returning ${SUBMISSION_COLUMNS}`,
      [id, JSON.stringify([nextAuditEvent]), updatedAt]
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  const records = await readLocal();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = {
    ...records[index],
    auditTrail,
    updatedAt
  };
  await writeLocal(records);
  return records[index];
}

export async function updateSubmissionByReviewer(id: string, patch: ReviewerPatch, actor: SsoUser, ipAddress?: string) {
  const updatedAt = new Date().toISOString();
  const existing = await getSubmission(id);
  if (!existing) return null;
  if (!isAssignedReviewer(existing, actor)) throw new Error("This request is not assigned to your account.");
  if (existing.status !== "pending_advisor_review") throw new Error("This request is not awaiting reviewer action.");

  const nextStatus = statusForReviewerAction(patch.action);
  const comment = sanitizeText(patch.comment);
  const reviewerDecision = decisionForReviewerAction(patch.action);
  const nextWorkflowEvent = workflowEvent(actor, `reviewer.${patch.action}`, existing.status, nextStatus, comment);
  const nextAuditEvent = auditEvent(actor, `reviewer.${patch.action}`, "submission", id, ipAddress, {
    comment,
    actorRoles: actor.roles || []
  });
  const history = [
    ...(existing.workflowHistory || []),
    nextWorkflowEvent
  ];
  const auditTrail = [
    ...(existing.auditTrail || []),
    nextAuditEvent
  ];

  if (hasDatabase()) {
    const result = await query(
      `update submissions
       set status = $2,
           reviewer_decision = $3,
           reviewer_comment = coalesce($4, reviewer_comment),
           workflow_history = coalesce(workflow_history, '[]'::jsonb) || $5::jsonb,
           audit_trail = coalesce(audit_trail, '[]'::jsonb) || $6::jsonb,
           updated_at = $7
       where id = $1 and status = 'pending_advisor_review' and updated_at = $8
       returning ${SUBMISSION_COLUMNS}`,
      [
        id,
        nextStatus,
        reviewerDecision,
        comment || null,
        JSON.stringify([nextWorkflowEvent]),
        JSON.stringify([nextAuditEvent]),
        updatedAt,
        existing.updatedAt
      ]
    );
    if (!result.rows[0]) throw new Error("This request was already updated. Refresh to see its current status.");
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  const records = await readLocal();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = {
    ...records[index],
    status: nextStatus,
    reviewerDecision,
    reviewerComment: comment || records[index].reviewerComment,
    workflowHistory: history,
    auditTrail,
    updatedAt
  };
  await writeLocal(records);
  return records[index];
}

function rowToRecord(row: Record<string, unknown>): SubmissionRecord {
  return {
    id: String(row.id),
    formType: row.form_type as SubmissionRecord["formType"],
    status: row.status as SubmissionRecord["status"],
    student: row.student as SubmissionRecord["student"],
    payload: row.payload as SubmissionRecord["payload"],
    attachment: (row.attachment || undefined) as SubmissionRecord["attachment"],
    adminComment: (row.admin_comment || undefined) as string | undefined,
    internalNotes: (row.internal_notes || undefined) as string | undefined,
    assignedTo: (row.assigned_to || undefined) as SubmissionRecord["assignedTo"],
    routingFlags: (row.routing_flags || []) as SubmissionRecord["routingFlags"],
    reviewerDecision: (row.reviewer_decision || undefined) as SubmissionRecord["reviewerDecision"],
    reviewerComment: (row.reviewer_comment || undefined) as string | undefined,
    registryDecision: (row.registry_decision || undefined) as SubmissionRecord["registryDecision"],
    registryComment: (row.registry_comment || undefined) as string | undefined,
    workflowHistory: (row.workflow_history || []) as SubmissionRecord["workflowHistory"],
    auditTrail: (row.audit_trail || []) as SubmissionRecord["auditTrail"],
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
