create unique index if not exists reference_records_kind_key_active_ci_idx
  on reference_records (kind, lower(data->>'key'))
  where active = true;

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
