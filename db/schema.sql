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

create table if not exists student_notifications (
  id uuid primary key,
  student_id text not null,
  submission_id uuid not null,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists student_notifications_student_id_idx on student_notifications (student_id);
create index if not exists student_notifications_submission_id_idx on student_notifications (submission_id);
create index if not exists student_notifications_read_at_idx on student_notifications (read_at);
create index if not exists student_notifications_created_at_idx on student_notifications (created_at desc);

create table if not exists reference_records (
  id uuid primary key,
  kind text not null check (kind in ('course', 'crn', 'lecturer', 'advisor', 'programme_mapping')),
  data jsonb not null,
  active boolean not null default true,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_records_archived_inactive_check check (not archived or not active)
);

create unique index if not exists reference_records_kind_key_active_idx
  on reference_records (kind, (data->>'key'))
  where active = true;

create unique index if not exists reference_records_kind_key_active_ci_idx
  on reference_records (kind, lower(data->>'key'))
  where active = true;

create index if not exists reference_records_kind_archived_active_idx
  on reference_records (kind, archived, active);

create table if not exists reference_imports (
  id uuid primary key,
  kind text not null check (kind in ('course', 'crn', 'lecturer', 'advisor', 'programme_mapping')),
  original_filename text not null,
  file_sha256 text not null,
  uploaded_by jsonb not null,
  status text not null check (status in ('preview_ready', 'blocked', 'confirmed', 'applying', 'completed', 'failed', 'stale', 'expired')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  new_count integer not null default 0,
  unchanged_count integer not null default 0,
  update_count integer not null default 0,
  invalid_count integer not null default 0,
  conflict_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  rejected_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  row_expires_at timestamptz not null,
  summary_expires_at timestamptz not null
);

create index if not exists reference_imports_created_at_idx on reference_imports (created_at desc);
create index if not exists reference_imports_kind_status_idx on reference_imports (kind, status, created_at desc);
create index if not exists reference_imports_summary_expires_idx on reference_imports (summary_expires_at);

create table if not exists reference_import_rows (
  id uuid primary key,
  import_id uuid not null references reference_imports(id) on delete cascade,
  row_number integer not null,
  identifier text,
  record_id uuid,
  status text not null check (status in ('new', 'unchanged', 'update', 'invalid', 'conflict')),
  operation text not null check (operation in ('insert', 'update', 'skip', 'reject')),
  input_data jsonb not null,
  current_data jsonb,
  proposed_data jsonb,
  snapshot_hash text,
  snapshot_updated_at timestamptz,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  result text,
  reason text,
  created_at timestamptz not null default now(),
  unique (import_id, row_number)
);

create index if not exists reference_import_rows_import_status_idx on reference_import_rows (import_id, status, row_number);
create index if not exists reference_import_rows_import_record_idx on reference_import_rows (import_id, record_id);

create table if not exists custom_forms (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  department text not null,
  target_audience text not null,
  status text not null check (status in ('draft', 'published', 'unpublished', 'archived')),
  open_at timestamptz,
  close_at timestamptz,
  created_by jsonb not null,
  current_version_id uuid,
  version_number integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists custom_form_versions (
  id uuid primary key,
  form_id uuid not null references custom_forms(id),
  version_number integer not null,
  definition_json jsonb not null,
  status text not null default 'published' check (status in ('published', 'retired')),
  published_by jsonb not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (form_id, version_number)
);

create table if not exists custom_form_fields (
  id uuid primary key,
  form_id uuid not null references custom_forms(id),
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('short_text', 'long_text', 'email', 'phone', 'dropdown', 'multi_select', 'radio', 'checkbox', 'date', 'file_upload', 'declaration_checkbox', 'student_profile', 'section_header', 'instructions')),
  help_text text,
  required boolean not null default false,
  sort_order integer not null default 0,
  options_json jsonb not null default '[]'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  profile_binding text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, field_key)
);

create table if not exists custom_form_submissions (
  id uuid primary key,
  form_id uuid not null references custom_forms(id),
  form_version_id uuid not null references custom_form_versions(id),
  student_json jsonb not null,
  status text not null check (status in ('draft', 'submitted', 'in_review', 'needs_information', 'approved', 'declined', 'completed', 'closed')),
  assigned_reviewer_json jsonb,
  assigned_approver_json jsonb,
  assigned_processor_json jsonb,
  current_step_id uuid,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists custom_form_field_responses (
  id uuid primary key,
  submission_id uuid not null references custom_form_submissions(id),
  field_key text not null,
  field_type text not null,
  value_json jsonb,
  attachment_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists custom_workflow_steps (
  id uuid primary key,
  form_id uuid not null references custom_forms(id),
  form_version_id uuid references custom_form_versions(id),
  step_key text not null,
  step_type text not null check (step_type in ('review', 'approval', 'processing')),
  label text not null,
  sort_order integer not null default 0,
  assignee_type text not null default 'user',
  assignee_json jsonb not null,
  required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists custom_workflow_assignments (
  id uuid primary key,
  submission_id uuid not null references custom_form_submissions(id),
  step_id uuid not null,
  assigned_to_json jsonb not null,
  status text not null check (status in ('pending', 'approved', 'declined', 'needs_information', 'completed')),
  decision text,
  comment text,
  acted_by jsonb,
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists custom_email_templates (
  id uuid primary key,
  form_id uuid not null references custom_forms(id),
  event_key text not null,
  enabled boolean not null default true,
  subject text not null,
  body text not null,
  recipient_group text not null,
  cc_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, event_key)
);

create table if not exists custom_audit_logs (
  id uuid primary key,
  actor_json jsonb not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata_json jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists custom_forms_status_idx on custom_forms (status);
create index if not exists custom_forms_department_idx on custom_forms (department);
create index if not exists custom_forms_open_close_idx on custom_forms (open_at, close_at);
create index if not exists custom_form_submissions_student_id_idx on custom_form_submissions ((student_json->>'studentId'));
create index if not exists custom_form_submissions_status_idx on custom_form_submissions (status);
create index if not exists custom_form_submissions_form_idx on custom_form_submissions (form_id, form_version_id);
create index if not exists custom_workflow_assignments_email_idx on custom_workflow_assignments ((assigned_to_json->>'email'));
create index if not exists custom_audit_logs_target_idx on custom_audit_logs (target_type, target_id);
create index if not exists custom_audit_logs_created_at_idx on custom_audit_logs (created_at desc);

create table if not exists reference_delete_operations (
  id uuid primary key,
  kind text not null check (kind in ('course', 'crn', 'lecturer')),
  scope text not null check (scope in ('single', 'all')),
  operation_type text not null check (operation_type in ('delete', 'delete_unreferenced', 'deactivate')),
  actor_identity text not null,
  actor_email text not null,
  actor_json jsonb not null,
  status text not null check (status in ('preview_ready', 'blocked', 'confirmed', 'applying', 'completed', 'failed', 'stale', 'expired')),
  requested_count integer not null default 0 check (requested_count >= 0),
  safe_count integer not null default 0 check (safe_count >= 0),
  blocked_count integer not null default 0 check (blocked_count >= 0),
  deleted_count integer not null default 0 check (deleted_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  preview_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  previewed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  error_message text
);

create index if not exists reference_delete_operations_created_at_idx
  on reference_delete_operations (created_at desc);

create index if not exists reference_delete_operations_kind_status_idx
  on reference_delete_operations (kind, operation_type, status, created_at desc);

create table if not exists reference_delete_rows (
  id uuid primary key,
  operation_id uuid not null references reference_delete_operations(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  kind text not null check (kind in ('course', 'crn', 'lecturer')),
  record_id uuid not null,
  natural_key text not null,
  safe_snapshot jsonb not null,
  dependency_counts jsonb not null default '{}'::jsonb,
  block_reasons jsonb not null default '[]'::jsonb,
  classification text not null check (classification in ('safe', 'blocked')),
  snapshot_hash text not null,
  snapshot_updated_at timestamptz,
  result text not null default 'pending' check (result in ('pending', 'deleted', 'deactivated', 'blocked', 'failed', 'stale')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_id, row_number),
  unique (operation_id, record_id)
);

create index if not exists reference_delete_rows_operation_status_idx
  on reference_delete_rows (operation_id, classification, result, row_number);

create index if not exists reference_delete_rows_record_idx
  on reference_delete_rows (kind, record_id);
