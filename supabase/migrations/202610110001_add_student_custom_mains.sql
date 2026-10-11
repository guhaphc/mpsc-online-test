-- Reference migration for the isolated student-created Mains workflow.
-- The live schema was applied separately before application code was added.
-- Model answers and marking rubrics are server-only; RLS is enabled without client policies.

create table if not exists public.mpsc_student_custom_mains_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text,
  question_text text not null,
  marks numeric not null check (marks > 0 and marks <= 100),
  word_limit integer not null default 150 check (word_limit > 0 and word_limit <= 5000),
  source_filename text,
  model_answer text not null,
  evaluation_rubric jsonb not null,
  status text not null default 'ready' check (status = any (array['ready'::text, 'archived'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mpsc_student_custom_mains_submissions (
  id uuid primary key default gen_random_uuid(),
  custom_question_id uuid not null references public.mpsc_student_custom_mains_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_type text not null default 'typed' check (answer_type = any (array['typed'::text, 'handwritten'::text])),
  answer_text text,
  word_count integer not null default 0 check (word_count >= 0),
  status text not null default 'submitted' check (status = any (array['submitted'::text, 'evaluated'::text])),
  evaluation jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mpsc_student_custom_mains_pages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mpsc_student_custom_mains_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  storage_path text not null,
  file_name text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_custom_mains_questions_user_created
  on public.mpsc_student_custom_mains_questions(user_id, created_at desc);
create index if not exists idx_student_custom_mains_submissions_user_created
  on public.mpsc_student_custom_mains_submissions(user_id, created_at desc);
create index if not exists idx_student_custom_mains_submissions_question
  on public.mpsc_student_custom_mains_submissions(custom_question_id);
create index if not exists idx_student_custom_mains_pages_submission
  on public.mpsc_student_custom_mains_pages(submission_id, page_number);

alter table public.mpsc_student_custom_mains_questions enable row level security;
alter table public.mpsc_student_custom_mains_submissions enable row level security;
alter table public.mpsc_student_custom_mains_pages enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mpsc-student-custom-mains',
  'mpsc-student-custom-mains',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
