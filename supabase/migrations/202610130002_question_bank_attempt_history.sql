create table if not exists public.mpsc_ai_question_bank_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.mpsc_profiles(id) on delete cascade,
  bank_id uuid not null references public.mpsc_ai_question_banks(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  total_questions integer not null,
  answered_count integer not null,
  correct_count integer not null,
  score_percent numeric(5,2) not null,
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, bank_id, attempt_number)
);
create index if not exists mpsc_ai_question_bank_attempts_student_date_idx
  on public.mpsc_ai_question_bank_attempts(student_id, submitted_at desc);
create index if not exists mpsc_ai_question_bank_attempts_student_bank_idx
  on public.mpsc_ai_question_bank_attempts(student_id, bank_id, submitted_at desc);
alter table public.mpsc_ai_question_bank_attempts enable row level security;
comment on table public.mpsc_ai_question_bank_attempts is 'Persistent per-student MCQ practice attempts and scores; access is mediated by authenticated server routes.';
