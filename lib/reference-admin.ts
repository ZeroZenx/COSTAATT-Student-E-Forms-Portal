import crypto from "crypto";
import path from "path";
import type { PoolClient } from "pg";
import { hasDatabase, query, withReferenceDataWriteTransaction } from "./db";
import type { SsoUser } from "./types";
import { readOrSeedJsonFile, writeJsonFile } from "./json-store";
import { courseCatalogOptions } from "./course-catalog-data";
import {
  advisorOptions,
  courseAdvisorOptions,
  normalizeCourseMatch,
  programmeOptions,
  type AdvisorOption,
  type CourseLookupField,
  type CourseLookupMatch,
  type ProgrammeOption
} from "./reference-data";

export type ReferenceKind = "course" | "crn" | "lecturer" | "advisor" | "programme_mapping";

export type ReferenceRecord = {
  id: string;
  kind: ReferenceKind;
  key: string;
  label: string;
  email?: string;
  active: boolean;
  archived: boolean;
  data: Record<string, string | boolean | number | undefined>;
  createdAt: string;
  updatedAt: string;
};

export function publicReferenceAdminError(error: unknown, fallback = "Reference record could not be saved.") {
  if (!(error instanceof Error)) return fallback;
  const message = error.message;
  if (/^(Duplicate|Invalid|CRN is required|Course code is required|Email is required|Inactive|Linked|Lecturer cannot be deactivated|Only inactive reference records can be archived|Archived|This reference record changed)/i.test(message)) return message;
  return fallback;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function localReferencePath() {
  return process.env.REFERENCE_STORE_PATH || path.join(process.cwd(), "data", "reference-records.json");
}

function seedRecords(): ReferenceRecord[] {
  const now = new Date().toISOString();
  const courses = courseAdvisorOptions.map((item) => ({
    id: crypto.randomUUID(),
    kind: "course" as const,
    key: item.courseCode,
    label: item.courseTitle || item.courseCode,
    active: true,
    archived: false,
    data: {
      courseCode: item.courseCode,
      courseTitle: item.courseTitle || item.courseCode,
      reviewerName: item.lecturerName || item.advisorName,
      reviewerEmail: item.lecturerEmail || item.advisorEmail,
      reviewerRole: item.lecturerEmail ? "lecturer" : "advisor"
    },
    createdAt: now,
    updatedAt: now
  }));
  const lecturers = uniqueBy(
    courseAdvisorOptions
      .map((item) => ({
        name: item.lecturerName || item.advisorName,
        email: item.lecturerEmail || item.advisorEmail
      }))
      .filter((item): item is { name: string; email: string } => Boolean(item.name && item.email)),
    (item) => item.email.toLowerCase()
  ).map((item) => ({
    id: crypto.randomUUID(),
    kind: "lecturer" as const,
    key: item.email.toLowerCase(),
    label: item.name,
    email: item.email,
    active: true,
    archived: false,
    data: { name: item.name, email: item.email },
    createdAt: now,
    updatedAt: now
  }));
  const advisors = advisorOptions.map((item) => ({
    id: crypto.randomUUID(),
    kind: "advisor" as const,
    key: item.email.toLowerCase(),
    label: item.name,
    email: item.email,
    active: true,
    archived: false,
    data: { name: item.name, email: item.email },
    createdAt: now,
    updatedAt: now
  }));
  const programmes = programmeOptions.map((item) => ({
    id: crypto.randomUUID(),
    kind: "programme_mapping" as const,
    key: item.programme,
    label: item.programme,
    email: item.advisorEmail,
    active: true,
    archived: false,
    data: {
      programme: item.programme,
      advisorName: item.advisorName,
      advisorEmail: item.advisorEmail
    },
    createdAt: now,
    updatedAt: now
  }));
  const crns = courseCatalogOptions.map((item) => ({
    id: crypto.randomUUID(),
    kind: "crn" as const,
    key: item.crn,
    label: `${item.crn} - ${item.courseCode}`,
    email: item.reviewerEmail || undefined,
    active: true,
    archived: false,
    data: {
      crn: item.crn,
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      department: item.department,
      reviewerName: item.reviewerName,
      reviewerEmail: item.reviewerEmail,
      reviewerRole: item.reviewerRole,
      campus: item.campus,
      section: item.section,
      source: item.source
    },
    createdAt: now,
    updatedAt: now
  }));
  return [...courses, ...crns, ...lecturers, ...advisors, ...programmes];
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readReferenceRecords() {
  if (hasDatabase()) return readDbReferenceRecords();

  const records = await readOrSeedJsonFile<ReferenceRecord[]>(localReferencePath(), seedRecords);
  return records.map((record) => ({ ...record, archived: Boolean(record.archived) }));
}

async function readDbReferenceRecords() {
  const result = await query(
    `select id, kind, data, active, archived, archived_at, created_at, updated_at
     from reference_records
     order by updated_at desc`
  );
  if (result.rows.length > 0) return result.rows.map(referenceRecordFromDbRow);

  const records = seedRecords();
  await seedDbReferenceRecords(records);
  return records;
}

async function seedDbReferenceRecords(records: ReferenceRecord[]) {
  for (const record of records) {
    await query(
      `insert into reference_records (id, kind, data, active, archived, created_at, updated_at)
       values ($1, $2, $3::jsonb, $4, $5, $6, $7)
       on conflict do nothing`,
      [
        record.id,
        record.kind,
        JSON.stringify(recordToDbData(record)),
        record.active,
        record.archived,
        record.createdAt,
        record.updatedAt
      ]
    );
  }
}

async function writeReferenceRecords(records: ReferenceRecord[]) {
  await writeJsonFile(localReferencePath(), records);
}

export async function listReferenceRecords(kind?: ReferenceKind, search?: string) {
  const needle = search?.toLowerCase().trim();
  return (await readReferenceRecords()).filter((record) => {
    const matchesKind = !kind || record.kind === kind;
    const matchesSearch = !needle || JSON.stringify(record).toLowerCase().includes(needle);
    return matchesKind && matchesSearch;
  });
}

export async function upsertReferenceRecord(input: Partial<ReferenceRecord> & { kind: ReferenceKind; key: string; label: string }) {
  const normalized = normalizeReferenceInput(input);
  validateReferenceRecord(normalized);
  if (hasDatabase()) {
    return withReferenceDataWriteTransaction(async (client) => {
      const records = await readDbReferenceRecordsWithClient(client);
      ensureReviewerIsAssignable(normalized, records);
      const duplicate = records.find((record) => record.id !== normalized.id && record.kind === normalized.kind && record.key.toLowerCase() === normalized.key.toLowerCase() && record.active);
      if (duplicate) throw new Error(`Duplicate ${normalized.kind.replace("_", " ")} records are not allowed.`);
      const existing = normalized.id ? records.find((record) => record.id === normalized.id) : undefined;
      if (existing && normalized.updatedAt && new Date(normalized.updatedAt).getTime() !== new Date(existing.updatedAt).getTime()) throw new Error("This reference record changed while it was being edited. Reload it and try again.");
      if (existing?.archived && normalized.active !== false) throw new Error("Archived reference records must be unarchived before they can be activated or edited as active records.");
      const now = new Date().toISOString();
      const next: ReferenceRecord = {
        id: normalized.id || crypto.randomUUID(),
        kind: normalized.kind,
        key: normalized.key,
        label: normalized.label,
        email: normalized.email,
        active: normalized.active ?? true,
        archived: existing?.archived ?? false,
        data: normalized.data || {},
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      const result = await client.query(
        `insert into reference_records (id, kind, data, active, archived, created_at, updated_at)
         values ($1, $2, $3::jsonb, $4, $5, $6, $7)
         on conflict (id) do update set
           kind = excluded.kind,
           data = excluded.data,
           active = excluded.active,
           archived = excluded.archived,
           updated_at = excluded.updated_at
         returning id, kind, data, active, archived, archived_at, created_at, updated_at`,
        [next.id, next.kind, JSON.stringify(recordToDbData(next)), next.active, next.archived, next.createdAt, next.updatedAt]
      );
      return referenceRecordFromDbRow(result.rows[0]);
    });
  }

  const records = await readReferenceRecords();
  ensureReviewerIsAssignable(normalized, records);
  const duplicate = records.find((record) => record.id !== normalized.id && record.kind === normalized.kind && record.key.toLowerCase() === normalized.key.toLowerCase() && record.active);
  if (duplicate) throw new Error(`Duplicate ${normalized.kind.replace("_", " ")} records are not allowed.`);
  const now = new Date().toISOString();
  const index = normalized.id ? records.findIndex((record) => record.id === normalized.id) : -1;
  if (index >= 0 && records[index].archived && normalized.active !== false) throw new Error("Archived reference records must be unarchived before they can be activated or edited as active records.");
  const next: ReferenceRecord = {
    id: normalized.id || crypto.randomUUID(),
    kind: normalized.kind,
    key: normalized.key,
    label: normalized.label,
    email: normalized.email,
    active: normalized.active ?? true,
    archived: index >= 0 ? Boolean(records[index].archived) : false,
    data: normalized.data || {},
    createdAt: index >= 0 ? records[index].createdAt : now,
    updatedAt: now
  };

  if (index >= 0) records[index] = next;
  else records.unshift(next);
  await writeReferenceRecords(records);
  return next;
}

function ensureReviewerIsAssignable(input: Partial<ReferenceRecord> & { kind: ReferenceKind }, records: ReferenceRecord[]) {
  if (input.kind !== "course" && input.kind !== "crn") return;
  const reviewerEmail = String(input.data?.reviewerEmail || input.email || "").trim().toLowerCase();
  if (!reviewerEmail) return;
  const reviewer = records.find((record) => {
    return (record.kind === "lecturer" || record.kind === "advisor") &&
      String(record.email || record.data.email || "").toLowerCase() === reviewerEmail;
  });
  if (reviewer && !reviewer.active) throw new Error("Inactive lecturers or advisors cannot receive assignments.");
}

export async function getReferenceRecord(id: string) {
  if (hasDatabase()) {
    const result = await query(
      `select id, kind, data, active, archived, archived_at, created_at, updated_at
       from reference_records
       where id = $1`,
      [id]
    );
    return result.rows[0] ? referenceRecordFromDbRow(result.rows[0]) : null;
  }

  return (await readReferenceRecords()).find((record) => record.id === id) || null;
}

export async function deactivateReferenceRecord(id: string, linkedToSubmission = false, actor?: SsoUser) {
  if (linkedToSubmission) throw new Error("Linked reference records cannot be deleted; deactivate them instead.");
  if (hasDatabase()) {
    return withReferenceDataWriteTransaction(async (client) => {
      const existingResult = await client.query(
        `select id, kind, data, active, archived, archived_at, created_at, updated_at
         from reference_records
         where id = $1
         for update`,
        [id]
      );
      const existingRow = existingResult.rows[0];
      if (!existingRow) return null;
      if (existingRow.kind === "lecturer") {
        const raw = existingRow.data as Record<string, any>;
        const nested = raw?.data && typeof raw.data === "object" ? raw.data : {};
        const email = String(raw?.email || nested.email || raw?.key || nested.key || "").trim().toLowerCase();
        const assignments = await client.query<{ count: string }>(
          `select count(*)::text as count
           from reference_records
           where active = true
             and kind in ('course', 'crn')
             and lower(coalesce(data->'data'->>'reviewerEmail', data->'data'->>'lecturerEmail', data->>'reviewerEmail', data->>'lecturerEmail', data->>'email', '')) = $1`,
          [email]
        );
        if (Number(assignments.rows[0]?.count || 0) > 0) {
          throw new Error("Lecturer cannot be deactivated while active Course or CRN assignments reference this record.");
        }
      }
      const result = await client.query(
        `update reference_records
         set active = false,
             updated_at = $2
         where id = $1
         returning id, kind, data, active, archived, archived_at, created_at, updated_at`,
        [id, new Date().toISOString()]
      );
      if (!result.rows[0]) return null;
      if (actor) {
        await client.query(
          `insert into custom_audit_logs
             (id, actor_json, action, target_type, target_id, metadata_json, created_at)
           values ($1, $2::jsonb, 'reference_record.deactivated', 'reference_record', $3, $4::jsonb, $5)`,
          [
            crypto.randomUUID(),
            JSON.stringify({ identity: actor.studentId, name: `${actor.firstName} ${actor.lastName}`.trim(), email: actor.email.toLowerCase(), roles: actor.roles || [] }),
            id,
            JSON.stringify({ kind: result.rows[0].kind, snapshot: { id, kind: result.rows[0].kind, data: result.rows[0].data, active: true, created_at: result.rows[0].created_at, updated_at: result.rows[0].updated_at } }),
            new Date().toISOString()
          ]
        );
      }
      return referenceRecordFromDbRow(result.rows[0]);
    });
  }

  const records = await readReferenceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  if (records[index].kind === "lecturer") {
    const email = String(records[index].email || records[index].data.email || records[index].key || "").trim().toLowerCase();
    const assigned = records.some((record) => record.active && (record.kind === "course" || record.kind === "crn") && String(record.data.reviewerEmail || record.data.lecturerEmail || record.email || "").trim().toLowerCase() === email);
    if (assigned) throw new Error("Lecturer cannot be deactivated while active Course or CRN assignments reference this record.");
  }
  records[index] = { ...records[index], active: false, updatedAt: new Date().toISOString() };
  await writeReferenceRecords(records);
  return records[index];
}

export async function setReferenceRecordArchived(id: string, archived: boolean, actor?: SsoUser) {
  if (hasDatabase()) {
    return withReferenceDataWriteTransaction(async (client) => {
      const existingResult = await client.query(
        `select id, kind, data, active, archived, archived_at, created_at, updated_at
         from reference_records
         where id = $1
         for update`,
        [id]
      );
      const existingRow = existingResult.rows[0];
      if (!existingRow) return null;
      if (archived && existingRow.active) throw new Error("Only inactive reference records can be archived.");
      if (Boolean(existingRow.archived) === archived) return referenceRecordFromDbRow(existingRow);
      const now = new Date().toISOString();
      const result = await client.query(
        `update reference_records
         set archived = $2,
             archived_at = case when $2 then $3::timestamptz else null end,
             updated_at = $3::timestamptz
         where id = $1
         returning id, kind, data, active, archived, archived_at, created_at, updated_at`,
        [id, archived, now]
      );
      if (!result.rows[0]) return null;
      if (actor) {
        await client.query(
          `insert into custom_audit_logs
             (id, actor_json, action, target_type, target_id, metadata_json, created_at)
           values ($1, $2::jsonb, $3, 'reference_record', $4, $5::jsonb, $6)`,
          [
            crypto.randomUUID(),
            JSON.stringify({ identity: actor.studentId, name: `${actor.firstName} ${actor.lastName}`.trim(), email: actor.email.toLowerCase(), roles: actor.roles || [] }),
            archived ? "reference_record.archived" : "reference_record.unarchived",
            id,
            JSON.stringify({ kind: result.rows[0].kind, archived, snapshot: { id, kind: result.rows[0].kind, data: result.rows[0].data, active: result.rows[0].active, archived: !archived, archived_at: archived ? null : existingRow.archived_at, created_at: result.rows[0].created_at, updated_at: result.rows[0].updated_at } }),
            now
          ]
        );
      }
      return referenceRecordFromDbRow(result.rows[0]);
    });
  }

  const records = await readReferenceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  if (archived && records[index].active) throw new Error("Only inactive reference records can be archived.");
  if (records[index].archived === archived) return records[index];
  records[index] = { ...records[index], archived, updatedAt: new Date().toISOString() };
  await writeReferenceRecords(records);
  return records[index];
}

export async function referenceRecordCounts() {
  const records = await readReferenceRecords();
  return records.reduce<Record<ReferenceKind | "total" | "active" | "inactive", number>>(
    (counts, record) => {
      counts.total += 1;
      counts[record.active ? "active" : "inactive"] += 1;
      counts[record.kind] += 1;
      return counts;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      course: 0,
      crn: 0,
      lecturer: 0,
      advisor: 0,
      programme_mapping: 0
    }
  );
}

export function referenceStorageMode() {
  return hasDatabase() ? "postgres" : "json";
}

export async function lookupReferenceCourseMatches(field: CourseLookupField, value: string): Promise<CourseLookupMatch[]> {
  const needle = value.trim().toLowerCase();
  if (!needle) return [];
  return (await listReferenceCourseOptions()).filter((option) => {
    const crn = option.crn?.toLowerCase() || "";
    const courseCode = option.courseCode.toLowerCase();
    const courseTitle = option.courseTitle.toLowerCase();
    if (field === "crn") return crn === needle;
    if (field === "courseCode") return courseCode === needle;
    return courseTitle === needle;
  });
}

export async function listReferenceCourseOptions(): Promise<CourseLookupMatch[]> {
  const records = (await readReferenceRecords()).filter((record) => record.active);
  const byCourseCode = new Map(
    records
      .filter((record) => record.kind === "course")
      .map((record) => [String(record.data.courseCode || record.key).toLowerCase(), record])
  );

  const courseOptions = records
    .filter((record) => record.kind === "course")
    .map((record) => recordToCourseLookup(record))
    .filter((option): option is CourseLookupMatch => Boolean(option));
  const crnOptions = records
    .filter((record) => record.kind === "crn")
    .map((record) => recordToCourseLookup(record, byCourseCode.get(String(record.data.courseCode || "").toLowerCase())))
    .filter((option): option is CourseLookupMatch => Boolean(option));

  return uniqueBy([...crnOptions, ...courseOptions], (item) => `${item.crn || "no-crn"}|${item.courseCode}|${item.courseTitle}|${item.section}`);
}

/** Direct read used by import/export paths. It never seeds an empty PostgreSQL table. */
export async function listReferenceRecordsDirect(kind?: ReferenceKind) {
  if (!hasDatabase()) return (await readReferenceRecords()).filter((record) => !kind || record.kind === kind);
  const params = kind ? [kind] : [];
  const result = await query(
    `select id, kind, data, active, archived, archived_at, created_at, updated_at
     from reference_records
     ${kind ? "where kind = $1" : ""}
     order by kind, updated_at desc, id`,
    params
  );
  return result.rows.map(referenceRecordFromDbRow);
}

export type ReferenceRecordPage = { records: ReferenceRecord[]; total: number; page: number; pageSize: number };

export async function listReferenceRecordsPage(options: { kind?: ReferenceKind; search?: string; active?: "active" | "inactive" | "archived" | "all"; page?: number; pageSize?: number } = {}): Promise<ReferenceRecordPage> {
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(200, Math.max(1, Math.floor(options.pageSize || 50)));
  const active = options.active || "all";
  if (!hasDatabase()) {
    const records = await listReferenceRecords(options.kind, options.search);
    const filtered = records.filter((record) => active === "all" ? true : active === "active" ? record.active && !record.archived : active === "inactive" ? !record.active && !record.archived : record.archived);
    return { records: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  }
  const params: unknown[] = [];
  const filters: string[] = [];
  if (options.kind) { params.push(options.kind); filters.push(`kind = $${params.length}`); }
  if (active === "active") filters.push("active = true and archived = false");
  if (active === "inactive") filters.push("active = false and archived = false");
  if (active === "archived") filters.push("archived = true");
  if (options.search?.trim()) { params.push(`%${options.search.trim()}%`); filters.push(`data::text ilike $${params.length}`); }
  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const count = await query<{ count: string }>(`select count(*)::text as count from reference_records ${where}`, params);
  const offset = (page - 1) * pageSize;
  const rows = await query(`select id, kind, data, active, archived, archived_at, created_at, updated_at from reference_records ${where} order by updated_at desc, id limit $${params.length + 1} offset $${params.length + 2}`, [...params, pageSize, offset]);
  return { records: rows.rows.map(referenceRecordFromDbRow), total: Number(count.rows[0]?.count || 0), page, pageSize };
}

async function readDbReferenceRecordsWithClient(client: PoolClient): Promise<ReferenceRecord[]> {
  const result = await client.query(
    `select id, kind, data, active, archived, archived_at, created_at, updated_at
       from reference_records
     order by updated_at desc`
  );
  return result.rows.map((row: Record<string, unknown>) => referenceRecordFromDbRow(row));
}

export async function listReferenceProgrammeOptions(): Promise<ProgrammeOption[]> {
  const records = (await readReferenceRecords()).filter((record) => record.active && record.kind === "programme_mapping");
  return uniqueBy(
    records
      .map((record) => {
        const programme = String(record.data.programme || record.key || record.label || "").trim();
        if (!programme) return null;
        return {
          programme,
          advisorName: String(record.data.advisorName || record.label || "").trim(),
          advisorEmail: String(record.data.advisorEmail || record.email || "").trim()
        };
      })
      .filter((option): option is ProgrammeOption => Boolean(option)),
    (option) => option.programme.toLowerCase()
  );
}

export async function listReferenceAdvisorOptions(): Promise<AdvisorOption[]> {
  const records = (await readReferenceRecords()).filter((record) => record.active && (record.kind === "advisor" || record.kind === "lecturer"));
  return uniqueBy(
    records
      .map((record) => {
        const name = String(record.data.name || record.label || "").trim();
        const email = String(record.data.email || record.email || record.key || "").trim();
        if (!name || !email) return null;
        return { name, email };
      })
      .filter((option): option is AdvisorOption => Boolean(option)),
    (option) => option.email.toLowerCase()
  );
}

function recordToCourseLookup(record: ReferenceRecord, courseRecord?: ReferenceRecord): CourseLookupMatch | null {
  const data = { ...(courseRecord?.data || {}), ...record.data };
  const courseCode = String(data.courseCode || record.key || "").trim();
  if (!courseCode) return null;
  const reviewerName = String(data.reviewerName || data.lecturerName || data.advisorName || record.label || "").trim();
  const reviewerEmail = String(data.reviewerEmail || data.lecturerEmail || data.advisorEmail || record.email || "").trim();
  return normalizeCourseMatch({
    crn: String(data.crn || (record.kind === "crn" ? record.key : "") || "").trim() || undefined,
    courseCode,
    courseTitle: String(data.courseTitle || courseRecord?.label || record.label || courseCode).trim(),
    lecturerName: String(data.reviewerRole || "") === "lecturer" ? reviewerName : String(data.lecturerName || "").trim() || undefined,
    lecturerEmail: String(data.reviewerRole || "") === "lecturer" ? reviewerEmail : String(data.lecturerEmail || "").trim() || undefined,
    advisorName: String(data.reviewerRole || "") !== "lecturer" ? reviewerName : String(data.advisorName || "").trim(),
    advisorEmail: String(data.reviewerRole || "") !== "lecturer" ? reviewerEmail : String(data.advisorEmail || "").trim(),
    campus: String(data.campus || "").trim() || undefined,
    section: String(data.section || "").trim() || undefined
  });
}

function normalizeReferenceInput(input: Partial<ReferenceRecord> & { kind: ReferenceKind; key: string; label: string }) {
  const data = { ...(input.data || {}) };
  if (input.kind === "course") {
    data.courseCode = String(data.courseCode || input.key).trim().toUpperCase();
    data.courseTitle = String(data.courseTitle || input.label || data.courseCode).trim();
    input.key = String(data.courseCode);
    input.label = String(data.courseTitle);
    input.email = String(data.reviewerEmail || input.email || "").trim() || undefined;
  }
  if (input.kind === "crn") {
    data.crn = String(data.crn || input.key).trim();
    input.key = String(data.crn);
    input.label = String(data.courseTitle || input.label || data.courseCode || data.crn).trim();
    input.email = String(data.reviewerEmail || input.email || "").trim() || undefined;
  }
  if (input.kind === "advisor" || input.kind === "lecturer") {
    data.name = String(data.name || input.label).trim();
    data.email = String(data.email || input.email || input.key).trim();
    input.key = String(data.email).toLowerCase();
    input.label = String(data.name);
    input.email = String(data.email);
  }
  if (input.kind === "programme_mapping") {
    data.programme = String(data.programme || input.key).trim();
    input.key = String(data.programme);
    input.label = String(data.programme);
    input.email = String(data.advisorEmail || input.email || "").trim() || undefined;
  }
  return input;
}

function validateReferenceRecord(record: Partial<ReferenceRecord> & { kind: ReferenceKind }) {
  if (record.email && !emailPattern.test(record.email)) throw new Error("Invalid email address.");
  if (record.kind === "crn" && !record.key?.trim()) throw new Error("CRN is required.");
  if (record.kind === "course" && !record.data?.courseCode) throw new Error("Course code is required.");
  if ((record.kind === "advisor" || record.kind === "lecturer") && !record.email) throw new Error("Email is required.");
  if (record.kind === "lecturer" && record.active === false && record.data?.assigned === true) {
    throw new Error("Inactive lecturers cannot receive assignments.");
  }
}

function recordToDbData(record: ReferenceRecord) {
  return {
    key: record.key,
    label: record.label,
    email: record.email,
    data: record.data
  };
}

export function referenceRecordFromDbRow(row: Record<string, unknown>): ReferenceRecord {
  const data = row.data as {
    key?: string;
    label?: string;
    email?: string;
    data?: ReferenceRecord["data"];
  };
  const nestedData = data.data || {};
  return {
    id: String(row.id),
    kind: row.kind as ReferenceKind,
    key: String(data.key || nestedData.key || ""),
    label: String(data.label || nestedData.label || ""),
    email: data.email || undefined,
    active: Boolean(row.active),
    archived: Boolean(row.archived),
    data: nestedData,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
