alter table reference_records
  add column if not exists archived boolean not null default false;

alter table reference_records
  add column if not exists archived_at timestamptz;

create index if not exists reference_records_kind_archived_active_idx
  on reference_records (kind, archived, active);

do $$
begin
  if exists (
    select 1
    from reference_records
    where archived = true
      and active = true
  ) then
    raise exception 'Cannot add archive invariant while active archived reference records exist.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'reference_records'::regclass
      and conname = 'reference_records_archived_inactive_check'
  ) then
    alter table reference_records
      add constraint reference_records_archived_inactive_check check (not archived or not active);
  end if;
end $$;
