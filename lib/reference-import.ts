import crypto from "crypto";
import path from "path";
import type { PoolClient } from "pg";
import type { SsoUser } from "./types";
import { hasDatabase, query, withReferenceDataWriteTransaction, withTransaction } from "./db";
import {
  inputToCsvRow,
  csvSerialize,
  escapeCsvCell,
  normalizeImportRow,
  parseCsv,
  referenceColumns,
  type ImportReferenceInput,
  type ParsedCsvRow
} from "./reference-csv";
import {
  listReferenceRecordsDirect,
  referenceRecordFromDbRow,
  type ReferenceKind,
  type ReferenceRecord
} from "./reference-admin";

export type ImportStatus = "preview_ready" | "blocked" | "confirmed" | "applying" | "completed" | "failed" | "stale" | "expired";
export type ImportRowStatus = "new" | "unchanged" | "update" | "invalid" | "conflict";
export type ImportOperation = "insert" | "update" | "skip" | "reject";

export type ImportActor = Pick<SsoUser, "studentId" | "firstName" | "lastName" | "email" | "roles">;

export type ClassifiedImportRow = {
  rowNumber: number;
  identifier: string;
  input: ImportReferenceInput | null;
  rawValues?: Record<string, string>;
  current?: ReferenceRecord;
  proposed?: ImportReferenceInput;
  status: ImportRowStatus;
  operation: ImportOperation;
  errors: string[];
  warnings: string[];
  snapshotHash?: string;
  snapshotUpdatedAt?: string;
};

export type ImportSummary = {
  id: string;
  kind: ReferenceKind;
  originalFilename: string;
  fileSha256: string;
  uploadedBy: ImportActor;
  status: ImportStatus;
  totalRows: number;
  validRows: number;
  newCount: number;
  unchangedCount: number;
  updateCount: number;
  invalidCount: number;
  conflictCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  rejectedCount: number;
  errorMessage?: string;
  createdAt: string;
  validatedAt?: string;
  confirmedAt?: string;
  completedAt?: string;
};

export type ImportRowDetail = ClassifiedImportRow & { id: string; result?: string; reason?: string };

export class StaleReferenceImportError extends Error {
  constructor(message = "Reference data changed after this preview. Upload and validate the file again.") {
    super(message);
    this.name = "StaleReferenceImportError";
  }
}

export function publicImportError(error: unknown, fallback = "Reference-data import could not be completed.") {
  if (!(error instanceof Error)) return fallback;
  if (error instanceof StaleReferenceImportError) return error.message;
  const message = error.message;
  if (/^(CSV|Row \d+|The supplied|More than one|Reviewer email|courseCode|This reviewer|Only a validated|Import was not found|A reference|Bulk reference|A valid)/i.test(message)) return message;
  return fallback;
}

export function referenceBulkImportEnabled() {
  return process.env.REFERENCE_BULK_IMPORT_ENABLED === "true";
}

export function importLimits() {
  return {
    maxBytes: Math.max(1, Number(process.env.REFERENCE_IMPORT_MAX_MB || process.env.UPLOAD_MAX_MB || 8)) * 1024 * 1024,
    maxRows: Math.max(1, Number(process.env.REFERENCE_IMPORT_MAX_ROWS || 10000)),
    rowRetentionDays: Math.max(1, Number(process.env.REFERENCE_IMPORT_ROW_RETENTION_DAYS || 180)),
    summaryRetentionDays: Math.max(1, Number(process.env.REFERENCE_IMPORT_SUMMARY_RETENTION_DAYS || 730))
  };
}

export async function createReferenceImport(kind: ReferenceKind, fileName: string, bytes: Uint8Array, actor: ImportActor) {
  if (!referenceBulkImportEnabled()) throw new Error("Bulk reference-data import is not enabled.");
  if (!hasDatabase()) throw new Error("Bulk reference-data import requires PostgreSQL.");
  const limits = importLimits();
  if (bytes.byteLength > limits.maxBytes) throw new Error(`CSV exceeds the maximum file size of ${Math.round(limits.maxBytes / 1024 / 1024)} MB.`);
  const text = decodeCsv(bytes);
  const parsed = parseCsv(text, kind, limits.maxRows);
  const current = await listReferenceRecordsDirect();
  const classified = classifyReferenceImport(kind, parsed, current);
  const id = crypto.randomUUID();
  const now = new Date();
  const rowExpiresAt = new Date(now.getTime() + limits.rowRetentionDays * 86400000);
  const summaryExpiresAt = new Date(now.getTime() + limits.summaryRetentionDays * 86400000);
  const summary = summarizeClassification(id, kind, safeFilename(fileName), sha256(bytes), actor, classified, now, rowExpiresAt, summaryExpiresAt);

  await withTransaction(async (client) => {
    await client.query(
      `insert into reference_imports
       (id, kind, original_filename, file_sha256, uploaded_by, status, total_rows, valid_rows, new_count, unchanged_count, update_count, invalid_count, conflict_count, row_expires_at, summary_expires_at, validated_at)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())`,
      [id, kind, summary.originalFilename, summary.fileSha256, JSON.stringify(actor), summary.status, summary.totalRows, summary.validRows, summary.newCount, summary.unchangedCount, summary.updateCount, summary.invalidCount, summary.conflictCount, rowExpiresAt, summaryExpiresAt]
    );
    for (const row of classified) {
      await insertImportRow(client, id, row);
    }
  });
  return summary;
}

export function classifyReferenceImport(kind: ReferenceKind, parsedRows: ParsedCsvRow[], currentRecords: ReferenceRecord[]): ClassifiedImportRow[] {
  const currentById = new Map(currentRecords.map((record) => [record.id, record]));
  const currentByKey = new Map<string, ReferenceRecord[]>();
  for (const record of currentRecords.filter((record) => record.kind === kind)) {
    const key = naturalKey(kind, record.key);
    currentByKey.set(key, [...(currentByKey.get(key) || []), record]);
  }

  const rows: ClassifiedImportRow[] = parsedRows.map((parsed) => {
    try {
      const input = normalizeImportRow(kind, parsed);
      return { rowNumber: parsed.rowNumber, identifier: input.key, input, status: "new", operation: "insert", errors: [], warnings: [] };
    } catch (error) {
      return { rowNumber: parsed.rowNumber, identifier: identifierFromRaw(kind, parsed.values), input: null, rawValues: parsed.values, status: "invalid", operation: "reject", errors: [safeError(error)], warnings: [] };
    }
  });

  const rowKeys = new Map<string, ClassifiedImportRow[]>();
  for (const row of rows.filter((item) => item.input)) {
    const key = naturalKey(kind, row.input!.key);
    rowKeys.set(key, [...(rowKeys.get(key) || []), row]);
  }
  for (const duplicates of rowKeys.values()) {
    if (duplicates.length < 2) continue;
    duplicates.forEach((row) => {
      row.status = "conflict";
      row.operation = "reject";
      row.errors.push("The natural key is duplicated within the uploaded CSV.");
    });
  }

  for (const row of rows.filter((item) => item.input && item.status !== "invalid" && item.status !== "conflict")) {
    const input = row.input!;
    const matchesById = input.id ? currentById.get(input.id) : undefined;
    const keyMatches = currentByKey.get(naturalKey(kind, input.key)) || [];
    if (input.id && !matchesById) {
      row.status = "conflict";
      row.operation = "reject";
      row.errors.push("The supplied id does not identify an existing record.");
      continue;
    }
    if (matchesById && matchesById.kind !== kind) {
      row.status = "conflict";
      row.operation = "reject";
      row.errors.push("The supplied id belongs to a different reference-data type.");
      continue;
    }
    if (keyMatches.length > 1) {
      row.status = "conflict";
      row.operation = "reject";
      row.errors.push("More than one database record matches this natural key.");
      continue;
    }
    const current = matchesById || keyMatches[0];
    if (!current) {
      row.proposed = input;
      validateArchiveState(row, input);
      validateDependencies(kind, row, input, undefined, currentRecords);
      continue;
    }
    row.current = current;
    row.proposed = mergePreservingUnknown(kind, current, input);
    row.identifier = current.key;
    row.snapshotHash = recordSnapshotHash(current);
    row.snapshotUpdatedAt = current.updatedAt;
    const unchanged = current.active === row.proposed.active && sameCsvValues(kind, current, row.proposed);
    row.status = unchanged ? "unchanged" : "update";
    row.operation = unchanged ? "skip" : "update";
    validateArchiveState(row, row.proposed);
    validateDependencies(kind, row, row.proposed, current, currentRecords);
  }
  return rows;
}

export async function confirmReferenceImport(importId: string, actor: ImportActor) {
  if (!referenceBulkImportEnabled()) throw new Error("Bulk reference-data import is not enabled.");
  try {
    return await withReferenceDataWriteTransaction(async (client) => {
      const jobResult = await client.query("select * from reference_imports where id = $1 for update", [importId]);
      const job = jobResult.rows[0];
      if (!job) throw new Error("Import was not found.");
      if (job.status !== "preview_ready") throw new Error("Only a validated import with no errors can be confirmed.");
      const rowsResult = await client.query("select * from reference_import_rows where import_id = $1 order by row_number", [importId]);
      const storedRows = rowsResult.rows;
      const parsedRows: ParsedCsvRow[] = storedRows.map((row) => ({ rowNumber: Number(row.row_number), values: inputToFieldValues(row.input_data as ImportReferenceInput, String(job.kind)) as unknown as Record<string, string> }));
      const current = await readReferenceRecordsWithClient(client);
      const fresh = classifyReferenceImport(job.kind as ReferenceKind, parsedRows, current);
      if (fresh.length !== storedRows.length || fresh.some((row, index) => !sameSnapshot(row, storedRows[index]))) throw new StaleReferenceImportError();
      if (fresh.some((row) => row.status === "invalid" || row.status === "conflict")) throw new StaleReferenceImportError("The import is no longer valid. Upload and validate the file again.");

      await client.query("update reference_imports set status = 'applying', confirmed_at = now() where id = $1", [importId]);
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      for (let index = 0; index < fresh.length; index += 1) {
        const row = fresh[index];
        const stored = storedRows[index];
        if (row.status === "new") {
          await insertReferenceRecord(client, row.proposed || row.input!);
          await client.query("update reference_import_rows set result = 'inserted', reason = null where id = $1", [stored.id]);
          inserted += 1;
        } else if (row.status === "update") {
          await updateReferenceRecord(client, row.current!.id, row.proposed || row.input!);
          await client.query("update reference_import_rows set result = 'updated', reason = null where id = $1", [stored.id]);
          updated += 1;
        } else {
          await client.query("update reference_import_rows set result = 'unchanged', reason = 'Existing database value already matches the CSV.' where id = $1", [stored.id]);
          skipped += 1;
        }
        await writeReferenceAudit(client, actor, importId, job, row, row.status === "new" ? "insert" : row.status === "update" ? "update" : "skip");
      }
      const rejected = Number(job.invalid_count || 0) + Number(job.conflict_count || 0);
      await client.query(
        `update reference_imports set status = 'completed', inserted_count = $2, updated_count = $3, skipped_count = $4, rejected_count = $5, completed_at = now() where id = $1`,
        [importId, inserted, updated, skipped, rejected]
      );
      await writeImportSummaryAudit(client, actor, importId, job, { inserted, updated, skipped, rejected });
      return getImportSummaryFromRow({ ...job, status: "completed", inserted_count: inserted, updated_count: updated, skipped_count: skipped, rejected_count: rejected, completed_at: new Date() });
    });
  } catch (error) {
    if (error instanceof StaleReferenceImportError) {
      await query("update reference_imports set status = 'stale', error_message = $2 where id = $1 and status = 'preview_ready'", [importId, error.message]);
    } else {
      await query("update reference_imports set status = 'failed', error_message = $2 where id = $1 and status in ('preview_ready', 'applying')", [importId, "Import transaction failed. The database transaction was rolled back."]);
    }
    throw error;
  }
}

export async function getReferenceImport(importId: string) {
  await cleanupReferenceImports();
  const result = await query("select * from reference_imports where id = $1", [importId]);
  return result.rows[0] ? getImportSummaryFromRow(result.rows[0]) : null;
}

export async function listReferenceImports(options: { page?: number; pageSize?: number; kind?: ReferenceKind; status?: ImportStatus } = {}) {
  await cleanupReferenceImports();
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize || 25)));
  const params: unknown[] = [];
  const filters: string[] = [];
  if (options.kind) { params.push(options.kind); filters.push(`kind = $${params.length}`); }
  if (options.status) { params.push(options.status); filters.push(`status = $${params.length}`); }
  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const count = await query<{ count: string }>(`select count(*)::text as count from reference_imports ${where}`, params);
  const rows = await query(`select * from reference_imports ${where} order by created_at desc limit $${params.length + 1} offset $${params.length + 2}`, [...params, pageSize, (page - 1) * pageSize]);
  return { imports: rows.rows.map(getImportSummaryFromRow), total: Number(count.rows[0]?.count || 0), page, pageSize };
}

export async function listReferenceImportRows(importId: string, options: { page?: number; pageSize?: number; status?: ImportRowStatus; search?: string } = {}) {
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize || 50)));
  const params: unknown[] = [importId];
  const filters = ["import_id = $1"];
  if (options.status) { params.push(options.status); filters.push(`status = $${params.length}`); }
  if (options.search?.trim()) { params.push(`%${options.search.trim()}%`); filters.push(`coalesce(identifier, '') ilike $${params.length}`); }
  const where = filters.join(" and ");
  const count = await query<{ count: string }>(`select count(*)::text as count from reference_import_rows where ${where}`, params);
  const rows = await query(`select * from reference_import_rows where ${where} order by row_number limit $${params.length + 1} offset $${params.length + 2}`, [...params, pageSize, (page - 1) * pageSize]);
  return { rows: rows.rows.map(importRowFromDbRow), total: Number(count.rows[0]?.count || 0), page, pageSize };
}

export async function referenceImportResultsCsv(importId: string) {
  const job = await getReferenceImport(importId);
  if (!job) throw new Error("Import was not found.");
  const result = await query("select row_number, identifier, operation, result, reason, errors from reference_import_rows where import_id = $1 order by row_number", [importId]);
  const lines = ["originalRowNumber,recordIdentifier,operation,result,reason"];
  for (const row of result.rows) {
    const errors = Array.isArray(row.errors) ? row.errors.join("; ") : "";
    lines.push([row.row_number, row.identifier || "", row.operation || "", row.result || "rejected", row.reason || errors].map((value) => escapeCsvCell(String(value))).join(","));
  }
  return { filename: `reference-import-${job.kind}-${importId}.csv`, body: `${lines.join("\r\n")}\r\n` };
}

export async function cleanupReferenceImports() {
  if (!hasDatabase()) return;
  await query("delete from reference_imports where summary_expires_at < now()");
  await query("delete from reference_import_rows where import_id in (select id from reference_imports where row_expires_at < now())");
}

function classifyCounts(rows: ClassifiedImportRow[]) {
  return rows.reduce((counts, row) => {
    counts.totalRows += 1;
    if (["new", "unchanged", "update"].includes(row.status)) counts.validRows += 1;
    if (row.status === "new") counts.newCount += 1;
    if (row.status === "unchanged") counts.unchangedCount += 1;
    if (row.status === "update") counts.updateCount += 1;
    if (row.status === "invalid") counts.invalidCount += 1;
    if (row.status === "conflict") counts.conflictCount += 1;
    return counts;
  }, { totalRows: 0, validRows: 0, newCount: 0, unchangedCount: 0, updateCount: 0, invalidCount: 0, conflictCount: 0 });
}

function summarizeClassification(id: string, kind: ReferenceKind, filename: string, hash: string, actor: ImportActor, rows: ClassifiedImportRow[], now: Date, _rowExpiresAt: Date, _summaryExpiresAt: Date): ImportSummary {
  const counts = classifyCounts(rows);
  return { id, kind, originalFilename: filename, fileSha256: hash, uploadedBy: actor, status: counts.invalidCount || counts.conflictCount ? "blocked" : "preview_ready", ...counts, insertedCount: 0, updatedCount: 0, skippedCount: 0, rejectedCount: counts.invalidCount + counts.conflictCount, createdAt: now.toISOString(), validatedAt: now.toISOString() };
}

async function insertImportRow(client: PoolClient, importId: string, row: ClassifiedImportRow) {
  await client.query(
    `insert into reference_import_rows
     (id, import_id, row_number, identifier, record_id, status, operation, input_data, current_data, proposed_data, snapshot_hash, snapshot_updated_at, errors, warnings)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, $13::jsonb, $14::jsonb)`,
    [crypto.randomUUID(), importId, row.rowNumber, row.identifier || null, row.current?.id || null, row.status, row.operation, JSON.stringify(row.input || { values: row.rawValues || {} }), row.current ? JSON.stringify(row.current) : null, row.proposed ? JSON.stringify(row.proposed) : null, row.snapshotHash || null, row.snapshotUpdatedAt || null, JSON.stringify(row.errors), JSON.stringify(row.warnings)]
  );
}

async function readReferenceRecordsWithClient(client: PoolClient) {
  const result = await client.query("select id, kind, data, active, archived, archived_at, created_at, updated_at from reference_records order by kind, updated_at desc, id");
  return result.rows.map(referenceRecordFromDbRow);
}

async function insertReferenceRecord(client: PoolClient, input: ImportReferenceInput) {
  const now = new Date().toISOString();
  await client.query(
    `insert into reference_records (id, kind, data, active, archived, archived_at, created_at, updated_at) values ($1, $2, $3::jsonb, $4, $5, case when $5 then $6::timestamptz else null end, $6::timestamptz, $6::timestamptz)`,
    [input.id || crypto.randomUUID(), input.kind, JSON.stringify(dbDataForInput(input)), input.active, input.archived ?? false, now]
  );
}

async function updateReferenceRecord(client: PoolClient, id: string, input: ImportReferenceInput) {
  const now = new Date().toISOString();
  await client.query("update reference_records set data = $2::jsonb, active = $3, archived = $4, archived_at = case when $4 then coalesce(archived_at, $5::timestamptz) else null end, updated_at = $5::timestamptz where id = $1", [id, JSON.stringify(dbDataForInput(input)), input.active, input.archived ?? false, now]);
}

function dbDataForInput(input: ImportReferenceInput) {
  return { key: input.key, label: input.label, email: input.email, data: input.data };
}

async function writeReferenceAudit(client: PoolClient, actor: ImportActor, importId: string, job: Record<string, unknown>, row: ClassifiedImportRow, operation: string) {
  await client.query(
    `insert into custom_audit_logs (id, actor_json, action, target_type, target_id, metadata_json, created_at)
     values ($1, $2::jsonb, $3, 'reference_record', $4, $5::jsonb, now())`,
    [crypto.randomUUID(), JSON.stringify(actor), `reference_import.${operation}`, row.current?.id || row.proposed?.id || row.input?.id || row.identifier, JSON.stringify({ importId, kind: job.kind, filename: job.original_filename, rowNumber: row.rowNumber, changedFields: changedFields(row), warnings: row.warnings })]
  );
}

async function writeImportSummaryAudit(client: PoolClient, actor: ImportActor, importId: string, job: Record<string, unknown>, counts: { inserted: number; updated: number; skipped: number; rejected: number }) {
  await client.query(
    `insert into custom_audit_logs (id, actor_json, action, target_type, target_id, metadata_json, created_at)
     values ($1, $2::jsonb, 'reference_import.completed', 'reference_import', $3, $4::jsonb, now())`,
    [crypto.randomUUID(), JSON.stringify(actor), importId, JSON.stringify({ administratorEmail: actor.email, importType: job.kind, originalFilename: job.original_filename, totalRows: job.total_rows, insertedCount: counts.inserted, updatedCount: counts.updated, skippedCount: counts.skipped, rejectedCount: counts.rejected, status: "completed" })]
  );
}

function validateDependencies(kind: ReferenceKind, row: ClassifiedImportRow, input: ImportReferenceInput, current: ReferenceRecord | undefined, records: ReferenceRecord[]) {
  const unchanged = row.status === "unchanged";
  if (kind === "crn") {
    const courseCode = String(input.data.courseCode || "").toLowerCase();
    const course = records.find((record) => record.kind === "course" && record.active && String(record.data.courseCode || record.key).toLowerCase() === courseCode);
    if (!course) {
      if (unchanged && current) row.warnings.push("Existing CRN references a missing or inactive Course; unchanged legacy data was preserved.");
      else row.errors.push("courseCode must reference an active Course.");
    }
  }
  if (kind === "course" || kind === "crn" || kind === "programme_mapping") {
    const email = String(input.data.reviewerEmail || input.data.advisorEmail || input.email || "").toLowerCase();
    const reviewer = records.find((record) => (record.kind === "lecturer" || record.kind === "advisor") && record.active && String(record.email || record.data.email || record.key).toLowerCase() === email);
    if (!reviewer) {
      if (unchanged && current) row.warnings.push("Existing reviewer email does not resolve to an active application reviewer; unchanged legacy data was preserved.");
      else row.errors.push("Reviewer email must resolve to an active Lecturer or Advisor.");
    }
  }
  if ((kind === "lecturer" || kind === "advisor") && input.active === false) {
    const email = input.email?.toLowerCase();
    const assigned = records.some((record) => record.active && (record.kind === "course" || record.kind === "crn") && String(record.data.reviewerEmail || record.email || "").toLowerCase() === email);
    if (assigned) row.errors.push("This reviewer is assigned to active Courses or CRNs and cannot be deactivated by this import.");
  }
  if (row.errors.length > 0) { row.status = "invalid"; row.operation = "reject"; }
}

function validateArchiveState(row: ClassifiedImportRow, input: ImportReferenceInput) {
  if (input.archived === true && input.active) row.errors.push("Archived reference records must be inactive.");
  if (row.errors.length > 0) { row.status = "invalid"; row.operation = "reject"; }
}

function mergePreservingUnknown(kind: ReferenceKind, current: ReferenceRecord, input: ImportReferenceInput): ImportReferenceInput {
  const known = new Set(referenceColumns(kind).filter((column) => !["id", "active"].includes(column)).map((column) => column));
  const data = { ...current.data };
  Object.keys(input.data).forEach((key) => { data[key] = input.data[key]; });
  Object.keys(data).forEach((key) => { if (!known.has(key)) data[key] = current.data[key]; });
  return { ...input, id: current.id, archived: input.archived ?? current.archived, data };
}

function sameCsvValues(kind: ReferenceKind, current: ReferenceRecord, input: ImportReferenceInput) {
  const currentValues = inputToCsvRow(kind, current);
  const proposedValues = inputToCsvRow(kind, input);
  return referenceColumns(kind).filter((column) => column !== "id").every((column) => String(currentValues[column as keyof typeof currentValues] || "").toLowerCase() === String(proposedValues[column as keyof typeof proposedValues] || "").toLowerCase());
}

function recordSnapshotHash(record: ReferenceRecord) {
  return sha256(Buffer.from(stableStringify({ id: record.id, kind: record.kind, key: record.key, label: record.label, email: record.email, active: record.active, archived: record.archived, data: record.data })));
}

function sameSnapshot(row: ClassifiedImportRow, stored: Record<string, unknown>) {
  return row.rowNumber === Number(stored.row_number) && row.status === stored.status && row.operation === stored.operation && row.identifier === String(stored.identifier || "") && (row.snapshotHash || null) === (stored.snapshot_hash || null) && (row.snapshotUpdatedAt || null) === (stored.snapshot_updated_at ? new Date(stored.snapshot_updated_at as string).toISOString() : null);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function naturalKey(kind: ReferenceKind, key: string) { return `${kind}:${key.trim().toLowerCase()}`; }
function identifierFromRaw(kind: ReferenceKind, values: Record<string, string>) { return values[kind === "course" ? "courseCode" : kind === "crn" ? "crn" : kind === "programme_mapping" ? "programme" : "email"] || ""; }
function safeError(error: unknown) { return error instanceof Error ? error.message : "Row could not be validated."; }
function safeFilename(value: string) { return path.basename(value.replace(/[\\/]/g, "_")).replace(/[\r\n]/g, "_").slice(0, 255) || "reference-data.csv"; }
function sha256(value: Uint8Array) { return crypto.createHash("sha256").update(value).digest("hex"); }
function decodeCsv(bytes: Uint8Array) { try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new Error("CSV must be valid UTF-8 text."); } }
function inputToFieldValues(input: ImportReferenceInput, kind: string) { return inputToCsvRow(kind as ReferenceKind, input); }

function getImportSummaryFromRow(row: Record<string, unknown>): ImportSummary {
  return {
    id: String(row.id), kind: row.kind as ReferenceKind, originalFilename: String(row.original_filename), fileSha256: String(row.file_sha256), uploadedBy: row.uploaded_by as ImportActor, status: row.status as ImportStatus,
    totalRows: Number(row.total_rows || 0), validRows: Number(row.valid_rows || 0), newCount: Number(row.new_count || 0), unchangedCount: Number(row.unchanged_count || 0), updateCount: Number(row.update_count || 0), invalidCount: Number(row.invalid_count || 0), conflictCount: Number(row.conflict_count || 0), insertedCount: Number(row.inserted_count || 0), updatedCount: Number(row.updated_count || 0), skippedCount: Number(row.skipped_count || 0), rejectedCount: Number(row.rejected_count || 0), errorMessage: row.error_message ? String(row.error_message) : undefined, createdAt: new Date(row.created_at as string).toISOString(), validatedAt: row.validated_at ? new Date(row.validated_at as string).toISOString() : undefined, confirmedAt: row.confirmed_at ? new Date(row.confirmed_at as string).toISOString() : undefined, completedAt: row.completed_at ? new Date(row.completed_at as string).toISOString() : undefined
  };
}

function importRowFromDbRow(row: Record<string, unknown>): ImportRowDetail {
  const input = row.input_data && typeof row.input_data === "object" && "kind" in (row.input_data as object) ? row.input_data as ImportReferenceInput : null;
  return { id: String(row.id), rowNumber: Number(row.row_number), identifier: String(row.identifier || ""), input, current: row.current_data as ReferenceRecord | undefined, proposed: row.proposed_data as ImportReferenceInput | undefined, status: row.status as ImportRowStatus, operation: row.operation as ImportOperation, errors: Array.isArray(row.errors) ? row.errors.map(String) : [], warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [], snapshotHash: row.snapshot_hash ? String(row.snapshot_hash) : undefined, snapshotUpdatedAt: row.snapshot_updated_at ? new Date(row.snapshot_updated_at as string).toISOString() : undefined, result: row.result ? String(row.result) : undefined, reason: row.reason ? String(row.reason) : undefined };
}

function changedFields(row: ClassifiedImportRow) {
  if (!row.current || !row.proposed) return [];
  return referenceColumns(row.current.kind).filter((column) => column !== "id").filter((column) => String(inputToCsvRow(row.current!.kind, row.current!)[column as keyof ReturnType<typeof inputToCsvRow>] || "") !== String(inputToCsvRow(row.current!.kind, row.proposed!)[column as keyof ReturnType<typeof inputToCsvRow>] || ""));
}
