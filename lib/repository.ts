import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Pool } from "pg";
import type { AdminPatch, SubmissionPayload, SubmissionRecord, SsoUser } from "./types";

let pool: Pool | null = null;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function db() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

const localStorePath = path.join(process.cwd(), "data", "submissions.json");

async function readLocal(): Promise<SubmissionRecord[]> {
  try {
    return JSON.parse(await readFile(localStorePath, "utf8")) as SubmissionRecord[];
  } catch {
    return [];
  }
}

async function writeLocal(records: SubmissionRecord[]) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(records, null, 2));
}

export async function createSubmission(
  user: SsoUser,
  payload: SubmissionPayload,
  attachment?: SubmissionRecord["attachment"]
) {
  const now = new Date().toISOString();
  const record: SubmissionRecord = {
    id: crypto.randomUUID(),
    formType: payload.formType,
    status: "submitted",
    student: user,
    payload,
    attachment,
    createdAt: now,
    updatedAt: now
  };

  if (hasDatabase()) {
    await db().query(
      `insert into submissions
        (id, form_type, status, student, payload, attachment, created_at, updated_at)
       values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)`,
      [
        record.id,
        record.formType,
        record.status,
        JSON.stringify(record.student),
        JSON.stringify(record.payload),
        JSON.stringify(record.attachment || null),
        record.createdAt,
        record.updatedAt
      ]
    );
  } else {
    const records = await readLocal();
    records.unshift(record);
    await writeLocal(records);
  }

  return record;
}

export async function listStudentSubmissions(studentId: string) {
  if (hasDatabase()) {
    const result = await db().query(
      `select id, form_type, status, student, payload, attachment, admin_comment, created_at, updated_at
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
    const result = await db().query(
      `select id, form_type, status, student, payload, attachment, admin_comment, created_at, updated_at
       from submissions
       order by created_at desc`
    );
    return result.rows.map(rowToRecord);
  }

  return readLocal();
}

export async function getSubmission(id: string) {
  if (hasDatabase()) {
    const result = await db().query(
      `select id, form_type, status, student, payload, attachment, admin_comment, created_at, updated_at
       from submissions
       where id = $1`,
      [id]
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  return (await readLocal()).find((record) => record.id === id) || null;
}

export async function updateSubmission(id: string, patch: AdminPatch) {
  const updatedAt = new Date().toISOString();

  if (hasDatabase()) {
    const result = await db().query(
      `update submissions
       set status = coalesce($2, status),
           admin_comment = coalesce($3, admin_comment),
           updated_at = $4
       where id = $1
       returning id, form_type, status, student, payload, attachment, admin_comment, created_at, updated_at`,
      [id, patch.status || null, patch.adminComment || null, updatedAt]
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  const records = await readLocal();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = {
    ...records[index],
    ...patch,
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
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
