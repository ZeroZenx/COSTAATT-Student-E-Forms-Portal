create table if not exists submissions (
  id uuid primary key,
  form_type text not null check (form_type in ('course-override', 'academic-standing-petition', 'repeat-rule')),
  status text not null check (status in ('submitted', 'pending_advisor_review', 'advisor_approved', 'advisor_declined', 'in_review', 'needs_information', 'pending_registry_review', 'registry_approved', 'registry_declined', 'approved', 'declined', 'closed')),
  student jsonb not null,
  payload jsonb not null,
  attachment jsonb,
  admin_comment text,
  internal_notes text,
  assigned_to jsonb,
  routing_flags jsonb not null default '[]'::jsonb,
  reviewer_decision text check (reviewer_decision in ('approved', 'declined', 'needs_information')),
  reviewer_comment text,
  registry_decision text check (registry_decision in ('approved', 'declined', 'needs_information', 'closed')),
  registry_comment text,
  workflow_history jsonb not null default '[]'::jsonb,
  audit_trail jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table submissions add column if not exists routing_flags jsonb not null default '[]'::jsonb;
alter table submissions add column if not exists reviewer_decision text check (reviewer_decision in ('approved', 'declined', 'needs_information'));
alter table submissions add column if not exists reviewer_comment text;
alter table submissions add column if not exists registry_decision text check (registry_decision in ('approved', 'declined', 'needs_information', 'closed'));
alter table submissions add column if not exists registry_comment text;

create index if not exists submissions_student_id_idx on submissions ((student->>'studentId'));
create index if not exists submissions_status_idx on submissions (status);
create index if not exists submissions_form_type_idx on submissions (form_type);
create index if not exists submissions_assigned_to_email_idx on submissions ((assigned_to->>'email'));
create index if not exists submissions_routing_flags_idx on submissions using gin (routing_flags);

create table if not exists reference_records (
  id uuid primary key,
  kind text not null check (kind in ('course', 'crn', 'lecturer', 'advisor', 'programme_mapping')),
  data jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reference_records_kind_key_active_idx
  on reference_records (kind, (data->>'key'))
  where active = true;
