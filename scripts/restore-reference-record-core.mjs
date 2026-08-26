import crypto from "node:crypto";

export function validateReferenceSnapshot(snapshot) {
  const kind = String(snapshot?.kind || "");
  if (kind !== "crn" && kind !== "lecturer") throw new Error("Only CRN and Lecturer snapshots can be restored by this utility.");
  if (!snapshot?.id || !snapshot.data || typeof snapshot.data !== "object") throw new Error("Snapshot is missing the original record ID or database data envelope.");
  const envelope = snapshot.data;
  const nested = envelope.data && typeof envelope.data === "object" ? envelope.data : {};
  const naturalKey = String(envelope.key || nested.key || nested.crn || nested.email || "").trim();
  if (!naturalKey) throw new Error("Snapshot is missing its natural key.");
  return { kind, envelope, naturalKey };
}

export async function restoreReferenceRecord(client, snapshot, actor, operationId = null) {
  const { kind, envelope, naturalKey } = validateReferenceSnapshot(snapshot);
  await client.query("select pg_advisory_xact_lock($1::bigint)", ["734982145"]);

  const existingId = await client.query("select id from reference_records where id = $1 for update", [snapshot.id]);
  if (existingId.rows[0]) throw new Error("Restore refused: a record with the original ID already exists.");

  const existingNaturalKey = await client.query(
    `select id
     from reference_records
     where kind = $1 and lower(trim(data->>'key')) = lower(trim($2))
     limit 1
     for update`,
    [kind, naturalKey]
  );
  if (existingNaturalKey.rows[0]) throw new Error("Restore refused: a record with the same natural key already exists.");

  const restoredAt = new Date().toISOString();
  await client.query(
    `insert into reference_records (id, kind, data, active, created_at, updated_at)
     values ($1, $2, $3::jsonb, $4, $5, $6)`,
    [snapshot.id, kind, JSON.stringify(envelope), snapshot.active !== false, snapshot.created_at || restoredAt, restoredAt]
  );

  const auditId = crypto.randomUUID();
  await client.query(
    `insert into custom_audit_logs
       (id, actor_json, action, target_type, target_id, metadata_json, created_at)
     values ($1, $2::jsonb, 'reference_record.restored', 'reference_record', $3, $4::jsonb, $5)`,
    [
      auditId,
      JSON.stringify({ identity: actor.identity, email: actor.email, source: "operator_restore" }),
      snapshot.id,
      JSON.stringify({ kind, naturalKey, operationId, restoredFrom: "reference_delete_rows.safe_snapshot" }),
      restoredAt
    ]
  );

  return { restored: true, kind, recordId: snapshot.id, auditId, operationId };
}
