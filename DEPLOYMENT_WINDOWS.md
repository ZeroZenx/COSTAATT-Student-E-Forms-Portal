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
- Firewall allowing inbound 443 to IIS/Caddy only.
- Outbound access to GitHub, SMTP, Postgres, S3-compatible storage, and the COSTAATT portal/QuickLaunch provider.

Do not expose the Node.js app port directly to students. Public traffic should enter through HTTPS and reverse proxy to `127.0.0.1:5001`.

## 2. Required Software

Install these as an administrator:

- Node.js LTS.
- Git for Windows.
- PostgreSQL client tools, including `psql`.
- IIS with URL Rewrite and Application Request Routing, or Caddy as a simpler HTTPS reverse proxy.
- NSSM to run the Node.js process as a Windows service. PM2 may be used only if its Windows service integration has been separately tested.
- Optional: S3-compatible object storage client/tools if uploads are stored outside the VM.

## 3. Clone And Install

Open PowerShell in the deployment folder:

```powershell
git clone https://github.com/ZeroZenx/COSTAATT-Student-E-Forms-Portal.git
cd COSTAATT-Student-E-Forms-Portal
npm ci
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
PORTAL_BASE_URL=https://studentforms.costaatt.edu.tt
EMAIL_DELIVERY_MODE=smtp
EMAIL_CONFIG_SOURCE=admin
SMTP_HOST=smtp.costaatt.edu.tt
SMTP_PORT=587
SMTP_FROM=registry@costaatt.edu.tt
REGISTRY_NOTIFICATION_EMAIL=registrar@costaatt.edu.tt
```

Configure QuickLaunch JWT as the primary production authentication path:

```env
QUICKLAUNCH_JWT_SECRET=production-quicklaunch-secret
QUICKLAUNCH_JWT_ISSUER=https://quicklaunch.costaatt.edu.tt
QUICKLAUNCH_JWT_AUDIENCE=costaatt-student-eforms
QUICKLAUNCH_JWT_CLOCK_TOLERANCE_SECONDS=60
TRUSTED_SSO_HEADER_NAME=x-portal-sso-token
TRUSTED_SSO_HEADER_MODE=signed-token
ALLOW_MOCK_SSO=false
SETTINGS_ENCRYPTION_KEY=<32-byte-base64-key>
```

Generate `SETTINGS_ENCRYPTION_KEY` once, keep it in the approved secrets store, and preserve it during restores:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

For trusted claim-header deployments, set `TRUSTED_SSO_HEADER_MODE=claims` only when IIS/Caddy or the upstream portal strips spoofed public headers, injects trusted internal headers, and supplies a private `TRUSTED_SSO_PROXY_SECRET`.

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

For 100+ concurrent users, start with `PG_POOL_MAX=20` for one Node.js process. If PM2 cluster mode is used, total possible Postgres clients are `PG_POOL_MAX × process count`, so confirm the database `max_connections` can support that plus administrative connections.

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

## 6. Build And Start

Run the standard checks:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The `npm run build` command removes stale `.next` output before compiling. This keeps repeated Windows VM deployments consistent with a fresh clone.

Start the production server on the internal loopback interface:

```powershell
npm run start:windows
```

The app should only listen internally. IIS or Caddy should serve HTTPS and proxy to `http://127.0.0.1:5001`.

## 7. Process Management

Use one process manager, not both.

### Recommended: NSSM

Install NSSM and create a Windows service that runs:

```text
Application: C:\Program Files\nodejs\npm.cmd
Arguments: run start:windows
Startup directory: C:\path\to\COSTAATT-Student-E-Forms-Portal
```

Configure stdout/stderr log files in a folder such as `C:\Logs\costaatt-eforms`.
Set the service to `Automatic (Delayed Start)` and configure Windows Service Recovery to restart after first and second failures. Run the service under a dedicated, least-privilege account with modify access only to the app's `uploads\`, `data\`, and log directories.

Useful commands:

```powershell
nssm status COSTAATT-EForms
nssm restart COSTAATT-EForms
Get-Content C:\Logs\costaatt-eforms\stderr.log -Tail 100
```

For the first production VM, run one app process with `PG_POOL_MAX=20`. Horizontal or multi-process scaling should be introduced only after mail settings and other local JSON operational settings are moved to shared persistence.

### Optional: PM2

PM2 can manage the process interactively, but `pm2 startup` is not a reliable Windows service installation path by itself. Use PM2 only with a Windows service wrapper that the infrastructure team has validated; otherwise use NSSM.

## 8. Reverse Proxy

### IIS

Use IIS with URL Rewrite and Application Request Routing:

- Bind the public site to HTTPS on port 443.
- Enable proxy support in Application Request Routing.
- Add a rewrite rule that proxies all requests to `http://127.0.0.1:5001/{R:1}`.
- Ensure SSO headers are only accepted from the trusted portal path and cannot be supplied by public clients.
- Remove public inbound `x-sso-*`, `x-portal-sso-token`, and `x-sso-proxy-secret` headers before adding any identity headers at the trusted proxy layer.

### Caddy

Example `Caddyfile`:

```text
studentforms.costaatt.edu.tt {
  reverse_proxy 127.0.0.1:5001
}
```

Caddy can manage certificates automatically if DNS and outbound ACME access are permitted.

## 9. Deployment Updates

For each deployment:

```powershell
git pull origin main
npm ci
npm run validate:env -- --production
psql "$env:DATABASE_URL" -f db/schema.sql
npm run typecheck
npm run lint
npm test
npm run build
Restart-Service COSTAATT-EForms
```

If a validated PM2 service is used, restart that process instead.

## 10. Smoke Tests

Run these after each deployment:

- Command-line smoke test:

```powershell
$env:SMOKE_BASE_URL = "https://studentforms.costaatt.edu.tt"
$env:SMOKE_EXPECT_PRODUCTION = "true"
npm run smoke:windows
```

- Health: open `/api/health` and confirm it returns non-sensitive JSON with `status` not equal to `degraded`.
- Student: open `/forms`, submit a mapped CRN with an attachment, and confirm `/student/dashboard` shows the request.
- Reviewer: open `/advisor/requests`, verify assigned-only visibility, and approve or decline a test request.
- Registry: open `/admin/dashboard`, `/admin/submissions`, preview an attachment inline, download it with `?download=1`, and export CSV.
- Registry admin: open `/admin/diagnostics` and confirm Postgres, QuickLaunch JWT, email mode, upload mode, and reference-data counts are shown correctly.
- Security: open `/api/dev/session` and confirm it returns 404 in production.
- Security: attempt an unauthenticated private page and confirm the staff/student access panel or rejection appears.

## 10.1 Final Go-Live Gate

Before opening the system to students, confirm:

- `npm run validate:env -- --production` passes on the Windows VM.
- `psql "$env:DATABASE_URL" -f db/schema.sql` has completed successfully.
- `/api/health` is reachable through HTTPS.
- `/admin/diagnostics` shows the deployed Git commit, `postgres` reference data storage, expected reference-data counts, current signed-in QuickLaunch identity claims, and safe operations test actions.
- QuickLaunch sends `studentId`, `firstName`, `lastName`, and `email` in a signed JWT. Registry/system roles are added internally by matching COSTAATT email addresses.
- SMTP has sent diagnostic test messages from `/admin/diagnostics` to a student, reviewer, and Registry mailbox.
- `uploads/` is included in the VM backup job if S3 is not configured.
- IIS/Caddy proxies only to `127.0.0.1:5001`; port `5001` is not public.
- Windows Task Scheduler dry-run for SLA escalations succeeds.
- The tested Git commit hash is recorded for rollback.

## 11. SLA Escalation Schedule

The portal includes a scheduler-friendly endpoint for overdue SLA reminders:

```text
POST https://studentforms.costaatt.edu.tt/api/admin/sla/escalations
Authorization: Bearer <SLA_ESCALATION_SECRET>
```

Dry-run first:

```powershell
$headers = @{ Authorization = "Bearer $env:SLA_ESCALATION_SECRET" }
Invoke-RestMethod -Method Post -Headers $headers -Uri "https://studentforms.costaatt.edu.tt/api/admin/sla/escalations?dryRun=1"
```

Recommended Windows Task Scheduler setup:

- Trigger: every weekday morning, for example 8:00 AM.
- Action: PowerShell.
- Command:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$headers = @{ Authorization = 'Bearer <secret-from-secure-store>' }; Invoke-RestMethod -Method Post -Headers $headers -Uri 'https://studentforms.costaatt.edu.tt/api/admin/sla/escalations'"
```

The endpoint sends reviewer reminders for overdue reviewer-assigned requests and Registry reminders for overdue Registry/no-reviewer triage requests. Same-day duplicate reminders are skipped using submission audit history.

## 12. Backup And Recovery

Back up:

- Postgres database.
- `uploads/` if local file storage is used.
- `data/admin-settings.json`, which contains form availability, semester choices, and encrypted SMTP settings.
- `.env.local` in a secure secrets store, not in GitHub.
- IIS/Caddy configuration.
- PM2 process list or NSSM service configuration.

Before major updates, take a database backup and preserve the current Git commit hash so rollback is a normal `git checkout <commit>`, reinstall, rebuild, and service restart.

Example backup command:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\Backup-CostaattEforms.ps1 `
  -AppRoot "C:\Apps\COSTAATT-Student-E-Forms-Portal" `
  -BackupRoot "D:\Backups\COSTAATT-EForms"
```

Restore test checklist:

- Restore the SQL backup into a non-production Postgres database.
- Restore `uploads/` into a non-production app folder.
- Restore `data/admin-settings.json` and provide the original `SETTINGS_ENCRYPTION_KEY`.
- Start the app against the restored database and uploads.
- Run `npm run smoke:windows` against the restored test URL.
- Open one submission with an attachment and confirm inline preview/download works.

## 13. Troubleshooting

- Blank page after deployment: check the NSSM stdout/stderr logs, then verify `npm run build` completed successfully.
- Cannot sign in: verify SSO secrets/header mode and confirm the reverse proxy is forwarding the expected headers.
- Attachments fail: verify S3 variables or local `uploads/` permissions.
- Emails do not send: set `EMAIL_DELIVERY_MODE=log` temporarily, verify `data/email-log.jsonl`, then restore SMTP after the SMTP issue is corrected.
- `/api/dev/session` works in production: stop deployment immediately and confirm `NODE_ENV=production`.

## 14. Rollback

Record the tested commit before every release:

```powershell
git rev-parse HEAD
```

If a deployment fails:

1. Stop `COSTAATT-EForms`.
2. Restore the pre-deployment Postgres backup if the schema/data changed.
3. Restore `uploads\` and `data\admin-settings.json` when applicable.
4. Check out the recorded commit with `git checkout <known-good-commit>`.
5. Run `npm ci`, `npm run build`, and `npm run validate:env -- --production`.
6. Start the service and run `npm run smoke:windows`.

Do not delete a failed release or its logs until the cause has been documented.

## 15. External Go-Live Dependencies

The repository can verify code and configuration shape, but production approval still requires evidence from the Windows environment:

- a reachable Postgres instance with a successful backup and restore test
- the real QuickLaunch issuer, audience, signing secret, and sample identity claims
- an HTTPS DNS name and trusted certificate
- successful SMTP delivery to student, reviewer, and Registry mailboxes
- an operational local-upload backup job or production S3 configuration
- Windows Task Scheduler execution of the SLA dry-run
- role-based acceptance testing by COSTAATT staff
