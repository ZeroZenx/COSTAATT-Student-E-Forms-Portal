# Windows Production Deployment Guide

This guide prepares a Windows Server VM to host the COSTAATT Student E-Forms Portal from GitHub behind HTTPS.

## 1. VM Prerequisites

Recommended baseline:

- Windows Server 2022 or newer.
- 4 vCPU minimum, 8 GB RAM minimum, 16 GB preferred.
- 100 GB storage minimum, with a separate backed-up volume if local uploads are used.
- Static internal IP or reserved DHCP address.
- DNS name for the production portal URL.
- HTTPS certificate for the public host name.
- Firewall allowing inbound 443 to the existing HTTPS reverse proxy only.
- Outbound access to GitHub, SMTP, Postgres, S3-compatible storage, and the COSTAATT portal/QuickLaunch provider.

Do not expose the Node.js app port directly to students. Public traffic should enter through HTTPS and reverse proxy to `127.0.0.1:5001`.

## 2. Required Software

Install these as an administrator:

- Node.js LTS.
- Git for Windows.
- PostgreSQL client tools, including `psql`.
- The existing Node.js HTTPS reverse proxy in this repository.
- NSSM, already installed on the VM, to keep the application and proxy running after reboot.
- Optional: S3-compatible object storage client/tools if uploads are stored outside the VM.

## 3. Clone And Install

Open PowerShell in the deployment folder:

```powershell
git clone https://github.com/ZeroZenx/COSTAATT-Student-E-Forms-Portal.git
cd COSTAATT-Student-E-Forms-Portal
npm install
```

Create the production environment file:

```powershell
copy .env.example .env.local
notepad .env.local
```

Replace all placeholder values before production startup.

## 4. Production Environment

Required production settings:

```env
NODE_ENV=production
APP_VERSION=0.1.0
GIT_COMMIT=<git-commit-being-deployed>
DATABASE_URL=postgres://costaatt:strong-password@postgres-host:5432/costaatt_eforms
PG_POOL_MAX=20
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECTION_TIMEOUT_MS=5000
PG_MAX_USES=7500
PG_STATEMENT_TIMEOUT_MS=15000
PORTAL_BASE_URL=https://eforms.costaatt.edu.tt
EMAIL_DELIVERY_MODE=smtp
SMTP_HOST=smtp.costaatt.edu.tt
SMTP_PORT=587
SMTP_FROM=registry@costaatt.edu.tt
REGISTRY_NOTIFICATION_EMAIL=registrar@costaatt.edu.tt
```

Configure QuickLaunch SAML as the primary production authentication path. Keep the IdP Entity ID, endpoint values, signing certificate, role map, and all other secrets in the protected service environment:

```env
SAML_ENABLED=true
SAML_PUBLIC_BASE_URL=https://eforms.costaatt.edu.tt
SAML_SP_ENTITY_ID=https://eforms.costaatt.edu.tt/api/saml/metadata
SAML_ACS_URL=https://eforms.costaatt.edu.tt/api/saml/acs
SAML_LOGOUT_URL=https://eforms.costaatt.edu.tt/api/saml/logout
SAML_IDP_METADATA_URL=https://sso.quicklaunch.io/admin/open/api/metadata?tenantDomain=costaatt.edu.tt
SAML_IDP_ENTITY_ID=<value-from-quicklaunch-metadata>
SAML_IDP_SSO_URL=<value-from-quicklaunch-metadata>
SAML_IDP_SSO_BINDING=<value-from-quicklaunch-metadata>
SAML_IDP_LOGOUT_URL=<value-from-quicklaunch-metadata-if-advertised>
SAML_IDP_LOGOUT_BINDING=<value-from-quicklaunch-metadata-if-advertised>
SAML_IDP_CERT=<protected-quicklaunch-signing-certificate>
SAML_NAMEID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
SAML_REQUIRE_SIGNED_ASSERTIONS=true
SAML_SIGN_AUTHN_REQUESTS=false
SAML_ACCEPTED_CLOCK_SKEW_MS=0
SAML_MAX_ASSERTION_AGE_MS=300000
SAML_REQUEST_TTL_MS=300000
SAML_ROLE_GROUP_MAP=<protected-costaatt-ad-group-role-json-if-approved>
SAML_TRUSTED_APPLICATION_ROLES=false
TRUSTED_SSO_HEADER_NAME=x-portal-sso-token
TRUSTED_SSO_HEADER_MODE=signed-token
ALLOW_MOCK_SSO=false
```

For trusted claim-header deployments, set `TRUSTED_SSO_HEADER_MODE=claims` only when the upstream portal strips spoofed public headers and injects trusted internal headers.

Optional S3-compatible upload storage:

```env
S3_ENDPOINT=https://s3.example.edu
S3_REGION=us-east-1
S3_BUCKET=costaatt-eforms
S3_ACCESS_KEY_ID=production-access-key
S3_SECRET_ACCESS_KEY=production-secret-key
```

For the first production deployment, local VM disk uploads are acceptable. If S3 is not configured, uploads are stored under the app `uploads/` folder. That folder must be backed up daily, preserved across deployments, and included in restore testing.

Validate the environment:

```powershell
npm run validate:env -- --production
```

The validation must pass before the app is started for production.

For 100+ concurrent users, start with `PG_POOL_MAX=20` for one Node.js process and confirm the database `max_connections` can support the configured pool plus administrative connections.

## 5. Database Setup

Create the database using the approved COSTAATT database process, then apply the schema:

```powershell
psql "$env:DATABASE_URL" -f db/schema.sql
```

If PowerShell does not expand the URL correctly, paste the connection string directly:

```powershell
psql "postgres://costaatt:strong-password@postgres-host:5432/costaatt_eforms" -f db/schema.sql
```

Back up Postgres daily at minimum. Retain backups long enough to recover from accidental status changes, file mismatches, or deployment issues.

### Reference-data bulk import gate

The bulk reference-data tools are additive and disabled by default. Before enabling them in the production environment:

1. Run the read-only reference-data inventory and resolve or explicitly accept every duplicate, orphan, missing-reviewer, invalid-email, and legacy-field exception.
2. Apply `node scripts/apply-reference-import-migration.mjs` and verify the import tables plus the case-insensitive active natural-key index. The migration must leave the `reference_records` count unchanged.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
4. Verify Download Template, Download Current Data, a validation preview, the explicit confirmation gate, results CSV formula protection, audit history, and transaction rollback in a non-production or controlled test environment.
5. Set `REFERENCE_BULK_IMPORT_ENABLED=true` only after the checks pass. Keep the configured limits and retention values explicit:

```text
REFERENCE_IMPORT_MAX_MB=8
REFERENCE_IMPORT_MAX_ROWS=10000
REFERENCE_IMPORT_ROW_RETENTION_DAYS=180
REFERENCE_IMPORT_SUMMARY_RETENTION_DAYS=730
```

The application never retains the original CSV. Do not disable PostgreSQL, Next.js, NSSM, HTTPS proxy, QuickLaunch SAML, DNS, NIC, SSL, firewall, or NAT for this feature. If an import fails, the reference-data and audit writes roll back in one transaction. For a completed import, disable the flag and use the stored row snapshots to prepare a reviewed compensating import; do not truncate or replace reference tables.

### Reference-data deletion safety and operation

Permanent reference-data deletion is independent of the bulk-import flag. It uses the additive safety tables and the approved PostgreSQL backup gate:

```powershell
node scripts/apply-reference-deletion-safety-migration.mjs
```

The migration is additive and verifies that `reference_records` and `submissions` counts remain unchanged. It creates `custom_audit_logs` if the live database is missing the table expected by the application and adds `reference_delete_operations` plus `reference_delete_rows`.

For the separate CRN-only Delete Unreferenced operation, apply the follow-up compatibility migration on an existing safety-schema installation:

```powershell
node scripts/apply-reference-delete-unreferenced-migration.mjs
```

Before deployment, confirm the approved backup is readable and contains `custom_audit_logs`, `reference_records`, `reference_delete_operations`, and `reference_delete_rows`. The CRN/Lecturer UI uses dependency previews, server-side authorization, exact typed confirmations, expiring preview hashes, and advisory-locked revalidation. The v1 Delete All policy is all-or-nothing: one blocking dependency means zero deletions. Delete Unreferenced CRNs and Delete Unreferenced Lecturers are separate system-admin-only operations that delete only safe records after revalidation; blocked records remain untouched. Single-record restoration, if ever approved, must use the operator-only procedure in [docs/REFERENCE-DATA-RESTORE.md](docs/REFERENCE-DATA-RESTORE.md); it is not exposed as a Registry browser action.

## 6. Build And Start

Run the standard checks:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The `npm run build` command removes stale `.next` output before compiling. This keeps repeated Windows VM deployments consistent with a fresh clone.

Start the production server on the internal port:

```powershell
npm run start -- -H 127.0.0.1 -p 5001
```

The app must only listen on `127.0.0.1:5001`. The existing HTTPS proxy serves ports 443 and 80 and proxies to `http://127.0.0.1:5001`.

## 7. Process Management

Use the existing NSSM services only. Do not add PM2 or another process manager.

Run the configuration script as an administrator:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\Configure-CostaattEformsServices.ps1
```

The `costaatt-eforms` service runs `npm run start -- -H 127.0.0.1 -p 5001`. The `costaatt-eforms-https-proxy` service runs `node scripts/https-proxy.mjs`, binds ports 443 and 80, and forwards only to the loopback application port. Both services restart after failure and write bounded logs under `C:\Student E-Forms\logs`.

The script preserves the existing service account. Review the current `LocalSystem` account separately and replace it with a dedicated least-privilege account when provisioned.

## 8. Reverse Proxy

The existing `scripts/https-proxy.mjs` terminates TLS using the certificate and intermediate chain under `C:\Student E-Forms\SSL Private Key`, sets `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host`, preserves POST bodies/cookies/RelayState, and returns a 308 redirect for HTTP requests. The proxy must be the only listener on ports 80 and 443.

## 9. Deployment Updates

For each deployment:

```powershell
git pull origin main
npm install
npm run validate:env -- --production
psql "$env:DATABASE_URL" -f db/schema.sql
npm run typecheck
npm run lint
npm test
npm run build
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\Configure-CostaattEformsServices.ps1
```

Restart the existing NSSM services after the script completes.

## 10. Smoke Tests

Run these after each deployment:

- Command-line smoke test:

```powershell
$env:SMOKE_BASE_URL = "https://eforms.costaatt.edu.tt"
$env:SMOKE_EXPECT_PRODUCTION = "true"
npm run smoke:windows
```

- Health: open `/api/health` and confirm it returns non-sensitive JSON with `status` not equal to `degraded`.
- Student: open `/forms`, submit a mapped CRN with an attachment, and confirm `/student/dashboard` shows the request.
- Reviewer: open `/advisor/requests`, verify assigned-only visibility, and approve or decline a test request.
- Registry: open `/admin/dashboard`, `/admin/submissions`, preview an attachment inline, download it with `?download=1`, and export CSV.
- Registry admin: open `/admin/diagnostics` and confirm Postgres, QuickLaunch SAML, email mode, upload mode, and reference-data counts are shown correctly.
- Security: open `/api/dev/session` and confirm it returns 404 in production.
- Security: attempt an unauthenticated private page and confirm the staff/student access panel or rejection appears.

## 10.1 Final Go-Live Gate

Before opening the system to students, confirm:

- `npm run validate:env -- --production` passes on the Windows VM.
- `psql "$env:DATABASE_URL" -f db/schema.sql` has completed successfully.
- `/api/health` is reachable through HTTPS.
- `/admin/diagnostics` shows the deployed Git commit, `postgres` reference data storage, expected reference-data counts, current signed-in QuickLaunch identity claims, and safe operations test actions.
- QuickLaunch sends `studentId`, `firstName`, `lastName`, and `email` in a signed SAML assertion. Registry/system roles are added internally by matching COSTAATT email addresses.
- SMTP has sent diagnostic test messages from `/admin/diagnostics` to a student, reviewer, and Registry mailbox.
- `uploads/` is included in the VM backup job if S3 is not configured.
- The HTTPS proxy forwards only to `127.0.0.1:5001`; port `5001` is not public.
- Windows Task Scheduler dry-run for SLA escalations succeeds.
- The tested Git commit hash is recorded for rollback.

## 11. SLA Escalation Schedule

The portal includes a scheduler-friendly endpoint for overdue SLA reminders:

```text
POST https://eforms.costaatt.edu.tt/api/admin/sla/escalations
Authorization: Bearer <SLA_ESCALATION_SECRET>
```

Dry-run first:

```powershell
$headers = @{ Authorization = "Bearer $env:SLA_ESCALATION_SECRET" }
Invoke-RestMethod -Method Post -Headers $headers -Uri "https://eforms.costaatt.edu.tt/api/admin/sla/escalations?dryRun=1"
```

Recommended Windows Task Scheduler setup:

- Trigger: every weekday morning, for example 8:00 AM.
- Action: PowerShell.
- Command:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$headers = @{ Authorization = 'Bearer <secret-from-secure-store>' }; Invoke-RestMethod -Method Post -Headers $headers -Uri 'https://eforms.costaatt.edu.tt/api/admin/sla/escalations'"
```

The endpoint sends reviewer reminders for overdue reviewer-assigned requests and Registry reminders for overdue Registry/no-reviewer triage requests. Same-day duplicate reminders are skipped using submission audit history.

## 12. Backup And Recovery

Back up:

- Postgres database.
- `uploads/` if local file storage is used.
- `.env.local` in a secure secrets store, not in GitHub.
- HTTPS proxy configuration.
- NSSM service configuration.

Before major updates, take a database backup and preserve the current Git commit hash so rollback is a normal `git checkout <commit>`, reinstall, rebuild, and service restart.

The protected backup script uses the installed PostgreSQL 17.9 binaries directly and
requires Systems Administration to supply an existing approved backup destination. It
does not create or assume `D:\Backups\COSTAATT-EForms`. See the complete procedure in
[docs/REFERENCE-DATA-RESTORE.md](docs/REFERENCE-DATA-RESTORE.md).

Example backup command (replace the destination only after it is approved):

```powershell
$pgBin = "C:\Student E-Forms\PostgreSQL-17.9-full\pgsql\bin"
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass `
  -File .\scripts\windows\Backup-CostaattEforms.ps1 `
  -AppRoot "C:\Student E-Forms\COSTAATT-Student-E-Forms-Portal" `
  -BackupRoot "<APPROVED_BACKUP_ROOT>" `
  -PostgresBin $pgBin `
  -RetentionDays 365
```

Restore test checklist:

- Restore the custom-format archive into a separately named non-production Postgres database.
- Confirm the archive manifest includes all live public tables and the required reference,
  import, audit, deletion, and submission tables.
- Record the archive checksum and verify `reference_records` and `submissions` counts.
- Read a sample reference record and submission from the restored database.
- Restore `uploads/` into a non-production app folder.
- Start the app against the restored database and uploads.
- Run `npm run smoke:windows` against the restored test URL.
- Open one submission with an attachment and confirm inline preview/download works.

## 13. Troubleshooting

- Blank page after deployment: check `C:\Student E-Forms\logs`, then verify `npm run build` completed successfully.
- Cannot sign in: verify SSO secrets/header mode and confirm the reverse proxy is forwarding the expected headers.
- Attachments fail: verify S3 variables or local `uploads/` permissions.
- Emails do not send: set `EMAIL_DELIVERY_MODE=log` temporarily, verify `data/email-log.jsonl`, then restore SMTP after the SMTP issue is corrected.
- `/api/dev/session` works in production: stop deployment immediately and confirm `NODE_ENV=production`.
