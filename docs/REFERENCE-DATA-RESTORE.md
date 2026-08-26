# Reference-data restore and PostgreSQL backup procedure

This document covers two separate operator workflows:

1. restoring one deleted reference record from its stored deletion snapshot; and
2. creating and validating a complete PostgreSQL backup for non-production restore testing.

The operator restore workflow is not exposed through the Registry browser UI. The
application's CRN/Lecturer Delete, Delete All, and Deactivate All workflows use the
separate dependency and audit implementation; this document only covers backup and
operator recovery.

## Production PostgreSQL details

The production database is local to the E-Forms VM:

- database: `costaatt_eforms`
- port: `5432`
- PostgreSQL service: `costaatt-postgres`
- PostgreSQL binaries: `C:\Student E-Forms\PostgreSQL-17.9-full\pgsql\bin`

The backup script uses absolute executable paths by default. It does not require a
machine-wide PATH change. The `-PostgresBin` parameter can be used if Systems
Administration approves a different installed PostgreSQL distribution.

## Full database backup

The approved backup destination is intentionally supplied by the operator. The script
does not default to `D:\Backups\COSTAATT-EForms`, create a missing backup root, or fall
back to an unapproved local directory.

Run only after Systems Administration has provided an existing, writable, approved
backup destination and retention policy. Use a protected operator session from the
application directory:

```powershell
$pgBin = "C:\Student E-Forms\PostgreSQL-17.9-full\pgsql\bin"
$env:Path = "$pgBin;$env:Path" # optional for other tools; the backup script does not require this
& ".\scripts\windows\Backup-CostaattEforms.ps1" `
  -AppRoot "C:\Student E-Forms\COSTAATT-Student-E-Forms-Portal" `
  -BackupRoot "<APPROVED_BACKUP_ROOT>" `
  -PostgresBin $pgBin `
  -RetentionDays 365
```

The process-level PATH line is optional and is not persisted. The script itself calls
`pg_dump.exe`, `pg_restore.exe`, and `psql.exe` by absolute path.

The script creates one timestamped child directory under the supplied existing root.
It creates a PostgreSQL custom-format archive named `costaatt-eforms.dump`, which
contains the complete database schema and data available to `pg_dump`, including:

- `reference_records`;
- `submissions`;
- `reference_imports`;
- `reference_import_rows`;
- `custom_audit_logs`;
- `reference_delete_operations`;
- `reference_delete_rows`; and
- all other current public application tables.

The script also copies the local `uploads` directory when present. It does not write
database credentials to backup metadata, restore notes, or normal output.

## Backup validation

Before reporting success, `Backup-CostaattEforms.ps1` verifies all of the following:

- the supplied backup root exists and is a directory;
- the PostgreSQL executables exist at the configured binary location;
- `pg_dump` completed successfully;
- the archive exists and is larger than zero bytes;
- `pg_restore --list` can inspect the archive;
- every public base table found in the live database is represented in the archive;
- all required reference, submission, import, audit, and deletion tables are present;
- a SHA-256 checksum is generated.

Each backup directory contains:

- `costaatt-eforms.dump` — the PostgreSQL custom-format archive;
- `costaatt-eforms.pg_restore-list.txt` — the inspected archive manifest;
- `BACKUP-METADATA.json` — timestamp, filename, size, checksum, and table verification;
- `RESTORE-NOTES.txt` — non-production restore reminders; and
- `uploads\` when local uploads are present.

The script removes only timestamped backup directories older than `-RetentionDays`.
It does not remove unrelated directories in the approved backup root.

## Non-production restore test

Do not run this until a fresh backup is present in the approved destination. Restore to
a separate non-production PostgreSQL server or instance when available. A temporary
database on the production PostgreSQL host is an acceptable fallback only with explicit
Systems Administration approval and a database name that cannot be confused with
`costaatt_eforms`, for example:

`costaatt_eforms_restore_test_YYYYMMDD`

The production database must never be overwritten. A guarded operator sequence is:

```powershell
$pgBin = "C:\Student E-Forms\PostgreSQL-17.9-full\pgsql\bin"
$archive = "<APPROVED_BACKUP_ROOT>\<TIMESTAMP>\costaatt-eforms.dump"
$targetDatabase = "costaatt_eforms_restore_test_YYYYMMDD"

# Use an approved non-production connection/maintenance database.
& "$pgBin\createdb.exe" --maintenance-db "<NON_PRODUCTION_MAINTENANCE_DATABASE_URL>" $targetDatabase
if ($LASTEXITCODE -ne 0) { throw "createdb failed" }

# Supply a non-production target connection. Never substitute costaatt_eforms.
& "$pgBin\pg_restore.exe" --exit-on-error --no-owner --no-privileges `
  --dbname "<NON_PRODUCTION_TARGET_DATABASE_URL>" $archive
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed" }

& "$pgBin\psql.exe" "<NON_PRODUCTION_TARGET_DATABASE_URL>" `
  --no-psqlrc --set ON_ERROR_STOP=on --command "SELECT to_regclass('public.reference_records'), to_regclass('public.submissions'), to_regclass('public.reference_imports'), to_regclass('public.reference_import_rows'), to_regclass('public.custom_audit_logs'), to_regclass('public.reference_delete_operations'), to_regclass('public.reference_delete_rows');"
if ($LASTEXITCODE -ne 0) { throw "table verification failed" }

& "$pgBin\psql.exe" "<NON_PRODUCTION_TARGET_DATABASE_URL>" `
  --no-psqlrc --set ON_ERROR_STOP=on --command "SELECT (SELECT count(*) FROM reference_records) AS reference_records, (SELECT count(*) FROM submissions) AS submissions;"
if ($LASTEXITCODE -ne 0) { throw "row-count verification failed" }

# After the report is accepted, remove only the named temporary database.
& "$pgBin\dropdb.exe" --if-exists --maintenance-db "<NON_PRODUCTION_MAINTENANCE_DATABASE_URL>" $targetDatabase
```

The restore report should record the target database name, archive checksum, required
table verification, `reference_records` and `submissions` counts, sample reads, errors,
and cleanup status. The restore must not be run against the production connection.

## Operator-only single-record restore

This utility restores only a CRN or Lecturer from the stored pre-delete snapshot. It
does not restore a full backup and does not cascade into related records.

### Preconditions

1. Confirm the deletion operation ID and corresponding `reference_delete_rows.safe_snapshot`.
2. Confirm a recent PostgreSQL backup exists and is readable.
3. Obtain explicit operator approval for the specific record restoration.
4. Confirm that restoring the record will not recreate an unwanted Course/CRN routing assignment.
5. Preserve the original deletion audit and operation records.

The utility refuses to overwrite either the original record ID or a conflicting natural key.

### Snapshot format

The input JSON must contain the safe database snapshot stored by a deletion operation, for example:

```json
{
  "id": "record-uuid",
  "kind": "crn",
  "data": {
    "key": "12365",
    "label": "Course title",
    "email": "reviewer@costaatt.edu.tt",
    "data": {
      "crn": "12365",
      "courseCode": "ACCT 126"
    }
  },
  "active": true,
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

### Controlled restore command

Run from the application directory in an approved operator session:

```powershell
$env:REFERENCE_RESTORE_APPROVED = "true"
node scripts/restore-reference-record.mjs `
  --snapshot-file "C:\approved\snapshot.json" `
  --operation-id "delete-operation-uuid" `
  --operator-identity "operator-name-or-id" `
  --operator-email "operator@costaatt.edu.tt" `
  --confirm "RESTORE REFERENCE"
```

The utility:

- acquires the existing exclusive reference-data advisory lock;
- checks the original record ID and case-insensitive natural key;
- refuses to overwrite any conflict;
- restores only the supplied CRN or Lecturer snapshot;
- writes `reference_record.restored` to `custom_audit_logs` in the same transaction; and
- rolls back the restore if the insert or audit write fails.

Do not restore a full database backup to recover one record. Use a non-production restore
first when the correct snapshot or routing impact is uncertain.

## Scheduled backup preparation

Do not register a Windows Task Scheduler task until Systems Administration confirms the
approved destination, retention period, and service account permissions. Recommended
defaults are:

- frequency: once daily during the lowest expected application activity window;
- retention: 365 days for the full backup archive, subject to institutional policy;
- task account: a dedicated least-privilege service account able to read the database and
  write only to the approved backup repository;
- database access: use the existing protected `DATABASE_URL` mechanism, without putting
  passwords in task arguments, XML, scripts, or logs;
- destination access: write permission to the approved backup root and no broader share
  permissions than required;
- log location: an approved protected operations log directory, separate from the backup
  archive; and
- failure handling: non-zero exit code, alert to Systems Administration, and no fallback
  to a local or unapproved directory.

The task action should call:

```text
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "C:\Student E-Forms\COSTAATT-Student-E-Forms-Portal\scripts\windows\Backup-CostaattEforms.ps1" -BackupRoot "<APPROVED_BACKUP_ROOT>" -RetentionDays 365
```

The PostgreSQL binary path is already explicit in the script. Any task registration
should be performed by Systems Administration with the approved account and should be
tested by reviewing the generated metadata, checksum, and archive manifest.

## Troubleshooting

- **BackupRoot does not exist:** stop and obtain the approved destination; the script
  intentionally does not create or substitute one.
- **PostgreSQL utility not found:** verify `-PostgresBin` points to the installed
  PostgreSQL `bin` directory; do not change the machine-wide PATH solely for this job.
- **DATABASE_URL is required:** confirm the protected application/service environment is
  available to the operator process; do not copy credentials into scripts or logs.
- **Archive table verification fails:** do not enable destructive reference-data actions;
  retain the failed artifact only for operator diagnosis and obtain a new full dump.
- **Restore fails:** do not retry against production; preserve the error, verify the
  non-production connection, and confirm the archive checksum before retrying.
