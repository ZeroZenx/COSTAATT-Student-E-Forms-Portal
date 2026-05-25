# COSTAATT Student E-Forms Portal

## Project Overview
The COSTAATT Student E-Forms Portal is a modern replacement for the legacy SharePoint-based Registry e-forms experience. It provides authenticated student access to Course Override, Academic Standing Petition, and Repeat Rule requests, plus Registry, advisor, lecturer, and administrator workflows for review, routing, audit, and reporting.

The app is designed to sit behind the existing COSTAATT student portal and QuickLaunch SSO. Students do not access the system anonymously; they enter through the portal, complete guided forms, upload required documents, and track submission progress.

## Features
- Student e-forms hub for Course Override, Academic Standing Petition, and Repeat Rule forms.
- Guided multi-step form workflow with student identity prefill.
- Signed SSO token, QuickLaunch JWT, or trusted SSO header claim support.
- Role-aware access for students, advisors, lecturers, Registry staff, Registry admins, and system admins.
- Postgres schema with local JSON fallback for development.
- S3-compatible attachment storage with local upload fallback.
- Secure attachment download route for authorized staff.
- Admin submission queue with status/comment updates and CSV export.
- CRN/course lookup endpoint with reviewer auto-population.
- Advisor/lecturer dashboard for assigned requests.
- Student dashboard with submission history and timeline tracking.
- Registry dashboard with counters, pending work, CSV export, and reference-data access.
- Reference-data management for courses, CRNs, lecturers, advisors, and programme mappings.
- Local email logging mode and production SMTP configuration placeholders.
- Audit trail and workflow history fields on submissions.

## Screenshots
Add production screenshots here after deployment:

- Student e-forms hub: `docs/screenshots/student-hub.png`
- Guided request form: `docs/screenshots/form-workflow.png`
- Registry dashboard: `docs/screenshots/registry-dashboard.png`
- Advisor review queue: `docs/screenshots/advisor-dashboard.png`
- Reference-data management: `docs/screenshots/reference-data.png`

## Tech Stack
- Next.js 14 App Router
- React 18
- TypeScript
- Postgres
- Node `pg`
- S3-compatible object storage
- Zod validation
- Lucide icons
- Vitest
- Optional Prisma schema for migration planning

## Folder Structure
```text
app/                         Next.js routes, pages, and API endpoints
components/                  Client UI components
db/schema.sql                SQL schema for Postgres setup
lib/auth.ts                  SSO, QuickLaunch JWT, and RBAC helpers
lib/email.ts                 Email notification abstraction
lib/forms.ts                 Form definitions and status constants
lib/reference-admin.ts       Registry reference-data management
lib/reference-data.ts        Imported advisor/programme/course source data
lib/repository.ts            Submission persistence layer
lib/storage.ts               S3/local attachment storage
lib/types.ts                 Shared TypeScript types
lib/validation.ts            Request validation schemas
lib/workflow.ts              Routing, audit, enrichment, and workflow helpers
scripts/validate-env.mjs     Deployment environment validation
prisma/schema.prisma         Prisma-compatible schema reference
tests/                       Unit and workflow tests
```

## Environment Variables
```env
NODE_ENV=development
SSO_SHARED_SECRET=replace-with-portal-shared-secret
QUICKLAUNCH_JWT_SECRET=replace-with-quicklaunch-jwt-secret
TRUSTED_SSO_HEADER_NAME=x-portal-sso-token
TRUSTED_SSO_HEADER_MODE=signed-token
ALLOW_MOCK_SSO=false
SLA_ESCALATION_SECRET=replace-with-long-random-scheduler-secret
DATABASE_URL=postgres://costaatt:password@localhost:5432/costaatt_eforms
S3_ENDPOINT=https://s3.example.edu
S3_REGION=us-east-1
S3_BUCKET=costaatt-eforms
S3_ACCESS_KEY_ID=replace-me
S3_SECRET_ACCESS_KEY=replace-me
SMTP_HOST=smtp.example.edu
SMTP_PORT=587
SMTP_USER=replace-me
SMTP_PASSWORD=replace-me
SMTP_FROM=registry@costaatt.edu.tt
SMTP_SECURE=false
EMAIL_DELIVERY_MODE=log
EMAIL_LOG_PATH=data/email-log.jsonl
REGISTRY_NOTIFICATION_EMAIL=registrar@costaatt.edu.tt
PORTAL_BASE_URL=http://localhost:5001
UPLOAD_MAX_MB=8
```

## `.env.example`
The repository includes [.env.example](.env.example). Copy it to `.env.local` for local development and replace values as needed:

```bash
cp .env.example .env.local
```

For quick local testing without Postgres or S3, leave `DATABASE_URL` and S3 variables unset in `.env.local`. The app will use `data/*.json` and `uploads/`.

## Database Setup
Create a Postgres database and apply the SQL schema:

```bash
createdb costaatt_eforms
psql "$DATABASE_URL" -f db/schema.sql
```

The schema includes:
- `submissions`
- `reference_records`
- indexes for student ID, status, form type, and assigned reviewer email
- workflow history and audit trail JSON fields

## Prisma Migration Instructions
The current application uses the lightweight `pg` repository layer directly for runtime access. A Prisma-compatible schema is provided at `prisma/schema.prisma` for teams that want Prisma-managed migrations.

To adopt Prisma migrations:

```bash
npm install prisma @prisma/client --save-dev
npx prisma migrate dev --name init
npx prisma generate
```

Before switching runtime code to Prisma, keep `lib/repository.ts` behavior-compatible with the current API responses so existing submissions continue to load.

## Local Development
Port `3000` is intentionally avoided because another app already uses it. Use port `5001` for this project.

From a fresh clone:

```bash
git clone https://github.com/ZeroZenx/COSTAATT-Student-E-Forms-Portal.git
cd COSTAATT-Student-E-Forms-Portal
npm install
cp .env.example .env.local
npm run dev:5001
```

Open:

- Student forms: [http://localhost:5001/forms](http://localhost:5001/forms)
- Admin landing: [http://localhost:5001/admin](http://localhost:5001/admin)
- Registry admin queue: [http://localhost:5001/admin/submissions](http://localhost:5001/admin/submissions)
- Registry dashboard: [http://localhost:5001/admin/dashboard](http://localhost:5001/admin/dashboard)
- Advisor dashboard: [http://localhost:5001/advisor/requests](http://localhost:5001/advisor/requests)
- Student dashboard: [http://localhost:5001/student/dashboard](http://localhost:5001/student/dashboard)

For local mock access, visit:

```text
http://localhost:5001/api/dev/session
```

That route sets a development-only signed cookie and redirects to `/forms`.

### Alternate local port

If another service is already using `5001`, the app still includes a `5000` script for local-only fallback:

```bash
npm run dev:5000
```

Then open the same routes on port `5000`, for example [http://localhost:5000/forms](http://localhost:5000/forms).

## Authentication Overview
Production access must come from the authenticated student portal or QuickLaunch. The app supports:

- signed internal SSO cookie/token using `SSO_SHARED_SECRET`
- QuickLaunch-compatible HMAC JWT using `QUICKLAUNCH_JWT_SECRET`
- trusted SSO header token via `TRUSTED_SSO_HEADER_NAME`
- trusted claim headers when `TRUSTED_SSO_HEADER_MODE=claims`

Mapped claims:
- `studentId`
- `firstName`
- `lastName`
- `email`
- `roles`

Production mode must not expose mock identities. The `/api/dev/session` route returns 404 in production.

## Security Assumptions
- The portal or reverse proxy authenticates users before they reach production routes.
- Trusted claim headers are only accepted from infrastructure controlled by COSTAATT.
- Header spoofing must be blocked at the public edge.
- Attachments are downloaded only through authorized API routes.
- Upload type and size validation is enforced before storage.
- Comments and notes are sanitized before persistence.

## Student Workflow
1. Student enters from the authenticated portal.
2. Student selects Course Override, Academic Standing Petition, or Repeat Rule.
3. Identity fields are prefilled from SSO.
4. Student enters programme, semester, course, and request details.
5. CRN/course lookup auto-populates mapped reviewer data where available.
6. Student confirms declarations and uploads the Course Approval Form.
7. Submission is routed to advisor/lecturer or Registry review.
8. Student tracks status and comments from the student dashboard.

## Staff Workflow
Registry staff can:
- view all submissions
- filter/search requests
- update statuses
- add Registry comments and internal notes
- download attachments
- export CSV data

## Admin Workflow
Registry admins and system admins can:
- manage academic reference data
- add/edit/deactivate courses, CRNs, lecturers, advisors, and programme mappings
- bulk-import CSV data through the API/UI foundation
- deactivate rather than delete records linked to submissions

## File Upload Architecture
Attachments are stored using:
- S3-compatible storage when S3 variables are configured
- local `uploads/` fallback when S3 variables are absent

Allowed file types:
- PDF
- PNG
- JPG

Maximum upload size:
- 8 MB

## API Routes
- `GET /forms`
- `GET /forms/[type]`
- `POST /api/submissions`
- `GET /api/submissions/me`
- `GET /api/reference/lookup`
- `GET /admin`
- `GET /admin/submissions`
- `GET /admin/dashboard`
- `GET /advisor/requests`
- `GET /student/dashboard`
- `GET /api/advisor/requests`
- `PATCH /api/advisor/submissions/[id]`
- `GET /admin/reference-data`
- `GET /api/admin/submissions`
- `PATCH /api/admin/submissions/[id]`
- `GET /api/admin/submissions/[id]/attachment`
- `GET /api/admin/submissions/export`
- `POST /api/admin/sla/escalations`
- `POST /api/admin/sla/escalations?dryRun=1`
- `GET /api/admin/reference-data`
- `POST /api/admin/reference-data`
- `PATCH /api/admin/reference-data/[id]`

## Role Definitions
- `student`: can submit and view their own requests.
- `advisor`: can review assigned academic requests.
- `lecturer`: can review assigned course requests.
- `registry_staff`: can review and update Registry submissions.
- `registry_admin`: can manage submissions and reference data.
- `system_admin`: full administrative access.

## Testing Instructions
```bash
npm run typecheck
npm run lint
npm run build
npm test
```

Recommended manual smoke tests:
- unauthenticated `/forms` shows the SSO required screen
- `/api/dev/session` creates local access in development
- student can submit a request with an attachment
- student history returns only that student’s records
- advisor/lecturer sees only assigned requests and can approve, decline, or request information
- reviewer approval moves the request to Registry review
- Registry queue shows Registry-ready requests and missing-mapping triage items
- staff can update Registry status/comment
- invalid uploads are rejected
- unauthenticated APIs reject access

Validate deployment environment variables before production startup:

```bash
npm run validate:env -- --production
```

## Deployment Guidance
1. Provision Postgres and apply `db/schema.sql`.
2. Provision S3-compatible object storage.
3. Configure QuickLaunch/portal SSO forwarding.
4. Set production environment variables.
5. Disable mock SSO in production.
6. Deploy behind HTTPS.
7. Restrict trusted SSO headers at the reverse proxy or platform edge.
8. Configure SMTP or keep `EMAIL_DELIVERY_MODE=log` until mail routing is verified.
9. Run smoke tests against production-like roles.

For Windows Server hosting, use [DEPLOYMENT_WINDOWS.md](DEPLOYMENT_WINDOWS.md). Production should run the Node.js app on an internal port such as `127.0.0.1:5001` and expose the public service only through HTTPS using IIS or Caddy.

## Production Readiness Checklist
- **SSO:** Configure `SSO_SHARED_SECRET` or `QUICKLAUNCH_JWT_SECRET`, disable unauthenticated entry, and only trust SSO headers from the portal/reverse proxy.
- **Roles:** Test separate identities for `student`, `advisor`, `lecturer`, `registry_staff`, `registry_admin`, and `system_admin`.
- **Postgres:** Apply the schema, verify JSON workflow/audit columns, and confirm submissions persist after restart.
- **S3:** Configure bucket credentials, verify PDF/image upload, inline staff preview, forced download with `?download=1`, and denied unauthenticated access.
- **SMTP:** Start with `EMAIL_DELIVERY_MODE=log`, then switch to `smtp` after confirming `SMTP_FROM`, `REGISTRY_NOTIFICATION_EMAIL`, and delivery outcomes.
- **Local dev:** Run `npm run dev:5001`, visit `/api/dev/session`, then smoke-test `/forms`, `/student/dashboard`, `/advisor/requests`, and `/admin/submissions`.
- **Build checks:** Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before deployment.
- **Audit:** Confirm status updates, reviewer decisions, and attachment view/download events appear in the Registry audit trail.
- **Windows host:** Run `npm run validate:env -- --production`, confirm `/api/dev/session` returns 404, and keep Node.js behind IIS/Caddy rather than exposing port `5001`.

## Role-Based Smoke Tests
- **Student:** Open `/forms`, submit a mapped CRN with an attachment, verify confirmation includes the assigned reviewer, then check `/student/dashboard`.
- **Advisor/Lecturer:** Open `/advisor/requests`, verify only assigned requests appear, approve one request, and confirm it moves to Registry review.
- **Registry staff:** Open `/admin/submissions`, filter by status/routing, preview an attachment inline, download it, and update a request status/comment.
- **Registry admin/System admin:** Open `/admin/reference-data` and `/admin/settings/forms`, verify management pages are gated and form open/closed settings are available.

## SLA And Reporting
- The operations dashboard uses a fixed **3 business day** SLA threshold for `pending_advisor_review`, `pending_registry_review`, and `needs_information`.
- Business days currently exclude Saturday and Sunday only; public holiday calendars are a future enhancement.
- `/admin/dashboard` shows total volume, pending reviewer work, pending Registry work, missing reviewer mappings, overdue requests, form-type breakdowns, aging buckets, and direct links to action queues.
- `/advisor/requests` shows pending, overdue, decided, and all assigned requests with age/SLA badges.
- `/api/admin/submissions/export` includes operational reporting fields: form, status label, student/programme, course/CRN/title, assigned reviewer, routing flags, created/updated dates, age in business days, SLA state, decisions, and latest comment.
- `/api/admin/sla/escalations?dryRun=1` previews overdue SLA reminder targets without sending email.
- `/api/admin/sla/escalations` sends reviewer and Registry SLA reminders. Scheduled calls must use `Authorization: Bearer $SLA_ESCALATION_SECRET`.

## Current Limitations
- Runtime persistence currently uses the `pg` repository layer, not Prisma Client.
- Bulk CSV import UI is scaffolded but not yet a full column-mapping wizard.
- Email notifications support SMTP and local log mode. Local mode writes delivery outcomes to `data/email-log.jsonl`.
- CRN metadata depends on the imported reference data; missing CRNs are routed to Registry review.
- Workflow routing uses the mapped lecturer first, then mapped advisor. Missing mappings go to Registry triage.
- Full advisor-plus-lecturer sequential approval is deferred; v1 uses one mapped reviewer before Registry.

## Future Roadmap
- Full Prisma runtime migration.
- CSV import wizard with column mapping and validation preview.
- Dedicated secure short-lived attachment URLs.
- Rich audit search and export.
- SLA escalation history dashboard.
- Advisor/HOD delegated approval queues.
- Student notifications inside the portal.
- Production monitoring and structured logging.
- End-to-end browser tests for all roles.
