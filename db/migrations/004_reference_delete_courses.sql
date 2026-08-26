-- Extend the existing reference deletion operation tables for individual Course deletion.
-- This migration changes constraints only; it does not alter reference or submission data.

do $$
declare
  existing_constraint text;
begin
  select conname into existing_constraint
    from pg_constraint
   where conrelid = 'public.reference_delete_operations'::regclass
     and conname = 'reference_delete_operations_kind_check';
  if existing_constraint is not null then
    execute format('alter table public.reference_delete_operations drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.reference_delete_operations
  add constraint reference_delete_operations_kind_check
  check (kind in ('course', 'crn', 'lecturer'));

do $$
declare
  existing_constraint text;
begin
  select conname into existing_constraint
    from pg_constraint
   where conrelid = 'public.reference_delete_rows'::regclass
     and conname = 'reference_delete_rows_kind_check';
  if existing_constraint is not null then
    execute format('alter table public.reference_delete_rows drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.reference_delete_rows
  add constraint reference_delete_rows_kind_check
  check (kind in ('course', 'crn', 'lecturer'));
