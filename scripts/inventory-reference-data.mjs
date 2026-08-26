import fs from "node:fs";
import { Client } from "pg";

if (!process.env.DATABASE_URL && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const expected = {
  course: new Set(["courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole"]),
  crn: new Set(["crn", "courseCode", "courseTitle", "department", "campus", "section", "term", "source", "reviewerName", "reviewerEmail", "reviewerRole"]),
  lecturer: new Set(["name", "email"]),
  advisor: new Set(["name", "email"]),
  programme_mapping: new Set(["programme", "advisorName", "advisorEmail"])
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await client.query("select id, kind, data, active, updated_at from reference_records order by kind, id");
  const rows = result.rows.map((row) => ({ ...row, wrapper: row.data || {}, nested: row.data?.data || {} }));
  const byKind = Object.fromEntries(Object.keys(expected).map((kind) => [kind, rows.filter((row) => row.kind === kind)]));
  const paths = {};
  const unknownLegacy = {};
  for (const [kind, items] of Object.entries(byKind)) {
    const pathSet = new Set(["data"]);
    const unknown = [];
    for (const item of items) {
      Object.keys(item.wrapper).forEach((key) => pathSet.add(`data.${key}`));
      Object.keys(item.nested).forEach((key) => { pathSet.add(`data.${key}`); if (!expected[kind].has(key)) unknown.push({ id: item.id, field: key }); });
    }
    paths[kind] = [...pathSet].sort();
    unknownLegacy[kind] = unknown;
  }
  const activeNaturalDuplicates = duplicateGroups(rows.filter((row) => row.active));
  const caseOnlyDuplicates = activeNaturalDuplicates.filter((group) => new Set(group.values).size > 1);
  const missingKeys = rows.filter((row) => !String(row.wrapper.key || row.nested.key || "").trim()).map((row) => ({ id: row.id, kind: row.kind, active: row.active }));
  const courseKeys = new Set(byKind.course.filter((row) => row.active).map((row) => String(row.nested.courseCode || row.wrapper.key || "").trim().toLowerCase()));
  const reviewerByEmail = new Map();
  for (const row of rows.filter((item) => ["lecturer", "advisor"].includes(item.kind))) {
    const email = String(row.wrapper.email || row.nested.email || row.wrapper.key || "").trim().toLowerCase();
    reviewerByEmail.set(email, [...(reviewerByEmail.get(email) || []), row]);
  }
  const orphanCrns = byKind.crn.filter((row) => row.active && !courseKeys.has(String(row.nested.courseCode || "").trim().toLowerCase())).map((row) => ({ id: row.id, crn: row.nested.crn || row.wrapper.key, courseCode: row.nested.courseCode }));
  const missingReviewer = [], missingReviewerEmail = [], inactiveReviewer = [], invalidEmails = [], inactiveAssignments = [], roleMismatches = [];
  for (const row of rows) {
    for (const field of ["email", "reviewerEmail", "advisorEmail"]) {
      const value = row.wrapper[field] || row.nested[field];
      if (value && !emailPattern.test(String(value))) invalidEmails.push({ id: row.id, kind: row.kind, field, value });
    }
    if (["course", "crn"].includes(row.kind) && row.active) {
      const email = String(row.nested.reviewerEmail || row.wrapper.email || "").trim().toLowerCase();
      if (!email) { missingReviewerEmail.push({ id: row.id, kind: row.kind, identifier: row.nested.crn || row.nested.courseCode }); continue; }
      const candidates = reviewerByEmail.get(email) || [];
      const reviewer = candidates.find((item) => item.active);
      if (!reviewer && candidates.length === 0) missingReviewer.push({ id: row.id, kind: row.kind, identifier: row.nested.crn || row.nested.courseCode, reviewerEmail: email });
      if (!reviewer && candidates.length > 0) inactiveReviewer.push({ id: row.id, kind: row.kind, identifier: row.nested.crn || row.nested.courseCode, reviewerEmail: email, reviewerId: candidates[0].id });
      const declaredKind = String(row.nested.reviewerRole || "").toLowerCase();
      if (reviewer && (declaredKind === "lecturer" || declaredKind === "advisor") && !candidates.some((item) => item.active && item.kind === declaredKind)) roleMismatches.push({ id: row.id, kind: row.kind, reviewerEmail: email, declaredRole: row.nested.reviewerRole, recordKind: reviewer.kind });
      if (!reviewer && candidates.some((item) => !item.active)) inactiveAssignments.push({ id: row.id, kind: row.kind, reviewerEmail: email, reviewerId: candidates.find((item) => !item.active).id });
    }
  }
  console.log(JSON.stringify({ totalRows: rows.length, counts: Object.fromEntries(Object.entries(byKind).map(([kind, items]) => [kind, { total: items.length, active: items.filter((row) => row.active).length, inactive: items.filter((row) => !row.active).length }])), distinctJsonPathsByKind: paths, unknownLegacyFields: unknownLegacy, activeNaturalKeyDuplicates: activeNaturalDuplicates, caseOnlyDuplicates, missingKeys, orphanActiveCrns: orphanCrns, crnsMissingReviewerEmail: missingReviewerEmail, crnsMissingReviewer: missingReviewer, crnsReferencingInactiveReviewer: inactiveReviewer, invalidReviewerEmails: invalidEmails, inactiveReviewerAssignments: inactiveAssignments, reviewerRoleMismatches: roleMismatches }, null, 2));
} finally {
  await client.end();
}

function duplicateGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.wrapper.key || row.nested.key || row.nested.email || row.nested.crn || row.nested.programme || "").trim();
    const groupKey = `${row.kind}:${key.toLowerCase()}`;
    groups.set(groupKey, [...(groups.get(groupKey) || []), { id: row.id, value: key }]);
  }
  return [...groups.entries()].filter(([, values]) => values.length > 1).map(([key, values]) => ({ key, values: values.map((item) => item.value), ids: values.map((item) => item.id) }));
}
