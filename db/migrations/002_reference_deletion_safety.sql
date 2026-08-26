-- Additive audit and reference-data deletion safety schema.
-- This migration does not update or delete any existing reference or submission rows.

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

create index if not exists custom_audit_logs_target_idx on custom_audit_logs (target_type, target_id);
create index if not exists custom_audit_logs_created_at_idx on custom_audit_logs (created_at desc);

create table if not exists reference_delete_operations (
  id uuid primary key,
  kind text not null check (kind in ('crn', 'lecturer')),
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
  kind text not null check (kind in ('crn', 'lecturer')),
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
