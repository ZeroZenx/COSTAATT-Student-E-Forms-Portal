create table if not exists submissions (
  id uuid primary key,
  form_type text not null check (form_type in ('course-override', 'academic-standing-petition', 'repeat-rule')),
  status text not null check (status in ('submitted', 'in_review', 'needs_information', 'approved', 'declined', 'closed')),
  student jsonb not null,
  payload jsonb not null,
  attachment jsonb,
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_student_id_idx on submissions ((student->>'studentId'));
create index if not exists submissions_status_idx on submissions (status);
create index if not exists submissions_form_type_idx on submissions (form_type);
