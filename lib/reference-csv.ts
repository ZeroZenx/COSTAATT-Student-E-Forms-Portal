import type { ReferenceKind, ReferenceRecord } from "./reference-admin";

export const REFERENCE_KINDS: ReferenceKind[] = ["course", "crn", "lecturer", "advisor", "programme_mapping"];

export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  course: "Courses",
  crn: "CRNs",
  lecturer: "Lecturers",
  advisor: "Advisors",
  programme_mapping: "Programme mappings"
};

type Manifest = {
  columns: string[];
  required: string[];
  optional: string[];
  instructions: string[];
};

const manifests: Record<ReferenceKind, Manifest> = {
  course: {
    columns: ["id", "courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole", "active", "archived"],
    required: ["courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole", "active"],
    optional: ["id", "archived"],
    instructions: ["Required: courseCode, courseTitle, reviewerName, reviewerEmail, reviewerRole, active.", "Optional: id, archived.", "courseCode is the case-insensitive identity key.", "reviewerEmail must match an active application lecturer/advisor for new or changed rows.", "active must be true or false; archived is an optional administrative state and must remain inactive.", "The downloaded template includes one EXAMPLE row. Replace every REPLACE_WITH_* value before uploading; the unchanged example row is intentionally rejected for safety."]
  },
  crn: {
    columns: ["id", "crn", "courseCode", "courseTitle", "department", "campus", "section", "term", "source", "reviewerName", "reviewerEmail", "reviewerRole", "active", "archived"],
    required: ["crn", "courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole", "active"],
    optional: ["id", "department", "campus", "section", "term", "source", "archived"],
    instructions: ["Required: crn, courseCode, courseTitle, reviewerName, reviewerEmail, reviewerRole, active.", "Optional: id, department, campus, section, term, source, archived.", "crn is the case-insensitive identity key.", "courseCode must resolve to an active Course.", "reviewerEmail must resolve to an active Lecturer or Advisor; routing remains email-derived.", "active must be true or false; archived is an optional administrative state and must remain inactive.", "The downloaded template includes one EXAMPLE row. Replace every REPLACE_WITH_* value before uploading; the unchanged example row is intentionally rejected for safety."]
  },
  lecturer: {
    columns: ["id", "name", "email", "active", "archived"],
    required: ["name", "email", "active"],
    optional: ["id", "archived"],
    instructions: ["Required: name, email, active.", "Optional: id, archived.", "email is the case-insensitive identity key and authenticated reviewer match.", "active must be true or false; archived is an optional administrative state and must remain inactive.", "The downloaded template includes one EXAMPLE row. Replace every REPLACE_WITH_* value before uploading; the unchanged example row is intentionally rejected for safety."]
  },
  advisor: {
    columns: ["id", "name", "email", "active", "archived"],
    required: ["name", "email", "active"],
    optional: ["id", "archived"],
    instructions: ["Required: name, email, active.", "Optional: id, archived.", "email is the case-insensitive identity key and authenticated reviewer match.", "active must be true or false; archived is an optional administrative state and must remain inactive.", "The downloaded template includes one EXAMPLE row. Replace every REPLACE_WITH_* value before uploading; the unchanged example row is intentionally rejected for safety."]
  },
  programme_mapping: {
    columns: ["id", "programme", "advisorName", "advisorEmail", "active", "archived"],
    required: ["programme", "advisorName", "advisorEmail", "active"],
    optional: ["id", "archived"],
    instructions: ["Required: programme, advisorName, advisorEmail, active.", "Optional: id, archived.", "programme is the case-insensitive identity key.", "advisorEmail is retained as the application mapping value; it must be a valid email.", "active must be true or false; archived is an optional administrative state and must remain inactive.", "The downloaded template includes one EXAMPLE row. Replace every REPLACE_WITH_* value before uploading; the unchanged example row is intentionally rejected for safety."]
  }
};

const templateExamples: Record<ReferenceKind, Record<string, string>> = {
  course: {
    id: "",
    courseCode: "REPLACE_WITH_COURSE_CODE",
    courseTitle: "REPLACE_WITH_COURSE_TITLE",
    reviewerName: "REPLACE_WITH_REVIEWER_NAME",
    reviewerEmail: "REPLACE_WITH_VALID_EMAIL",
    reviewerRole: "REPLACE_WITH_LECTURER_OR_ADVISOR",
    active: "REPLACE_WITH_TRUE_OR_FALSE",
    archived: "false"
  },
  crn: {
    id: "",
    crn: "REPLACE_WITH_CRN",
    courseCode: "REPLACE_WITH_COURSE_CODE",
    courseTitle: "REPLACE_WITH_COURSE_TITLE",
    department: "REPLACE_WITH_DEPARTMENT",
    campus: "REPLACE_WITH_CAMPUS",
    section: "REPLACE_WITH_SECTION",
    term: "REPLACE_WITH_TERM",
    source: "REPLACE_WITH_SOURCE",
    reviewerName: "REPLACE_WITH_REVIEWER_NAME",
    reviewerEmail: "REPLACE_WITH_VALID_EMAIL",
    reviewerRole: "REPLACE_WITH_LECTURER_OR_ADVISOR",
    active: "REPLACE_WITH_TRUE_OR_FALSE",
    archived: "false"
  },
  lecturer: {
    id: "",
    name: "REPLACE_WITH_LECTURER_NAME",
    email: "REPLACE_WITH_VALID_EMAIL",
    active: "REPLACE_WITH_TRUE_OR_FALSE",
    archived: "false"
  },
  advisor: {
    id: "",
    name: "REPLACE_WITH_ADVISOR_NAME",
    email: "REPLACE_WITH_VALID_EMAIL",
    active: "REPLACE_WITH_TRUE_OR_FALSE",
    archived: "false"
  },
  programme_mapping: {
    id: "",
    programme: "REPLACE_WITH_PROGRAMME",
    advisorName: "REPLACE_WITH_ADVISOR_NAME",
    advisorEmail: "REPLACE_WITH_VALID_EMAIL",
    active: "REPLACE_WITH_TRUE_OR_FALSE",
    archived: "false"
  }
};

export type ImportReferenceInput = {
  id?: string;
  kind: ReferenceKind;
  key: string;
  label: string;
  email?: string;
  active: boolean;
  archived?: boolean;
  data: Record<string, string | boolean | number | undefined>;
};

export type ParsedCsvRow = { rowNumber: number; values: Record<string, string> };

export function referenceManifest(kind: ReferenceKind) {
  return manifests[kind];
}

export function referenceColumns(kind: ReferenceKind) {
  return [...manifests[kind].columns];
}

export function referenceInstructions(kind: ReferenceKind) {
  return [...manifests[kind].instructions];
}

export function parseCsv(text: string, kind: ReferenceKind, maxRows: number, maxFieldLength = 5000): ParsedCsvRow[] {
  const normalizedText = text.replace(/^\uFEFF/, "");
  if (normalizedText.includes("\u0000")) throw new Error("CSV contains an invalid null character.");
  const matrix = parseCsvMatrix(normalizedText, maxRows + 1, maxFieldLength);
  if (matrix.length === 0 || matrix[0].every((cell) => !cell.trim())) throw new Error("CSV must include a header row.");

  const headers = matrix[0].map((header) => unprotectImportedCell(header).trim());
  const seen = new Set<string>();
  for (const header of headers) {
    const normalized = header.toLowerCase();
    if (!normalized) throw new Error("CSV contains an empty column name.");
    if (seen.has(normalized)) throw new Error(`CSV contains duplicate column name: ${header}.`);
    seen.add(normalized);
  }

  const manifest = manifests[kind];
  const expected = new Set(manifest.columns.map((column) => column.toLowerCase()));
  const unexpected = headers.filter((header) => !expected.has(header.toLowerCase()));
  if (unexpected.length > 0) throw new Error(`CSV contains unexpected column(s): ${unexpected.join(", ")}.`);
  const missing = manifest.required.filter((column) => !seen.has(column.toLowerCase()));
  if (missing.length > 0) throw new Error(`CSV is missing required column(s): ${missing.join(", ")}.`);

  const rows = matrix.slice(1);
  if (rows.length > maxRows) throw new Error(`CSV exceeds the maximum of ${maxRows.toLocaleString()} rows.`);
  return rows.map((cells, index) => {
    if (cells.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`);
    const values = Object.fromEntries(headers.map((header, cellIndex) => [header, unprotectImportedCell(cells[cellIndex]).trim()]));
    return { rowNumber: index + 2, values };
  }).filter((row) => Object.values(row.values).some(Boolean));
}

export function normalizeImportRow(kind: ReferenceKind, row: ParsedCsvRow): ImportReferenceInput {
  const value = (name: string) => row.values[name] ?? row.values[Object.keys(row.values).find((key) => key.toLowerCase() === name.toLowerCase()) || name] ?? "";
  const id = value("id");
  const active = parseActive(value("active"), row.rowNumber);
  const archived = parseArchived(value("archived"), row.rowNumber);
  if (id && !isUuid(id)) throw new Error(`Row ${row.rowNumber}: id must be a UUID.`);

  if (kind === "course") {
    const courseCode = value("courseCode").trim().toUpperCase();
    const courseTitle = value("courseTitle").trim();
    const reviewerName = value("reviewerName").trim();
    const reviewerEmail = value("reviewerEmail").trim().toLowerCase();
    const reviewerRole = value("reviewerRole").trim().toLowerCase();
    requireValue(courseCode, "courseCode", row.rowNumber);
    requireValue(courseTitle, "courseTitle", row.rowNumber);
    if (reviewerRole) requireRole(reviewerRole, row.rowNumber);
    if (reviewerEmail) validateEmail(reviewerEmail, row.rowNumber, "reviewerEmail");
    return { id: id || undefined, kind, key: courseCode, label: courseTitle, email: reviewerEmail, active, archived, data: { courseCode, courseTitle, reviewerName, reviewerEmail, reviewerRole } };
  }

  if (kind === "crn") {
    const crn = value("crn").trim();
    const courseCode = value("courseCode").trim().toUpperCase();
    const courseTitle = value("courseTitle").trim();
    const reviewerName = value("reviewerName").trim();
    const reviewerEmail = value("reviewerEmail").trim().toLowerCase();
    const reviewerRole = value("reviewerRole").trim().toLowerCase();
    requireValue(crn, "crn", row.rowNumber);
    requireValue(courseCode, "courseCode", row.rowNumber);
    requireValue(courseTitle, "courseTitle", row.rowNumber);
    if (reviewerRole) requireRole(reviewerRole, row.rowNumber);
    if (reviewerEmail) validateEmail(reviewerEmail, row.rowNumber, "reviewerEmail");
    const optional = ["department", "campus", "section", "term", "source"];
    const data: ImportReferenceInput["data"] = { crn, courseCode, courseTitle, reviewerName, reviewerEmail, reviewerRole };
    optional.forEach((field) => { const current = value(field); if (current) data[field] = current; });
    return { id: id || undefined, kind, key: crn, label: courseTitle || `${crn} - ${courseCode}`, email: reviewerEmail, active, archived, data };
  }

  if (kind === "lecturer" || kind === "advisor") {
    const name = value("name").trim();
    const email = value("email").trim().toLowerCase();
    requireValue(name, "name", row.rowNumber);
    requireValue(email, "email", row.rowNumber);
    validateEmail(email, row.rowNumber, "email");
    return { id: id || undefined, kind, key: email, label: name, email, active, archived, data: { name, email } };
  }

  const programme = value("programme").trim();
  const advisorName = value("advisorName").trim();
  const advisorEmail = value("advisorEmail").trim().toLowerCase();
  if (!programme && !id) requireValue(programme, "programme", row.rowNumber);
  if (!id) {
    requireValue(advisorName, "advisorName", row.rowNumber);
    requireValue(advisorEmail, "advisorEmail", row.rowNumber);
  }
  if (advisorEmail) validateEmail(advisorEmail, row.rowNumber, "advisorEmail");
  return { id: id || undefined, kind, key: programme, label: programme, email: advisorEmail, active, archived, data: { programme, advisorName, advisorEmail } };
}

export function inputToCsvRow(kind: ReferenceKind, record: ReferenceRecord | ImportReferenceInput) {
  const data = record.data || {};
  const value = (name: string) => String(data[name] ?? "");
  if (kind === "course") return { id: record.id || "", courseCode: value("courseCode") || record.key, courseTitle: value("courseTitle") || record.label, reviewerName: value("reviewerName"), reviewerEmail: value("reviewerEmail") || record.email || "", reviewerRole: value("reviewerRole"), active: String(record.active), archived: String(record.archived ?? false) };
  if (kind === "crn") return { id: record.id || "", crn: value("crn") || record.key, courseCode: value("courseCode"), courseTitle: value("courseTitle") || record.label, department: value("department"), campus: value("campus"), section: value("section"), term: value("term"), source: value("source"), reviewerName: value("reviewerName"), reviewerEmail: value("reviewerEmail") || record.email || "", reviewerRole: value("reviewerRole"), active: String(record.active), archived: String(record.archived ?? false) };
  if (kind === "lecturer" || kind === "advisor") return { id: record.id || "", name: value("name") || record.label, email: value("email") || record.email || record.key, active: String(record.active), archived: String(record.archived ?? false) };
  return { id: record.id || "", programme: value("programme") || record.key, advisorName: value("advisorName"), advisorEmail: value("advisorEmail") || record.email || "", active: String(record.active), archived: String(record.archived ?? false) };
}

export function csvSerialize(kind: ReferenceKind, rows: Array<ReferenceRecord | ImportReferenceInput>) {
  const columns = referenceColumns(kind);
  const lines = [columns.join(",")];
  for (const record of rows) {
    const values = inputToCsvRow(kind, record);
    lines.push(columns.map((column) => escapeCsvCell(String(values[column as keyof typeof values] ?? ""))).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function emptyTemplate(kind: ReferenceKind) {
  const columns = referenceColumns(kind);
  const example = templateExamples[kind];
  return `${columns.join(",")}\r\n${columns.map((column) => escapeCsvCell(example[column] || "")).join(",")}\r\n`;
}

export function escapeCsvCell(value: string) {
  const formulaSafe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(formulaSafe) ? `"${formulaSafe.replace(/"/g, '""')}"` : formulaSafe;
}

export function unprotectImportedCell(value: string) {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function parseCsvMatrix(text: string, maxRows: number, maxFieldLength: number) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ",") { ensureFieldLength(cell, maxFieldLength); row.push(cell); cell = ""; }
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      ensureFieldLength(cell, maxFieldLength); row.push(cell); rows.push(row); row = []; cell = "";
      if (rows.length > maxRows) throw new Error("CSV exceeds the maximum row limit.");
    } else cell += character;
    if (cell.length > maxFieldLength) throw new Error(`CSV field exceeds the maximum length of ${maxFieldLength} characters.`);
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (cell.length || row.length) { ensureFieldLength(cell, maxFieldLength); row.push(cell); rows.push(row); }
  return rows;
}

function ensureFieldLength(value: string, max: number) { if (value.length > max) throw new Error(`CSV field exceeds the maximum length of ${max} characters.`); }
function requireValue(value: string, field: string, row: number) { if (!value) throw new Error(`Row ${row}: ${field} is required.`); }
function validateEmail(value: string, row: number, field: string) { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`Row ${row}: ${field} is not a valid email address.`); }
function requireRole(value: string, row: number) { if (value !== "lecturer" && value !== "advisor") throw new Error(`Row ${row}: reviewerRole must be lecturer or advisor.`); }
function parseActive(value: string, row: number) { const normalized = value.toLowerCase(); if (normalized === "true" || normalized === "1" || normalized === "yes") return true; if (normalized === "false" || normalized === "0" || normalized === "no") return false; throw new Error(`Row ${row}: active must be true or false.`); }
function parseArchived(value: string, row: number) { const normalized = value.toLowerCase(); if (!normalized) return undefined; if (normalized === "true" || normalized === "1" || normalized === "yes") return true; if (normalized === "false" || normalized === "0" || normalized === "no") return false; throw new Error(`Row ${row}: archived must be true or false.`); }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
