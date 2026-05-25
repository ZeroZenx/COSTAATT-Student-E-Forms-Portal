import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { advisorOptions, courseAdvisorOptions, programmeOptions } from "./reference-data";

export type ReferenceKind = "course" | "crn" | "lecturer" | "advisor" | "programme_mapping";

export type ReferenceRecord = {
  id: string;
  kind: ReferenceKind;
  key: string;
  label: string;
  email?: string;
  active: boolean;
  data: Record<string, string | boolean | undefined>;
  createdAt: string;
  updatedAt: string;
};

const localReferencePath = path.join(process.cwd(), "data", "reference-records.json");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      advisorName: item.advisorName,
      advisorEmail: item.advisorEmail
    },
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
  return [...courses, ...advisors, ...programmes];
}

async function readReferenceRecords() {
  try {
    return JSON.parse(await readFile(localReferencePath, "utf8")) as ReferenceRecord[];
  } catch {
    const records = seedRecords();
    await writeReferenceRecords(records);
    return records;
  }
}

async function writeReferenceRecords(records: ReferenceRecord[]) {
  await mkdir(path.dirname(localReferencePath), { recursive: true });
  await writeFile(localReferencePath, JSON.stringify(records, null, 2));
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
  validateReferenceRecord(input);
  const records = await readReferenceRecords();
  const duplicate = records.find((record) => {
    return record.id !== input.id && record.kind === input.kind && record.key.toLowerCase() === input.key.toLowerCase() && record.active;
  });
  if (duplicate) throw new Error(`Duplicate ${input.kind.replace("_", " ")} records are not allowed.`);

  const now = new Date().toISOString();
  const index = input.id ? records.findIndex((record) => record.id === input.id) : -1;
  const next: ReferenceRecord = {
    id: input.id || crypto.randomUUID(),
    kind: input.kind,
    key: input.key,
    label: input.label,
    email: input.email,
    active: input.active ?? true,
    data: input.data || {},
    createdAt: index >= 0 ? records[index].createdAt : now,
    updatedAt: now
  };

  if (index >= 0) records[index] = next;
  else records.unshift(next);
  await writeReferenceRecords(records);
  return next;
}

export async function deactivateReferenceRecord(id: string, linkedToSubmission = false) {
  if (linkedToSubmission) throw new Error("Linked reference records cannot be deleted; deactivate them instead.");
  const records = await readReferenceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], active: false, updatedAt: new Date().toISOString() };
  await writeReferenceRecords(records);
  return records[index];
}

function validateReferenceRecord(record: Partial<ReferenceRecord> & { kind: ReferenceKind }) {
  if (record.email && !emailPattern.test(record.email)) throw new Error("Invalid email address.");
  if (record.kind === "crn" && !record.key?.trim()) throw new Error("CRN is required.");
  if (record.kind === "lecturer" && record.active === false && record.data?.assigned === true) {
    throw new Error("Inactive lecturers cannot receive assignments.");
  }
}
