import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { classifyReferenceImport } from "../lib/reference-import";
import { csvSerialize, emptyTemplate, normalizeImportRow, parseCsv, referenceColumns } from "../lib/reference-csv";
import { isRegistryAdmin } from "../lib/auth";
import type { SsoUser } from "../lib/types";
import type { ReferenceRecord } from "../lib/reference-admin";

const now = "2026-08-25T00:00:00.000Z";
function record(partial: Partial<ReferenceRecord> & Pick<ReferenceRecord, "kind" | "key" | "label">): ReferenceRecord {
  return { id: crypto.randomUUID(), email: undefined, active: true, archived: false, data: {}, createdAt: now, updatedAt: now, ...partial };
}

const lecturer = record({ kind: "lecturer", key: "lecturer@costaatt.edu.tt", label: "Lecturer", email: "lecturer@costaatt.edu.tt", data: { name: "Lecturer", email: "lecturer@costaatt.edu.tt" } });
const advisor = record({ kind: "advisor", key: "advisor@costaatt.edu.tt", label: "Advisor", email: "advisor@costaatt.edu.tt", data: { name: "Advisor", email: "advisor@costaatt.edu.tt" } });
const course = record({ kind: "course", key: "COMP 101", label: "Introduction to Computing", data: { courseCode: "COMP 101", courseTitle: "Introduction to Computing", reviewerName: "Lecturer", reviewerEmail: lecturer.email, reviewerRole: "lecturer" } });
const secondCourse = record({ kind: "course", key: "MATH 101", label: "Mathematics", data: { courseCode: "MATH 101", courseTitle: "Mathematics", reviewerName: "Advisor", reviewerEmail: advisor.email, reviewerRole: "advisor" } });

describe("reference CSV manifests", () => {
  it.each(["course", "crn", "lecturer", "advisor", "programme_mapping"] as const)("provides a current-data round-trip manifest for %s", (kind) => {
    const columns = referenceColumns(kind);
    const templateLines = emptyTemplate(kind).trim().split(/\r?\n/);
    expect(templateLines[0]).toBe(columns.join(","));
    expect(templateLines).toHaveLength(2);
    expect(templateLines[1]).toContain("REPLACE_WITH_");
    expect(columns).toContain("active");
  });

  it.each(["course", "crn", "lecturer", "advisor", "programme_mapping"] as const)("rejects the unchanged safety example for %s", (kind) => {
    const rows = parseCsv(emptyTemplate(kind), kind, 10);
    expect(rows).toHaveLength(1);
    expect(() => normalizeImportRow(kind, rows[0])).toThrow();
  });

  it("parses quoted CSV, UTF-8 BOM and safe formula prefixes", () => {
    const rows = parseCsv("\uFEFFname,email,active\r\n'=SUM(A1),person@example.com,true\r\n", "lecturer", 10);
    expect(rows[0].values.name).toBe("=SUM(A1)");
    expect(normalizeImportRow("lecturer", rows[0]).data.name).toBe("=SUM(A1)");
  });

  it("round-trips the administrative archive state without allowing active archived rows", () => {
    const rows = parseCsv("name,email,active,archived\r\nArchived reviewer,person@example.com,false,true\r\n", "lecturer", 10);
    const normalized = normalizeImportRow("lecturer", rows[0]);
    expect(normalized.archived).toBe(true);
    expect(csvSerialize("lecturer", [normalized])).toContain("false,true");
    const invalid = classifyReferenceImport("lecturer", parseCsv("name,email,active,archived\r\nBad,other@example.com,true,true\r\n", "lecturer", 10), [lecturer]);
    expect(invalid[0].status).toBe("invalid");
    expect(invalid[0].errors).toContain("Archived reference records must be inactive.");
  });

  it("rejects duplicate and unexpected headers", () => {
    expect(() => parseCsv("email,Email,name,active\na,b,c,true", "lecturer", 10)).toThrow(/duplicate/i);
    expect(() => parseCsv("name,email,active,extra\na,a@example.com,true,x", "lecturer", 10)).toThrow(/unexpected/i);
  });

  it("exports formula-like values with an import-safe prefix", () => {
    const csv = csvSerialize("lecturer", [record({ kind: "lecturer", key: "person@example.com", label: "=HYPERLINK(\"x\")", email: "person@example.com", data: { name: "=HYPERLINK(\"x\")", email: "person@example.com" } })]);
    expect(csv).toContain("'=HYPERLINK");
    expect(parseCsv(csv, "lecturer", 10)[0].values.name).toBe("=HYPERLINK(\"x\")");
  });
});

describe("reference import classification", () => {
  it.each([
    ["course", "courseCode,courseTitle,reviewerName,reviewerEmail,reviewerRole,active\nNEW 101,New Course,Advisor,advisor@costaatt.edu.tt,advisor,true"],
    ["crn", "crn,courseCode,courseTitle,department,campus,section,term,source,reviewerName,reviewerEmail,reviewerRole,active\n99999,COMP 101,Introduction to Computing,Dept,Main,01,Term,Source,Lecturer,lecturer@costaatt.edu.tt,lecturer,true"],
    ["lecturer", "name,email,active\nNew Lecturer,new.lecturer@costaatt.edu.tt,true"],
    ["advisor", "name,email,active\nNew Advisor,new.advisor@costaatt.edu.tt,true"],
    ["programme_mapping", "programme,advisorName,advisorEmail,active\nNew Programme,Advisor,advisor@costaatt.edu.tt,true"]
  ] as const)("classifies a valid %s row as new", (kind, csv) => {
    const rows = classifyReferenceImport(kind, parseCsv(csv, kind, 10), [lecturer, advisor, course]);
    expect(rows[0]).toMatchObject({ status: "new", operation: "insert", errors: [] });
  });

  it("classifies new, unchanged and changed Course rows", () => {
    const parsed = parseCsv([
      "id,courseCode,courseTitle,reviewerName,reviewerEmail,reviewerRole,active",
      `,NEW 101,New Course,Advisor,${advisor.email},advisor,true`,
      `${course.id},COMP 101,Introduction to Computing,Lecturer,${lecturer.email},lecturer,true`,
      `${secondCourse.id},MATH 101,Changed Mathematics,Advisor,${advisor.email},advisor,true`
    ].join("\n"), "course", 10);
    const rows = classifyReferenceImport("course", parsed, [lecturer, advisor, course, secondCourse]);
    expect(rows.map((row) => row.status)).toEqual(["new", "unchanged", "update"]);
  });

  it("blocks duplicate database identity, missing CRN course and missing reviewer", () => {
    const parsed = parseCsv([
      "crn,courseCode,courseTitle,department,campus,section,term,source,reviewerName,reviewerEmail,reviewerRole,active",
      "100,NO COURSE,Course,Dept,Campus,01,Term,Source,Reviewer,missing@example.com,lecturer,true",
      "100,NO COURSE,Course,Dept,Campus,01,Term,Source,Reviewer,missing@example.com,lecturer,true"
    ].join("\n"), "crn", 10);
    const rows = classifyReferenceImport("crn", parsed, [lecturer, advisor, course]);
    expect(rows.every((row) => row.status === "conflict")).toBe(true);
    expect(rows[0].errors.join(" ")).toMatch(/duplicated/i);
  });

  it("preserves a legacy orphan only when unchanged and warns the administrator", () => {
    const orphan = record({ kind: "crn", key: "999", label: "Legacy", email: "missing@example.com", data: { crn: "999", courseCode: "MISSING 101", courseTitle: "Legacy", reviewerName: "Legacy", reviewerEmail: "missing@example.com", reviewerRole: "advisor" } });
    const parsed = parseCsv("id,crn,courseCode,courseTitle,department,campus,section,term,source,reviewerName,reviewerEmail,reviewerRole,active\n" + [orphan.id, "999", "MISSING 101", "Legacy", "", "", "", "", "", "Legacy", "missing@example.com", "advisor", "true"].join(","), "crn", 10);
    const rows = classifyReferenceImport("crn", parsed, [orphan]);
    expect(rows[0].status).toBe("unchanged");
    expect(rows[0].warnings.join(" ")).toMatch(/missing|inactive/i);
  });

  it("prevents deactivating an assigned reviewer", () => {
    const parsed = parseCsv("name,email,active\nLecturer,lecturer@costaatt.edu.tt,false", "lecturer", 10);
    const rows = classifyReferenceImport("lecturer", parsed, [lecturer, course]);
    expect(rows[0].status).toBe("invalid");
    expect(rows[0].errors.join(" ")).toMatch(/assigned/i);
  });

  it("rejects malformed CSV, invalid email, missing headers, and excessive rows", () => {
    expect(() => parseCsv('name,email,active\n"broken,person@example.com,true', "lecturer", 10)).toThrow(/unterminated/i);
    expect(() => normalizeImportRow("lecturer", { rowNumber: 2, values: { name: "Name", email: "bad", active: "true" } })).toThrow(/email/i);
    expect(() => parseCsv("name,email\nName,a@example.com", "lecturer", 10)).toThrow(/missing required/i);
    expect(() => parseCsv("name,email,active\nA,a@example.com,true\nB,b@example.com,true", "lecturer", 1)).toThrow(/maximum/i);
  });

  it("uses case-insensitive natural keys for duplicate detection", () => {
    const rows = classifyReferenceImport("lecturer", parseCsv("name,email,active\nOne,PERSON@example.com,true\nTwo,person@example.com,true", "lecturer", 10), []);
    expect(rows.every((row) => row.status === "conflict")).toBe(true);
  });
});

describe("reference administration authorization", () => {
  const identity = (roles: SsoUser["roles"]): SsoUser => ({ studentId: "id", firstName: "Test", lastName: "User", email: "test@example.com", roles });
  it.each([["student"], ["lecturer"], ["advisor"], ["registry_staff"]] as const)("does not grant bulk administration to %s", (role) => {
    expect(isRegistryAdmin(identity([role]))).toBe(false);
  });
  it.each([["registry_admin"], ["system_admin"]] as const)("grants bulk administration to %s", (role) => {
    expect(isRegistryAdmin(identity([role]))).toBe(true);
  });
});
