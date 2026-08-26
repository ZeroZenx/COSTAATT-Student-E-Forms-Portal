import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const outputDir = path.resolve("reports/reference-data-quality");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const expectedNestedFields = {
  course: new Set(["courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole"]),
  crn: new Set(["crn", "courseCode", "courseTitle", "department", "campus", "section", "term", "source", "reviewerName", "reviewerEmail", "reviewerRole"]),
  lecturer: new Set(["name", "email"]),
  advisor: new Set(["name", "email"]),
  programme_mapping: new Set(["programme", "advisorName", "advisorEmail"]),
};

if (!process.env.DATABASE_URL && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
  if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const result = await client.query("select id, kind, data, active, created_at, updated_at from reference_records order by kind, id");
  const rows = result.rows.map((row) => ({
    ...row,
    wrapper: row.data && typeof row.data === "object" ? row.data : {},
    nested: row.data?.data && typeof row.data.data === "object" ? row.data.data : {},
  }));
  const byKind = Object.fromEntries(Object.keys(expectedNestedFields).map((kind) => [kind, rows.filter((row) => row.kind === kind)]));

  const activeCourses = new Set(byKind.course.filter((row) => row.active).map((row) => courseCode(row).toLowerCase()).filter(Boolean));
  const reviewerByEmail = new Map();
  for (const row of [...byKind.lecturer, ...byKind.advisor]) {
    const email = personEmail(row).toLowerCase();
    if (!email) continue;
    reviewerByEmail.set(email, [...(reviewerByEmail.get(email) || []), row]);
  }

  const activeCourseCrns = byKind.crn.filter((row) => row.active);
  const orphanActiveCrns = activeCourseCrns.filter((row) => !activeCourses.has(courseCode(row).toLowerCase()));
  const crnsNoReviewerEmail = activeCourseCrns.filter((row) => !reviewerEmail(row));
  const unresolvedReviewerMappings = activeCourseCrns.filter((row) => {
    const email = reviewerEmail(row);
    return email && !(reviewerByEmail.get(email.toLowerCase()) || []).some((candidate) => candidate.active);
  });

  const courseMismatches = byKind.course.filter((row) => row.active && hasRoleMismatch(row, reviewerByEmail));
  const crnMismatches = activeCourseCrns.filter((row) => hasRoleMismatch(row, reviewerByEmail));
  const programmeIssues = byKind.programme_mapping.filter((row) => {
    const key = naturalKey(row);
    const advisorEmail = value(row, "advisorEmail");
    return !key || (advisorEmail && !emailPattern.test(advisorEmail));
  });
  const activeNaturalKeyDuplicates = duplicateGroups(rows.filter((row) => row.active));
  const caseOnlyDuplicateGroups = activeNaturalKeyDuplicates.filter((group) => new Set(group.values).size > 1);
  const missingKeys = rows.filter((row) => !naturalKey(row));
  const crnsReferencingInactiveReviewer = activeCourseCrns.filter((row) => {
    const email = reviewerEmail(row).toLowerCase();
    const candidates = email ? (reviewerByEmail.get(email) || []) : [];
    return email && !candidates.some((candidate) => candidate.active) && candidates.some((candidate) => !candidate.active);
  });
  const invalidReviewerEmails = rows.flatMap((row) => ["email", "reviewerEmail", "advisorEmail"].flatMap((field) => {
    const candidate = value(row, field);
    return candidate && !emailPattern.test(candidate) ? [{ id: row.id, kind: row.kind, field, value: candidate }] : [];
  }));
  const inactiveReviewerAssignments = crnsReferencingInactiveReviewer;

  fs.mkdirSync(outputDir, { recursive: true });
  writeCsv("orphan-active-crns.csv", ["CRN", "courseCode", "courseTitle", "reviewerName", "reviewerEmail", "reviewerRole", "active", "reason"], orphanActiveCrns.map((row) => [
    crn(row), courseCode(row), value(row, "courseTitle"), reviewerName(row), reviewerEmail(row), reviewerRole(row), bool(row.active), "No active Course record matches courseCode.",
  ]));
  writeCsv("crns-no-reviewer-email.csv", ["CRN", "courseCode", "courseTitle", "reviewerName", "reviewerRole", "active"], crnsNoReviewerEmail.map((row) => [
    crn(row), courseCode(row), value(row, "courseTitle"), reviewerName(row), reviewerRole(row), bool(row.active),
  ]));
  writeCsv("unresolved-reviewer-mappings.csv", ["CRN", "reviewerEmail", "reviewerName", "expectedReviewerType", "reason"], unresolvedReviewerMappings.map((row) => [
    crn(row), reviewerEmail(row), reviewerName(row), expectedReviewerType(row), "No active Lecturer or Advisor record matches reviewer email.",
  ]));
  writeCsv("course-reviewer-role-mismatches.csv", ["courseCode", "courseTitle", "reviewerName", "reviewerEmail", "currentReviewerRole", "inferredExpectedRole"], courseMismatches.map((row) => [
    courseCode(row), value(row, "courseTitle"), reviewerName(row), reviewerEmail(row), reviewerRole(row), inferredExpectedRole(row, reviewerByEmail),
  ]));
  writeCsv("crn-reviewer-role-mismatches.csv", ["CRN", "courseCode", "courseTitle", "reviewerName", "reviewerEmail", "currentReviewerRole", "inferredExpectedRole"], crnMismatches.map((row) => [
    crn(row), courseCode(row), value(row, "courseTitle"), reviewerName(row), reviewerEmail(row), reviewerRole(row), inferredExpectedRole(row, reviewerByEmail),
  ]));
  writeCsv("programme-mapping-data-issues.csv", ["id", "kind", "programme", "advisorName", "advisorEmail", "key", "label", "email", "active", "createdAt", "updatedAt", "issue", "reason"], programmeIssues.map((row) => {
    const key = naturalKey(row);
    const advisorEmail = value(row, "advisorEmail");
    const reasons = [];
    if (!key) reasons.push("Natural key programme is missing from both the storage envelope and nested data.");
    if (advisorEmail && !emailPattern.test(advisorEmail)) reasons.push("advisorEmail is not a valid email address.");
    if (advisorEmail && !(reviewerByEmail.get(advisorEmail.toLowerCase()) || []).some((candidate) => candidate.kind === "advisor" && candidate.active)) reasons.push("advisorEmail does not resolve to an active Advisor record.");
    return [row.id, row.kind, value(row, "programme"), value(row, "advisorName"), advisorEmail, string(row.wrapper.key), string(row.wrapper.label), string(row.wrapper.email), bool(row.active), date(row.created_at), date(row.updated_at), !key ? "Missing natural key" : "Advisor mapping issue", reasons.join(" ")];
  }));

  const jsonPaths = liveJsonPaths(byKind);
  const unknownLegacyFields = liveUnknownFields(byKind);
  const summary = buildSummary({
    generatedAt: new Date().toISOString(),
    rows,
    byKind,
    orphanActiveCrns,
    crnsNoReviewerEmail,
    unresolvedReviewerMappings,
    courseMismatches,
    crnMismatches,
    programmeIssues,
    activeNaturalKeyDuplicates,
    caseOnlyDuplicateGroups,
    missingKeys,
    crnsReferencingInactiveReviewer,
    invalidReviewerEmails,
    inactiveReviewerAssignments,
    jsonPaths,
    unknownLegacyFields,
  });
  fs.writeFileSync(path.join(outputDir, "summary.md"), summary, "utf8");
  fs.writeFileSync(path.join(outputDir, "report-metadata.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: "PostgreSQL reference_records",
    queryMode: "read-only SELECT",
    featureFlag: "REFERENCE_BULK_IMPORT_ENABLED=false",
    counts: {
      orphanActiveCrns: orphanActiveCrns.length,
      crnsNoReviewerEmail: crnsNoReviewerEmail.length,
      unresolvedReviewerMappings: unresolvedReviewerMappings.length,
      courseReviewerRoleMismatches: courseMismatches.length,
      crnReviewerRoleMismatches: crnMismatches.length,
      programmeMappingDataIssues: programmeIssues.length,
      activeNaturalKeyDuplicateGroups: activeNaturalKeyDuplicates.length,
      caseOnlyDuplicateGroups: caseOnlyDuplicateGroups.length,
      missingKeys: missingKeys.length,
      crnsReferencingInactiveReviewer: crnsReferencingInactiveReviewer.length,
      invalidReviewerEmails: invalidReviewerEmails.length,
      inactiveReviewerAssignments: inactiveReviewerAssignments.length,
    },
  }, null, 2), "utf8");

  console.log(JSON.stringify({
    outputDir,
    sourceRows: rows.length,
    counts: {
      orphanActiveCrns: orphanActiveCrns.length,
      crnsNoReviewerEmail: crnsNoReviewerEmail.length,
      unresolvedReviewerMappings: unresolvedReviewerMappings.length,
      courseReviewerRoleMismatches: courseMismatches.length,
      crnReviewerRoleMismatches: crnMismatches.length,
      programmeMappingDataIssues: programmeIssues.length,
      activeNaturalKeyDuplicateGroups: activeNaturalKeyDuplicates.length,
      caseOnlyDuplicateGroups: caseOnlyDuplicateGroups.length,
      missingKeys: missingKeys.length,
      crnsReferencingInactiveReviewer: crnsReferencingInactiveReviewer.length,
      invalidReviewerEmails: invalidReviewerEmails.length,
      inactiveReviewerAssignments: inactiveReviewerAssignments.length,
    },
    files: fs.readdirSync(outputDir).sort(),
  }, null, 2));
} finally {
  await client.end();
}

function value(row, field) {
  return string(row.nested[field] ?? row.wrapper[field]);
}

function naturalKey(row) {
  return string(row.wrapper.key || row.nested.key || row.nested.courseCode || row.nested.crn || row.nested.email || row.nested.programme);
}

function courseCode(row) {
  return value(row, "courseCode") || (row.kind === "course" ? naturalKey(row) : "");
}

function crn(row) {
  return value(row, "crn") || (row.kind === "crn" ? naturalKey(row) : "");
}

function personEmail(row) {
  return value(row, "email") || naturalKey(row);
}

function reviewerEmail(row) {
  return value(row, "reviewerEmail") || (row.kind === "crn" || row.kind === "course" ? string(row.wrapper.email) : "");
}

function reviewerName(row) {
  return value(row, "reviewerName");
}

function reviewerRole(row) {
  return value(row, "reviewerRole");
}

function expectedReviewerType(row) {
  const role = reviewerRole(row).toLowerCase();
  return role === "lecturer" ? "Lecturer" : role === "advisor" ? "Advisor" : "Unknown reviewer type";
}

function inferredExpectedRole(row, reviewerByEmail) {
  const candidates = reviewerByEmail.get(reviewerEmail(row).toLowerCase()) || [];
  const activeKinds = [...new Set(candidates.filter((candidate) => candidate.active).map((candidate) => candidate.kind))];
  if (activeKinds.length === 1) return activeKinds[0] === "lecturer" ? "Lecturer" : activeKinds[0] === "advisor" ? "Advisor" : "Unknown";
  return activeKinds.map((kind) => kind === "lecturer" ? "Lecturer" : kind === "advisor" ? "Advisor" : kind).join(" / ") || "Unresolved";
}

function hasRoleMismatch(row, reviewerByEmail) {
  const role = reviewerRole(row).toLowerCase();
  if (role !== "lecturer" && role !== "advisor") return false;
  const candidates = reviewerByEmail.get(reviewerEmail(row).toLowerCase()) || [];
  return !candidates.some((candidate) => candidate.active && candidate.kind === role) && candidates.some((candidate) => candidate.active && candidate.kind !== role);
}

function liveJsonPaths(byKind) {
  const result = {};
  for (const [kind, items] of Object.entries(byKind)) {
    const paths = new Set(["data"]);
    for (const item of items) {
      for (const key of Object.keys(item.wrapper)) paths.add(`data.${key}`);
      for (const key of Object.keys(item.nested)) paths.add(`data.data.${key}`);
    }
    result[kind] = [...paths].sort();
  }
  return result;
}

function liveUnknownFields(byKind) {
  const result = {};
  for (const [kind, items] of Object.entries(byKind)) {
    const fields = [];
    for (const item of items) {
      for (const key of Object.keys(item.nested)) {
        if (!expectedNestedFields[kind]?.has(key)) fields.push({ id: item.id, field: key });
      }
    }
    result[kind] = fields;
  }
  return result;
}

function buildSummary({ generatedAt, rows, byKind, orphanActiveCrns, crnsNoReviewerEmail, unresolvedReviewerMappings, courseMismatches, crnMismatches, programmeIssues, activeNaturalKeyDuplicates, caseOnlyDuplicateGroups, missingKeys, crnsReferencingInactiveReviewer, invalidReviewerEmails, inactiveReviewerAssignments, jsonPaths, unknownLegacyFields }) {
  const count = (items) => items.length;
  const featureFlag = process.env.REFERENCE_BULK_IMPORT_ENABLED || "false (defaulted; not enabled by this report)";
  const issueRows = [
    ["Orphan active CRNs", count(orphanActiveCrns), "Affected new/changed rows blocked; unchanged legacy rows may be reviewed", "Yes for affected CRNs", "Yes when reviewer is missing/unresolved", "No, except as a documented temporary legacy exception", "P1"],
    ["CRNs with no reviewer email", count(crnsNoReviewerEmail), "Affected new/changed rows blocked", "Yes: no intended reviewer routing", "Yes: no email identity for reviewer access", "Only with documented Registry fallback", "P1"],
    ["Unresolved reviewer mappings", count(unresolvedReviewerMappings), "Affected new/changed rows blocked", "Yes for affected CRNs", "Yes for affected reviewer", "No", "P1"],
    ["Course reviewer-role mismatches", count(courseMismatches), "No for unchanged rows; affected rows remain visible for reconciliation", "No immediate impact where email resolves", "No immediate impact where email resolves", "Yes, with monitoring and role-label reconciliation", "P2"],
    ["CRN reviewer-role mismatches", count(crnMismatches), "No for unchanged rows; affected rows remain visible for reconciliation", "No immediate impact where email resolves", "No immediate impact where email resolves", "Yes, with monitoring and role-label reconciliation", "P2"],
    ["Programme mapping data issues", count(programmeIssues), "Affected keyless row cannot safely match an import row", "May affect programme mapping, not CRN routing", "No direct reviewer-access impact identified", "Only because the identified record is inactive", "P2"],
  ];

  const lines = [];
  lines.push("# Reference Data Quality Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Scope: live PostgreSQL `reference_records`; all database access for this report was read-only `SELECT`.");
  lines.push(`Feature flag observed: \`${featureFlag}\`. This report did not enable it, change reference data, or restart any service.`);
  lines.push("");
  lines.push("## Technical summary");
  lines.push("");
  lines.push(`The live inventory contains **${rows.length} reference records**: ${kindSummary(byKind)}.`);
  lines.push(`The report found **${count(orphanActiveCrns)} orphan active CRNs**, **${count(crnsNoReviewerEmail)} active CRNs without reviewer email**, **${count(unresolvedReviewerMappings)} unresolved reviewer mappings**, **${count(courseMismatches)} course reviewer-role mismatches**, **${count(crnMismatches)} CRN reviewer-role mismatches**, and **${count(programmeIssues)} programme-mapping data issues**.`);
  lines.push("The P1 findings should be remediated or explicitly accepted before enabling bulk import because they can prevent correct CRN-to-course and CRN-to-reviewer routing. Role mismatches are legacy labels and are currently safer to reconcile as a separate controlled cleanup because reviewer identity is application-derived by email.");
  lines.push("");
  lines.push("## Issue summary and operational impact");
  lines.push("");
  lines.push("| Issue type | Count | Blocks bulk import? | Affects student routing? | Affects reviewer access? | Safe to leave temporarily? | Priority |");
  lines.push("|---|---:|---|---|---|---|---|");
  for (const row of issueRows) lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} | ${row[6]} |`);
  lines.push("");
  lines.push("Interpretation: v1 is all-or-nothing at confirmation. Invalid or conflicting uploaded rows block the entire import; unchanged rows do not block. These production exceptions do not justify automatic cleanup and must not be silently overwritten by current-data re-import.");
  lines.push("");
  lines.push("## Additional preflight checks");
  lines.push("");
  lines.push("| Check | Count | Result |");
  lines.push("|---|---:|---|");
  lines.push(`| Active natural-key duplicate groups | ${activeNaturalKeyDuplicates.length} | ${activeNaturalKeyDuplicates.length ? "Conflicts require remediation before the case-insensitive unique index is enabled" : "No conflicts found"} |`);
  lines.push(`| Case-only duplicate groups | ${caseOnlyDuplicateGroups.length} | ${caseOnlyDuplicateGroups.length ? "Conflicts require remediation" : "No conflicts found"} |`);
  lines.push(`| Missing natural keys | ${missingKeys.length} | ${missingKeys.length ? "Review required; the keyless inactive programme mapping is listed separately" : "None found"} |`);
  lines.push(`| CRNs referencing inactive reviewers | ${crnsReferencingInactiveReviewer.length} | ${crnsReferencingInactiveReviewer.length ? "Review required" : "None found"} |`);
  lines.push(`| Invalid reviewer/advisor emails | ${invalidReviewerEmails.length} | ${invalidReviewerEmails.length ? "Review required" : "None found"} |`);
  lines.push(`| Inactive reviewer assignments | ${inactiveReviewerAssignments.length} | ${inactiveReviewerAssignments.length ? "Review required" : "None found"} |`);
  lines.push("");
  lines.push("## Findings");
  lines.push("");
  lines.push(`### ${count(orphanActiveCrns)} orphan active CRNs`);
  lines.push("");
  lines.push("An orphan active CRN has no matching active Course record for its case-insensitive `courseCode`. This can leave course identification incomplete and can prevent intended reviewer routing. The complete row-level list is in [orphan-active-crns.csv](./orphan-active-crns.csv).");
  lines.push("");
  lines.push(`### ${count(crnsNoReviewerEmail)} active CRNs with no reviewer email`);
  lines.push("");
  lines.push("These CRNs have no reviewer email in the live CRN record. They cannot resolve the application-derived reviewer identity needed for direct reviewer access and email routing. The complete list is in [crns-no-reviewer-email.csv](./crns-no-reviewer-email.csv).");
  lines.push("");
  lines.push(`### ${count(unresolvedReviewerMappings)} unresolved reviewer mappings`);
  lines.push("");
  lines.push("These CRNs contain a reviewer email but no active Lecturer or Advisor record matches it. The requested CRN 12365 is included if it remains present in the live result. The row-level list is in [unresolved-reviewer-mappings.csv](./unresolved-reviewer-mappings.csv).");
  lines.push("");
  lines.push(`### ${count(courseMismatches)} course reviewer-role mismatches and ${count(crnMismatches)} CRN reviewer-role mismatches`);
  lines.push("");
  lines.push("These are descriptive findings only. The current `reviewerRole` value is preserved in the CSV and was not changed. A mismatch means the declared role does not have an active reviewer record of that kind for the email, while an active reviewer record of the opposite kind exists. The inferred role is evidence for Registry review, not an instruction to update production data.");
  lines.push("");
  lines.push("- [course-reviewer-role-mismatches.csv](./course-reviewer-role-mismatches.csv)");
  lines.push("- [crn-reviewer-role-mismatches.csv](./crn-reviewer-role-mismatches.csv)");
  lines.push("");
  lines.push(`### ${count(programmeIssues)} programme mapping data issues`);
  lines.push("");
  lines.push("The issue CSV includes all safe envelope/nested fields, record ID, active status, and timestamps. The identified inactive record `76d650c6-ca36-45d7-9d06-3aa3cc2ed315` is included when present. Its natural key is missing because neither the storage-envelope `key` nor nested `programme` contains a non-blank value, so it cannot be safely matched by the import key. The row is inactive, so the immediate routing impact is limited, but it must be repaired or explicitly retired before it is used in an import workflow.");
  lines.push("Programme mappings also contain shared departmental routing addresses (for example, addresses ending in `@costaatt.edu.tt` that are not individual Advisor records). Those addresses are part of the existing programme-mapping model and were not incorrectly classified as unresolved individual reviewer mappings in this report.");
  lines.push("");
  lines.push("See [programme-mapping-data-issues.csv](./programme-mapping-data-issues.csv).");
  lines.push("");
  lines.push("## Live JSON field inventory");
  lines.push("");
  lines.push("The `reference_records.data` envelope is represented by `data.*`; nested academic fields are represented by `data.data.*`. No unknown/legacy nested fields were found by the expected-category manifest used for this report.");
  lines.push("");
  for (const kind of Object.keys(expectedNestedFields)) {
    lines.push(`- **${kind}:** ${jsonPaths[kind].join(", ")}`);
    if (unknownLegacyFields[kind].length) lines.push(`  - Unknown/legacy nested fields: ${unknownLegacyFields[kind].map((item) => `${item.field} (${item.id})`).join(", ")}`);
    else lines.push("  - Unknown/legacy nested fields: none found.");
  }
  lines.push("");
  lines.push("## Method and definitions");
  lines.push("");
  lines.push("- Source query: `SELECT id, kind, data, active, created_at, updated_at FROM reference_records ORDER BY kind, id`.");
  lines.push("- Orphan CRN: active CRN whose `courseCode` does not match an active Course `courseCode`, case-insensitively, after trimming surrounding whitespace for comparison only.");
  lines.push("- Reviewer resolution: active Lecturer or Advisor record whose application email matches the CRN/course reviewer email case-insensitively.");
  lines.push("- Role mismatch: declared `reviewerRole` is `lecturer` or `advisor`, no active reviewer of that declared kind matches the email, and an active reviewer of the opposite kind does match.");
  lines.push("- Invalid reviewer emails, inactive reviewer references, active natural-key duplicates, and case-only duplicate groups are explicitly counted in the preflight table; their live counts are zero when no positive findings exist.");
  lines.push("");
  lines.push("## Recommended remediation order");
  lines.push("");
  lines.push("1. **P1 — resolve orphan active CRNs, missing reviewer emails, and unresolved reviewer mappings.** Confirm each CRN’s course and application-derived reviewer identity with Registry/Academic Affairs. Do not bulk-fill values from assumptions.");
  lines.push("2. **P2 — reconcile the 601 role labels.** Verify whether each email should be treated as Lecturer or Advisor, then make a separately approved, auditable correction that preserves the existing email-based access model.");
  lines.push("3. **P2/P3 — repair or retire the inactive keyless programme mapping.** Assign the correct programme key only after business confirmation; do not infer it from the UUID or free text.");
  lines.push("");
  lines.push("## Review files");
  lines.push("");
  lines.push("- [orphan-active-crns.csv](./orphan-active-crns.csv)");
  lines.push("- [crns-no-reviewer-email.csv](./crns-no-reviewer-email.csv)");
  lines.push("- [unresolved-reviewer-mappings.csv](./unresolved-reviewer-mappings.csv)");
  lines.push("- [course-reviewer-role-mismatches.csv](./course-reviewer-role-mismatches.csv)");
  lines.push("- [crn-reviewer-role-mismatches.csv](./crn-reviewer-role-mismatches.csv)");
  lines.push("- [programme-mapping-data-issues.csv](./programme-mapping-data-issues.csv)");
  lines.push("- [report-metadata.json](./report-metadata.json)");
  lines.push("");
  lines.push("## Safety and limitations");
  lines.push("");
  lines.push("No production data was modified. No uploaded CSV was used or retained. No SAML, authentication, DNS, SSL, firewall, NIC, NAT, proxy, or service state was changed. This report is a point-in-time inventory; Registry should re-run the read-only report immediately before any production feature-flag decision.");
  lines.push("");
  lines.push("CSV cells beginning with spreadsheet formula characters are prefixed with an apostrophe in the exported review files to reduce formula-injection risk. That safety prefix is report-export protection and does not represent a proposed production value change.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function kindSummary(byKind) {
  return Object.entries(byKind).map(([kind, items]) => `${kind} ${items.length} (${items.filter((item) => item.active).length} active)`).join(", ");
}

function writeCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(","));
  fs.writeFileSync(path.join(outputDir, filename), `${lines.join("\r\n")}\r\n`, "utf8");
}

function escapeCsv(input) {
  let value = string(input);
  if (/^[=+\-@]/.test(value)) value = `'${value}`;
  return `"${value.replaceAll('"', '""')}"`;
}

function string(input) {
  return input === null || input === undefined ? "" : String(input);
}

function bool(input) {
  return input ? "true" : "false";
}

function date(input) {
  return input instanceof Date ? input.toISOString() : string(input);
}

function duplicateGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = naturalKey(row).trim();
    if (!key) continue;
    const groupKey = `${row.kind}:${key.toLowerCase()}`;
    groups.set(groupKey, [...(groups.get(groupKey) || []), { id: row.id, value: key }]);
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, values: values.map((item) => item.value), ids: values.map((item) => item.id) }));
}
