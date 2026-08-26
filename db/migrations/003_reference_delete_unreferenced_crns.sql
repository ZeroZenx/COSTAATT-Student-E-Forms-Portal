do $$
declare
  existing_constraint text;
begin
  select conname
    into existing_constraint
    from pg_constraint
   where conrelid = 'public.reference_delete_operations'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%operation_type%';

  if existing_constraint is not null then
    execute format('alter table public.reference_delete_operations drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.reference_delete_operations
  add constraint reference_delete_operations_operation_type_check
  check (operation_type in ('delete', 'delete_unreferenced', 'deactivate'));
