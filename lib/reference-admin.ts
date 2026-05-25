import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hasDatabase, query } from "./db";
import { courseCatalogOptions } from "./course-catalog-data";
import {
  advisorOptions,
  courseAdvisorOptions,
  normalizeCourseMatch,
  programmeOptions,
  type CourseLookupField,
  type CourseLookupMatch
} from "./reference-data";

export type ReferenceKind = "course" | "crn" | "lecturer" | "advisor" | "programme_mapping";

export type ReferenceRecord = {
  id: string;
  kind: ReferenceKind;
  key: string;
  label: string;
  email?: string;
  active: boolean;
  data: Record<string, string | boolean | number | undefined>;
  createdAt: string;
  updatedAt: string;
};

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

  try {
    return JSON.parse(await readFile(localReferencePath(), "utf8")) as ReferenceRecord[];
  } catch {
    const records = seedRecords();
    await writeReferenceRecords(records);
    return records;
  }
}

async function readDbReferenceRecords() {
  const result = await query(
    `select id, kind, data, active, created_at, updated_at
     from reference_records
     order by updated_at desc`
  );
  if (result.rows.length > 0) return result.rows.map(rowToReferenceRecord);

  const records = seedRecords();
  await seedDbReferenceRecords(records);
  return records;
}

async function seedDbReferenceRecords(records: ReferenceRecord[]) {
  for (const record of records) {
    await query(
      `insert into reference_records (id, kind, data, active, created_at, updated_at)
       values ($1, $2, $3::jsonb, $4, $5, $6)
       on conflict do nothing`,
      [
        record.id,
        record.kind,
        JSON.stringify(recordToDbData(record)),
        record.active,
        record.createdAt,
        record.updatedAt
      ]
    );
  }
}

async function writeReferenceRecords(records: ReferenceRecord[]) {
  const storePath = localReferencePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(records, null, 2));
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
  const records = await readReferenceRecords();
  ensureReviewerIsAssignable(normalized, records);
  const duplicate = records.find((record) => {
    return record.id !== normalized.id && record.kind === normalized.kind && record.key.toLowerCase() === normalized.key.toLowerCase() && record.active;
  });
  if (duplicate) throw new Error(`Duplicate ${normalized.kind.replace("_", " ")} records are not allowed.`);

  const now = new Date().toISOString();
  const index = normalized.id ? records.findIndex((record) => record.id === normalized.id) : -1;
  const next: ReferenceRecord = {
    id: normalized.id || crypto.randomUUID(),
    kind: normalized.kind,
    key: normalized.key,
    label: normalized.label,
    email: normalized.email,
    active: normalized.active ?? true,
    data: normalized.data || {},
    createdAt: index >= 0 ? records[index].createdAt : now,
    updatedAt: now
  };

  if (hasDatabase()) {
    const result = await query(
      `insert into reference_records (id, kind, data, active, created_at, updated_at)
       values ($1, $2, $3::jsonb, $4, $5, $6)
       on conflict (id) do update set
         kind = excluded.kind,
         data = excluded.data,
         active = excluded.active,
         updated_at = excluded.updated_at
       returning id, kind, data, active, created_at, updated_at`,
      [
        next.id,
        next.kind,
        JSON.stringify(recordToDbData(next)),
        next.active,
        next.createdAt,
        next.updatedAt
      ]
    );
    return rowToReferenceRecord(result.rows[0]);
  }

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
      `select id, kind, data, active, created_at, updated_at
       from reference_records
       where id = $1`,
      [id]
    );
    return result.rows[0] ? rowToReferenceRecord(result.rows[0]) : null;
  }

  return (await readReferenceRecords()).find((record) => record.id === id) || null;
}

export async function deactivateReferenceRecord(id: string, linkedToSubmission = false) {
  if (linkedToSubmission) throw new Error("Linked reference records cannot be deleted; deactivate them instead.");
  if (hasDatabase()) {
    const result = await query(
      `update reference_records
       set active = false,
           updated_at = $2
       where id = $1
       returning id, kind, data, active, created_at, updated_at`,
      [id, new Date().toISOString()]
    );
    return result.rows[0] ? rowToReferenceRecord(result.rows[0]) : null;
  }

  const records = await readReferenceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], active: false, updatedAt: new Date().toISOString() };
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

function rowToReferenceRecord(row: Record<string, unknown>): ReferenceRecord {
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
    data: nestedData,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
