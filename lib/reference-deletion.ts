import crypto from "crypto";
import type { PoolClient } from "pg";
import { hasDatabase, query, withReferenceDataWriteTransaction, withTransaction } from "./db";
import { canDeleteAllReferences, canDeleteReference, canDeleteUnreferencedReferences, canDeactivateAllReferences, canPreviewReferenceOperation, deleteAllDecision as policyDeleteAllDecision } from "./reference-deletion-policy";
import type { SsoUser } from "./types";

export type ReferenceDeletionKind = "course" | "crn" | "lecturer";
export type ReferenceDeletionOperation = "delete" | "delete_unreferenced" | "deactivate";
export type ReferenceDeletionScope = "single" | "all";
export type DeleteRowClassification = "safe" | "blocked";
export type DeleteRowResult = "pending" | "deleted" | "deactivated" | "blocked" | "failed" | "stale";

export type DependencyCounts = {
  courseAssignments: number;
  crnAssignments: number;
  activeRequests: number;
  historicalSubmissions: number;
  reviewerAssignments: number;
  programmeMappings: number;
  workflowAssignments: number;
  auditRecords: number;
  emailRoutingRecords: number;
};

export type ReferenceDeletionRow = {
  id: string;
  operationId: string;
  rowNumber: number;
  kind: ReferenceDeletionKind;
  recordId: string;
  naturalKey: string;
  safeSnapshot: Record<string, unknown>;
  dependencyCounts: DependencyCounts;
  blockReasons: string[];
  classification: DeleteRowClassification;
  snapshotHash: string;
  snapshotUpdatedAt?: string;
  result: DeleteRowResult;
  reason?: string;
};

export type ReferenceDeletionPreview = {
  id: string;
  kind: ReferenceDeletionKind;
  scope: ReferenceDeletionScope;
  operationType: ReferenceDeletionOperation;
  status: "preview_ready" | "blocked" | "completed" | "stale" | "failed" | "expired";
  actorIdentity: string;
  actorEmail: string;
  requestedCount: number;
  safeCount: number;
  blockedCount: number;
  affectedCount: number;
  failedCount: number;
  previewHash: string;
  expiresAt: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  totalRows: number;
  page: number;
  pageSize: number;
  filter: "all" | DeleteRowClassification;
  search: string;
  rows: ReferenceDeletionRow[];
};

export type ReferenceDeletionApplyResult = {
  operationId: string;
  kind: ReferenceDeletionKind;
  operationType: ReferenceDeletionOperation;
  status: "completed" | "blocked" | "stale" | "expired" | "failed";
  requestedCount: number;
  safeCount: number;
  blockedCount: number;
  affectedCount: number;
  deletedCount: number;
  deactivatedCount: number;
  failedCount: number;
  message?: string;
};

type RawReferenceRow = {
  id: string;
  kind: ReferenceDeletionKind | "course" | "advisor" | "programme_mapping";
  data: Record<string, unknown>;
  active: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type SubmissionDependencyRow = {
  id: string;
  status: string;
  payload: unknown;
  assigned_to: unknown;
};

type WorkflowAssignmentDependencyRow = {
  submission_id: string;
  assigned_to_json: unknown;
};

type AuditDependencyRow = {
  id: string;
  target_id: string;
  actor_json: unknown;
  metadata_json: unknown;
};

type DependencyState = {
  references: RawReferenceRow[];
  submissions: SubmissionDependencyRow[];
  workflowAssignments: WorkflowAssignmentDependencyRow[];
  auditLogs: AuditDependencyRow[];
};

type QueryExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

const PREVIEW_TTL_MS = 10 * 60 * 1000;
const ACTIVE_SUBMISSION_STATUSES = new Set([
  "submitted",
  "pending_advisor_review",
  "advisor_approved",
  "in_review",
  "needs_information",
  "pending_registry_review"
]);

const TERMINAL_OPERATION_STATUSES = new Set(["completed", "stale", "expired", "failed"]);

export class ReferenceDeletionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ReferenceDeletionError";
    this.status = status;
  }
}

export function resolveSingleDeletionRecordId(storedRecordId?: string, expectedRecordId?: string) {
  if (storedRecordId && expectedRecordId && storedRecordId.toLowerCase() !== expectedRecordId.toLowerCase()) {
    throw new ReferenceDeletionError("The deletion preview does not match the requested record.", 409);
  }
  return storedRecordId || expectedRecordId;
}

export function publicReferenceDeletionError(error: unknown, fallback = "Reference deletion could not be completed.") {
  if (error instanceof ReferenceDeletionError) return error.message;
  if (!(error instanceof Error)) return fallback;
  if (/^(A valid|Delete|Deactivate|Reference deletion|The deletion|This deletion|The requested|The supplied|This operation|Only|A preview|Confirmation|Permanent|Lecturer|CRN|Dependency)/i.test(error.message)) return error.message;
  return fallback;
}

export function emptyDependencyCounts(): DependencyCounts {
  return {
    courseAssignments: 0,
    crnAssignments: 0,
    activeRequests: 0,
    historicalSubmissions: 0,
    reviewerAssignments: 0,
    programmeMappings: 0,
    workflowAssignments: 0,
    auditRecords: 0,
    emailRoutingRecords: 0
  };
}

export function isActiveSubmissionStatus(status: string) {
  return ACTIVE_SUBMISSION_STATUSES.has(status);
}

export function decisionForDependencies(
  kind: ReferenceDeletionKind,
  operationType: ReferenceDeletionOperation,
  counts: DependencyCounts
) {
  const reasons: string[] = [];

  if (operationType === "deactivate") {
    if (kind === "lecturer") {
      if (counts.courseAssignments > 0) reasons.push(`Referenced by ${counts.courseAssignments} active Course record${counts.courseAssignments === 1 ? "" : "s"}.`);
      if (counts.crnAssignments > 0) reasons.push(`Referenced by ${counts.crnAssignments} active CRN record${counts.crnAssignments === 1 ? "" : "s"}.`);
    }
    return { classification: reasons.length ? "blocked" as const : "safe" as const, reasons };
  }

  if (counts.courseAssignments > 0) reasons.push(`Referenced by ${counts.courseAssignments} Course record${counts.courseAssignments === 1 ? "" : "s"}.`);
  if (counts.crnAssignments > 0) reasons.push(`Referenced by ${counts.crnAssignments} CRN record${counts.crnAssignments === 1 ? "" : "s"}.`);
  if (counts.activeRequests > 0) reasons.push(`Referenced by ${counts.activeRequests} active request${counts.activeRequests === 1 ? "" : "s"}.`);
  if (counts.historicalSubmissions > 0) reasons.push(`Referenced by ${counts.historicalSubmissions} historical submission${counts.historicalSubmissions === 1 ? "" : "s"}.`);
  if (counts.reviewerAssignments > 0) reasons.push(`Referenced by ${counts.reviewerAssignments} reviewer assignment${counts.reviewerAssignments === 1 ? "" : "s"}.`);
  if (counts.programmeMappings > 0) reasons.push(`Referenced by ${counts.programmeMappings} programme mapping${counts.programmeMappings === 1 ? "" : "s"}.`);
  if (counts.workflowAssignments > 0) reasons.push(`Referenced by ${counts.workflowAssignments} workflow assignment${counts.workflowAssignments === 1 ? "" : "s"}.`);
  if (counts.auditRecords > 0) reasons.push(`Referenced by ${counts.auditRecords} audit record${counts.auditRecords === 1 ? "" : "s"}.`);
  if (counts.emailRoutingRecords > 0) reasons.push(`Referenced by ${counts.emailRoutingRecords} routing or email record${counts.emailRoutingRecords === 1 ? "" : "s"}.`);

  return { classification: reasons.length ? "blocked" as const : "safe" as const, reasons };
}

export function expectedConfirmation(kind: ReferenceDeletionKind, scope: ReferenceDeletionScope, operationType: ReferenceDeletionOperation) {
  if (scope === "all") {
    const label = kind === "course" ? "COURSES" : kind === "crn" ? "CRNS" : "LECTURERS";
    if (operationType === "delete_unreferenced") return `DELETE UNREFERENCED ${label}`;
    return operationType === "delete" ? `DELETE ${label}` : `DEACTIVATE ${label}`;
  }
  return operationType === "delete" ? "DELETE RECORD" : "DEACTIVATE RECORD";
}

export async function createReferenceDeletionPreview(input: {
  kind: ReferenceDeletionKind;
  scope: ReferenceDeletionScope;
  operationType: ReferenceDeletionOperation;
  recordId?: string;
  actor: SsoUser;
}) {
  assertPreviewAuthorization(input.actor, input.kind, input.operationType, input.scope);
  requireDatabase();

  const state = await loadDependencyState({ query: (sql, params) => query(sql, params) });
  const rawTargets = selectTargets(state.references, input.kind, input.scope, input.recordId, input.operationType);
  if (rawTargets.length === 0) throw new ReferenceDeletionError("The requested reference record was not found.", 404);
  const rows = buildDeletionRows(input.kind, input.operationType, rawTargets, state);
  const operationId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PREVIEW_TTL_MS);
  const previewHash = deletionPreviewHash(input.kind, input.scope, input.operationType, rows);
  const safeCount = rows.filter((row) => row.classification === "safe").length;
  const blockedCount = rows.length - safeCount;
  const allDecision = policyDeleteAllDecision(safeCount, blockedCount);
  const status = input.operationType === "delete"
    ? (allDecision.status === "blocked" ? "blocked" : "preview_ready")
    : (safeCount > 0 ? "preview_ready" : "blocked");

  await withTransaction(async (client) => {
    await client.query(
      `insert into reference_delete_operations
         (id, kind, scope, operation_type, actor_identity, actor_email, actor_json, status,
          requested_count, safe_count, blocked_count, deleted_count, failed_count, preview_hash,
          expires_at, created_at, previewed_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, 0, 0, $12, $13, $14, $14, $14)`,
      [
        operationId,
        input.kind,
        input.scope,
        input.operationType,
        actorIdentity(input.actor),
        input.actor.email.toLowerCase(),
        JSON.stringify(safeActor(input.actor)),
        status,
        rows.length,
        safeCount,
        blockedCount,
        previewHash,
        expiresAt.toISOString(),
        now.toISOString()
      ]
    );
    for (const row of rows) {
      await insertDeletionRow(client, operationId, row);
    }
  });

  return getReferenceDeletionPreview(operationId);
}

export async function getReferenceDeletionPreview(operationId: string, options: {
  page?: number;
  pageSize?: number;
  filter?: "all" | DeleteRowClassification;
  search?: string;
} = {}): Promise<ReferenceDeletionPreview> {
  requireDatabase();
  const id = cleanId(operationId);
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize || 25)));
  const filter = options.filter || "all";
  const search = String(options.search || "").trim();
  const operation = await query<Record<string, unknown>>(
    `select id, kind, scope, operation_type, actor_identity, actor_email, status,
            requested_count, safe_count, blocked_count, deleted_count, failed_count,
            preview_hash, expires_at, created_at, confirmed_at, completed_at, error_message
     from reference_delete_operations
     where id = $1`,
    [id]
  );
  const row = operation.rows[0];
  if (!row) throw new ReferenceDeletionError("The deletion preview was not found.", 404);

  const params: unknown[] = [id];
  const filters = ["operation_id = $1"];
  if (filter !== "all") {
    params.push(filter);
    filters.push(`classification = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    filters.push(`(natural_key ilike $${params.length} or block_reasons::text ilike $${params.length} or reason ilike $${params.length})`);
  }
  const where = filters.join(" and ");
  const count = await query<{ count: string }>(`select count(*)::text as count from reference_delete_rows where ${where}`, params);
  const offset = (page - 1) * pageSize;
  const rows = await query<Record<string, unknown>>(
    `select id, operation_id, row_number, kind, record_id, natural_key, safe_snapshot,
            dependency_counts, block_reasons, classification, snapshot_hash,
            snapshot_updated_at, result, reason
     from reference_delete_rows
     where ${where}
     order by row_number
     limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  return {
    id: String(row.id),
    kind: row.kind as ReferenceDeletionKind,
    scope: row.scope as ReferenceDeletionScope,
    operationType: row.operation_type as ReferenceDeletionOperation,
    status: row.status as ReferenceDeletionPreview["status"],
    actorIdentity: String(row.actor_identity),
    actorEmail: String(row.actor_email),
    requestedCount: Number(row.requested_count || 0),
    safeCount: Number(row.safe_count || 0),
    blockedCount: Number(row.blocked_count || 0),
    affectedCount: row.operation_type === "delete" ? Number(row.safe_count || 0) : Number(row.safe_count || 0),
    failedCount: Number(row.failed_count || 0),
    previewHash: String(row.preview_hash),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    confirmedAt: row.confirmed_at ? new Date(String(row.confirmed_at)).toISOString() : undefined,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : undefined,
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    totalRows: Number(count.rows[0]?.count || 0),
    page,
    pageSize,
    filter,
    search,
    rows: rows.rows.map(deletionRowFromDb)
  };
}

export async function confirmReferenceDeletion(input: {
  operationId: string;
  actor: SsoUser;
  confirmation: string;
  acknowledged: boolean;
  expectedRecordId?: string;
}) {
  requireDatabase();
  const id = cleanId(input.operationId);
  if (!input.acknowledged) throw new ReferenceDeletionError("Explicit confirmation is required.");

  return withReferenceDataWriteTransaction(async (client) => {
    const operationResult = await client.query<Record<string, unknown>>(
      `select id, kind, scope, operation_type, actor_identity, actor_email, actor_json, status,
              requested_count, safe_count, blocked_count, deleted_count, failed_count,
              preview_hash, expires_at
       from reference_delete_operations
       where id = $1
       for update`,
      [id]
    );
    const operation = operationResult.rows[0];
    if (!operation) throw new ReferenceDeletionError("The deletion preview was not found.", 404);
    const kind = operation.kind as ReferenceDeletionKind;
    const scope = operation.scope as ReferenceDeletionScope;
    const operationType = operation.operation_type as ReferenceDeletionOperation;
    assertPreviewAuthorization(input.actor, kind, operationType, scope);
    let storedRecordId: string | undefined;
    if (scope === "single") {
      const storedRows = await client.query<{ record_id: string }>("select record_id from reference_delete_rows where operation_id = $1", [id]);
      storedRecordId = storedRows.rows[0]?.record_id;
      if (!storedRecordId) throw new ReferenceDeletionError("The deletion preview does not contain a target record.", 409);
      resolveSingleDeletionRecordId(storedRecordId, input.expectedRecordId);
    }
    if (TERMINAL_OPERATION_STATUSES.has(String(operation.status))) throw new ReferenceDeletionError("This deletion preview is no longer available.", 409);
    if (new Date(String(operation.expires_at)).getTime() < Date.now()) {
      await markOperationExpired(client, id);
      return applyResultFromOperation(operation, "expired", "The deletion preview has expired. Generate a new preview.");
    }
    const expectedPhrase = expectedConfirmation(kind, scope, operationType);
    if (input.confirmation !== expectedPhrase) throw new ReferenceDeletionError(`Type ${expectedPhrase} to confirm this operation.`);

    const state = await loadDependencyState(client);
    const targetRecordId = scope === "single" ? resolveSingleDeletionRecordId(storedRecordId, input.expectedRecordId) : undefined;
    const targets = selectTargets(state.references, kind, scope, targetRecordId, operationType);
    if (targets.length === 0) {
      await markOperationStale(client, id, "The target record no longer exists.");
      return applyResultFromOperation(operation, "stale", "The deletion preview is stale. Generate a new preview.");
    }
    const freshRows = buildDeletionRows(kind, operationType, targets, state);
    const freshHash = deletionPreviewHash(kind, scope, operationType, freshRows);
    if (freshHash !== String(operation.preview_hash)) {
      await markOperationStale(client, id, "Reference data or dependencies changed after preview.");
      return applyResultFromOperation(operation, "stale", "The deletion preview is stale. Generate a new preview.");
    }

    const safeRows = freshRows.filter((row) => row.classification === "safe");
    const blockedCount = freshRows.length - safeRows.length;
    if (operationType === "delete" && blockedCount > 0) {
      await markOperationBlocked(client, id, freshRows);
      return applyResultFromOperation(operation, "blocked", "Permanent deletion is blocked because at least one target has dependencies.");
    }
    if (safeRows.length === 0) {
      await markOperationBlocked(client, id, freshRows);
      return applyResultFromOperation(operation, "blocked", "No target records are safe for this operation.");
    }

    const now = new Date().toISOString();
    let deletedCount = 0;
    let deactivatedCount = 0;
    if (operationType !== "deactivate") {
      for (const row of safeRows) {
        await writeReferenceAudit(client, input.actor, "reference_record.deleted", row, id, now);
      }
      const deleted = await client.query<{ id: string }>(
        `delete from reference_records
         where kind = $1 and id = any($2::uuid[])
         returning id`,
        [kind, safeRows.map((row) => row.recordId)]
      );
      if (deleted.rows.length !== safeRows.length) throw new ReferenceDeletionError("The reference-data delete did not affect the expected records.", 409);
      deletedCount = deleted.rows.length;
      await client.query(
        `update reference_delete_rows
         set result = 'deleted', updated_at = $2
         where operation_id = $1 and classification = 'safe'`,
        [id, now]
      );
    } else {
      const changed = await client.query<{ id: string }>(
        `update reference_records
         set active = false, updated_at = $3
         where kind = $1 and id = any($2::uuid[]) and active = true
         returning id`,
        [kind, safeRows.map((row) => row.recordId), now]
      );
      if (changed.rows.length !== safeRows.length) throw new ReferenceDeletionError("The reference-data deactivation did not affect the expected records.", 409);
      for (const row of safeRows) {
        await writeReferenceAudit(client, input.actor, "reference_record.deactivated", row, id, now);
      }
      deactivatedCount = changed.rows.length;
      await client.query(
        `update reference_delete_rows
         set result = 'deactivated', updated_at = $2
         where operation_id = $1 and classification = 'safe'`,
        [id, now]
      );
    }
    if (blockedCount > 0) {
      await client.query(
        `update reference_delete_rows
         set result = 'blocked', reason = coalesce(reason, 'Dependency protection blocked this row.'), updated_at = $2
         where operation_id = $1 and classification = 'blocked'`,
        [id, now]
      );
    }
    const affectedCount = deletedCount + deactivatedCount;
    await client.query(
      `update reference_delete_operations
       set status = 'completed', confirmed_at = $2, completed_at = $2, updated_at = $2,
           deleted_count = $3, failed_count = 0, error_message = null
       where id = $1`,
      [id, now, deletedCount]
    );
    await client.query(
      `insert into custom_audit_logs
         (id, actor_json, action, target_type, target_id, metadata_json, created_at)
       values ($1, $2::jsonb, $3, 'reference_delete_operation', $4, $5::jsonb, $6)`,
      [
        crypto.randomUUID(),
        JSON.stringify(safeActor(input.actor)),
          operationType === "deactivate" ? "reference_deactivate_operation.completed" : "reference_delete_operation.completed",
        id,
        JSON.stringify({
          kind,
          operationType,
          requestedCount: freshRows.length,
          safeCount: safeRows.length,
          blockedCount,
          deletedCount,
          deactivatedCount,
          failedCount: 0
        }),
        now
      ]
    );
    return {
      operationId: id,
      kind,
      operationType,
      status: "completed" as const,
      requestedCount: freshRows.length,
      safeCount: safeRows.length,
      blockedCount,
      affectedCount,
      deletedCount,
      deactivatedCount,
      failedCount: 0
    };
  });
}

function assertPreviewAuthorization(actor: SsoUser, kind: ReferenceDeletionKind, operationType: ReferenceDeletionOperation, scope: ReferenceDeletionScope) {
  if (!canPreviewReferenceOperation(actor)) throw new ReferenceDeletionError("Registry administrator access is required.", 403);
  if (kind === "course" && operationType === "deactivate" && scope === "all") {
    throw new ReferenceDeletionError("Course bulk deactivation is not enabled.", 400);
  }
  if (operationType === "delete" && scope === "all" && !canDeleteAllReferences(actor)) throw new ReferenceDeletionError("System administrator access is required for Delete All.", 403);
  if (operationType === "delete_unreferenced" && (scope !== "all" || !canDeleteUnreferencedReferences(actor))) throw new ReferenceDeletionError("System administrator access is required for Delete Unreferenced records.", 403);
  if (operationType === "delete" && scope === "single" && !canDeleteReference(actor)) throw new ReferenceDeletionError("Registry administrator access is required for permanent deletion.", 403);
  if (operationType === "deactivate" && scope === "all" && !canDeactivateAllReferences(actor)) throw new ReferenceDeletionError("Registry administrator access is required for Deactivate All.", 403);
}

function requireDatabase() {
  if (!hasDatabase()) throw new ReferenceDeletionError("Reference deletion requires PostgreSQL.", 503);
}

function selectTargets(records: RawReferenceRow[], kind: ReferenceDeletionKind, scope: ReferenceDeletionScope, recordId?: string, operationType: ReferenceDeletionOperation = "delete") {
  const matching = records.filter((record) => record.kind === kind && (operationType !== "deactivate" || record.active));
  if (scope === "all") return matching.sort((left, right) => naturalKey(left).localeCompare(naturalKey(right)));
  return matching.filter((record) => record.id.toLowerCase() === String(recordId || "").toLowerCase());
}

function buildDeletionRows(kind: ReferenceDeletionKind, operationType: ReferenceDeletionOperation, targets: RawReferenceRow[], state: DependencyState) {
  return targets.map((target, index) => {
    const counts = dependenciesFor(target, state);
    const decision = decisionForDependencies(kind, operationType, counts);
    const snapshot = safeSnapshot(target);
    return {
      id: crypto.randomUUID(),
      operationId: "",
      rowNumber: index + 1,
      kind,
      recordId: target.id,
      naturalKey: naturalKey(target),
      safeSnapshot: snapshot,
      dependencyCounts: counts,
      blockReasons: decision.reasons,
      classification: decision.classification,
      snapshotHash: snapshotHash(snapshot),
      snapshotUpdatedAt: new Date(target.updated_at).toISOString(),
      result: "pending" as const
    } satisfies Omit<ReferenceDeletionRow, "operationId"> & { operationId: string };
  });
}

function dependenciesFor(target: RawReferenceRow, state: DependencyState): DependencyCounts {
  const counts = emptyDependencyCounts();
  const targetInfo = referenceInfo(target);
  const matchingSubmissionIds = new Set<string>();

  for (const submission of state.submissions) {
    const payload = asObject(submission.payload) || {};
    const courses = Array.isArray(payload.courses) ? payload.courses.map(asObject).filter((course): course is Record<string, any> => Boolean(course)) : [];
    const matchingCourses = courses.filter((course) => {
      if (target.kind === "crn") return sameText(course.crn, targetInfo.key) || sameText(course.courseNumber, targetInfo.key);
      if (target.kind === "course") return sameText(course.courseCode, targetInfo.key) || sameText(course.course, targetInfo.key) || sameText(course.code, targetInfo.key);
      return sameEmail(course.lecturerEmail, targetInfo.email) || sameEmail(course.reviewerEmail, targetInfo.email);
    });
    if (matchingCourses.length === 0) continue;
    matchingSubmissionIds.add(submission.id);
    counts.historicalSubmissions += 1;
    if (isActiveSubmissionStatus(submission.status)) counts.activeRequests += 1;
    const assignedTo = asObject(submission.assigned_to);
    if (assignedTo && sameEmail(assignedTo.email, targetInfo.email || "")) counts.reviewerAssignments += 1;
    if (matchingCourses.some((course) => target.kind === "course"
      ? Boolean(course.reviewerEmail || course.lecturerEmail)
      : sameEmail(course.lecturerEmail, targetInfo.email) || sameEmail(course.reviewerEmail, targetInfo.email) || (target.kind === "crn" && (course.reviewerEmail || course.lecturerEmail)))) {
      counts.emailRoutingRecords += 1;
    }
  }

  for (const workflow of state.workflowAssignments) {
    const assignedTo = asObject(workflow.assigned_to_json);
    const matchesEmail = Boolean(assignedTo && sameEmail(assignedTo.email, targetInfo.email || ""));
    if (matchesEmail || matchingSubmissionIds.has(workflow.submission_id)) counts.workflowAssignments += 1;
  }

  for (const record of state.references) {
    if (target.kind !== "course" && !record.active) continue;
    const info = referenceInfo(record);
    if (target.kind === "lecturer" && record.kind === "course" && sameEmail(info.email, targetInfo.email)) counts.courseAssignments += 1;
    if (target.kind === "lecturer" && record.kind === "crn" && sameEmail(info.email, targetInfo.email)) counts.crnAssignments += 1;
    if (target.kind === "lecturer" && record.kind === "programme_mapping" && sameEmail(info.email, targetInfo.email)) counts.programmeMappings += 1;
    if (target.kind === "course" && record.kind === "crn" && sameText(info.courseCode, targetInfo.key)) counts.crnAssignments += 1;
    if (target.kind === "course" && record.kind === "programme_mapping" && sameText(info.courseCode, targetInfo.key)) counts.programmeMappings += 1;
  }

  for (const audit of state.auditLogs) {
    const metadata = asObject(audit.metadata_json);
    const actor = asObject(audit.actor_json);
    const referencesTarget = audit.target_id === target.id ||
      sameText(metadata?.recordId, target.id) ||
      sameText(metadata?.naturalKey, targetInfo.key) ||
      sameText(metadata?.key, targetInfo.key) ||
      sameText(metadata?.courseCode, targetInfo.key) ||
      (target.kind !== "course" && (sameEmail(metadata?.email, targetInfo.email || "") || sameEmail(actor?.email, targetInfo.email || "")));
    if (referencesTarget) counts.auditRecords += 1;
  }

  return counts;
}

async function loadDependencyState(executor: QueryExecutor): Promise<DependencyState> {
  const references = await executor.query(
    `select id::text, kind, data, active, archived, created_at, updated_at
     from reference_records
     order by kind, id`
  );
  const submissions = await executor.query(
    `select id::text, status, payload, assigned_to
     from submissions`
  );
  const workflowAssignments = await loadOptionalWorkflowAssignments(executor);
  const auditLogs = await executor.query(
    `select id::text, target_id, actor_json, metadata_json
     from custom_audit_logs`
  );
  return {
    references: references.rows as RawReferenceRow[],
    submissions: submissions.rows as SubmissionDependencyRow[],
    workflowAssignments: workflowAssignments as WorkflowAssignmentDependencyRow[],
    auditLogs: auditLogs.rows as AuditDependencyRow[]
  };
}

export async function loadOptionalWorkflowAssignments(executor: QueryExecutor) {
  // A missing optional table must be detected before querying it. Catching a
  // 42P01 inside an open transaction leaves PostgreSQL in the aborted state,
  // causing every subsequent dependency/audit query to fail with 25P02.
  const table = await executor.query("select to_regclass('public.custom_workflow_assignments') as table_name");
  if (!table.rows[0]?.table_name) return [] as WorkflowAssignmentDependencyRow[];
  return (await executor.query(
    `select submission_id::text, assigned_to_json
     from custom_workflow_assignments`
  )).rows as WorkflowAssignmentDependencyRow[];
}

async function insertDeletionRow(client: PoolClient, operationId: string, row: Omit<ReferenceDeletionRow, "operationId">) {
  await client.query(
    `insert into reference_delete_rows
       (id, operation_id, row_number, kind, record_id, natural_key, safe_snapshot,
        dependency_counts, block_reasons, classification, snapshot_hash, snapshot_updated_at, result)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12, 'pending')`,
    [
      row.id,
      operationId,
      row.rowNumber,
      row.kind,
      row.recordId,
      row.naturalKey,
      JSON.stringify(row.safeSnapshot),
      JSON.stringify(row.dependencyCounts),
      JSON.stringify(row.blockReasons),
      row.classification,
      row.snapshotHash,
      row.snapshotUpdatedAt || null
    ]
  );
}

async function writeReferenceAudit(client: PoolClient, actor: SsoUser, action: string, row: Omit<ReferenceDeletionRow, "operationId">, operationId: string, timestamp: string) {
  await client.query(
    `insert into custom_audit_logs
       (id, actor_json, action, target_type, target_id, metadata_json, created_at)
     values ($1, $2::jsonb, $3, 'reference_record', $4, $5::jsonb, $6)`,
    [
      crypto.randomUUID(),
      JSON.stringify(safeActor(actor)),
      action,
      row.recordId,
      JSON.stringify({ operationId, kind: row.kind, naturalKey: row.naturalKey, safeSnapshot: row.safeSnapshot, dependencyCounts: row.dependencyCounts }),
      timestamp
    ]
  );
}

async function markOperationExpired(client: PoolClient, operationId: string) {
  await client.query("update reference_delete_operations set status = 'expired', updated_at = now(), error_message = $2 where id = $1", [operationId, "Preview expired."]);
}

async function markOperationStale(client: PoolClient, operationId: string, reason: string) {
  await client.query("update reference_delete_operations set status = 'stale', updated_at = now(), error_message = $2 where id = $1", [operationId, reason]);
  await client.query("update reference_delete_rows set result = 'stale', reason = $2, updated_at = now() where operation_id = $1", [operationId, reason]);
}

async function markOperationBlocked(client: PoolClient, operationId: string, rows: Array<{ rowNumber: number; classification: DeleteRowClassification; blockReasons: string[] }>) {
  const blocked = rows.filter((row) => row.classification === "blocked");
  await client.query("update reference_delete_operations set status = 'blocked', blocked_count = $2, updated_at = now(), error_message = $3 where id = $1", [operationId, blocked.length, "Dependency protection blocked the operation."]);
  await client.query("update reference_delete_rows set result = case when classification = 'blocked' then 'blocked' else 'pending' end, updated_at = now() where operation_id = $1", [operationId]);
}

function applyResultFromOperation(operation: Record<string, unknown>, status: "blocked" | "stale" | "expired", message: string): ReferenceDeletionApplyResult {
  return {
    operationId: String(operation.id),
    kind: operation.kind as ReferenceDeletionKind,
    operationType: operation.operation_type as ReferenceDeletionOperation,
    status,
    requestedCount: Number(operation.requested_count || 0),
    safeCount: Number(operation.safe_count || 0),
    blockedCount: Number(operation.blocked_count || 0),
    affectedCount: 0,
    deletedCount: 0,
    deactivatedCount: 0,
    failedCount: Number(operation.failed_count || 0),
    message
  };
}

function deletionRowFromDb(row: Record<string, unknown>): ReferenceDeletionRow {
  return {
    id: String(row.id),
    operationId: String(row.operation_id),
    rowNumber: Number(row.row_number),
    kind: row.kind as ReferenceDeletionKind,
    recordId: String(row.record_id),
    naturalKey: String(row.natural_key),
    safeSnapshot: asObject(row.safe_snapshot) || {},
    dependencyCounts: { ...emptyDependencyCounts(), ...(asObject(row.dependency_counts) || {}) } as DependencyCounts,
    blockReasons: Array.isArray(row.block_reasons) ? row.block_reasons.map(String) : [],
    classification: row.classification as DeleteRowClassification,
    snapshotHash: String(row.snapshot_hash),
    snapshotUpdatedAt: row.snapshot_updated_at ? new Date(String(row.snapshot_updated_at)).toISOString() : undefined,
    result: row.result as DeleteRowResult,
    reason: row.reason ? String(row.reason) : undefined
  };
}

function safeSnapshot(row: RawReferenceRow) {
  return {
    id: row.id,
    kind: row.kind,
    data: row.data,
    active: row.active,
    archived: row.archived,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  } satisfies Record<string, unknown>;
}

function referenceInfo(row: RawReferenceRow) {
  const outer = asObject(row.data) || {};
  const nested = asObject(outer.data) || {};
  const get = (...keys: string[]) => keys.map((key) => outer[key] ?? nested[key]).find((value) => value !== undefined && value !== null);
  const key = String(get("key", row.kind === "crn" ? "crn" : row.kind === "lecturer" ? "email" : "courseCode") || "").trim();
  const email = String(get("email", "reviewerEmail", "lecturerEmail", "advisorEmail") || "").trim().toLowerCase();
  return {
    key,
    email,
    courseCode: String(get("courseCode") || "").trim().toLowerCase(),
    name: String(get("label", "name", "reviewerName", "lecturerName", "advisorName") || "").trim()
  };
}

function naturalKey(row: RawReferenceRow) {
  return referenceInfo(row).key || row.id;
}

function snapshotHash(snapshot: Record<string, unknown>) {
  return crypto.createHash("sha256").update(stableStringify(snapshot)).digest("hex");
}

function deletionPreviewHash(kind: ReferenceDeletionKind, scope: ReferenceDeletionScope, operationType: ReferenceDeletionOperation, rows: Array<{ recordId: string; snapshotHash: string; classification: DeleteRowClassification; dependencyCounts: DependencyCounts; blockReasons: string[] }>) {
  return crypto.createHash("sha256").update(stableStringify({
    kind,
    scope,
    operationType,
    rows: rows.map((row) => ({
      recordId: row.recordId,
      snapshotHash: row.snapshotHash,
      classification: row.classification,
      dependencyCounts: row.dependencyCounts,
      blockReasons: row.blockReasons
    }))
  })).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function safeActor(actor: SsoUser) {
  return {
    identity: actor.studentId,
    name: `${actor.firstName} ${actor.lastName}`.trim(),
    email: actor.email.toLowerCase(),
    roles: actor.roles || []
  };
}

function actorIdentity(actor: SsoUser) {
  return actor.studentId || actor.email.toLowerCase();
}

function cleanId(value: string) {
  const trimmed = String(value || "").trim();
  if (!/^[0-9a-f-]{20,80}$/i.test(trimmed)) throw new ReferenceDeletionError("A valid deletion operation ID is required.");
  return trimmed;
}

function asObject(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function sameText(left: unknown, right: unknown) {
  return Boolean(String(left || "").trim() && String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase());
}

function sameEmail(left: unknown, right: unknown) {
  return sameText(left, right);
}
