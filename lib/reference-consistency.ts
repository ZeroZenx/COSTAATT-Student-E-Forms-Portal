import type { PoolClient } from "pg";
import type { SubmissionPayload } from "./types";

/**
 * Validates the reference links that will be persisted in a submission while
 * the caller holds the shared reference-data advisory lock. A delete operation
 * takes the exclusive form of the same lock, so it cannot pass its final
 * dependency scan between this check and the submission insert.
 */
export async function assertActiveSubmissionReferences(client: PoolClient, payload: SubmissionPayload) {
  const crns = Array.from(new Set(payload.courses.map((course) => course.crn.trim()).filter(Boolean)));
  for (const crn of crns) {
    const result = await client.query(
      `select id
       from reference_records
       where kind = 'crn'
         and active = true
         and lower(trim(coalesce(data->'data'->>'crn', data->>'key', ''))) = lower(trim($1))
       limit 1`,
      [crn]
    );
    if (!result.rows[0]) {
      throw new Error("The selected course reference is no longer active. Reload the form and try again.");
    }
  }
}
