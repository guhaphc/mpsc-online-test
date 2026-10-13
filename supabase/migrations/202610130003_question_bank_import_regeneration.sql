alter table public.mpsc_ai_question_banks
  add column if not exists time_limit_minutes integer not null default 30,
  add column if not exists scheduled_publish_at timestamptz;

create table if not exists public.mpsc_ai_question_bank_revisions (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.mpsc_ai_question_banks(id) on delete cascade,
  question_id uuid not null references public.mpsc_ai_question_bank_items(id) on delete cascade,
  created_by uuid not null references public.mpsc_profiles(id) on delete cascade,
  question_type text not null check (question_type in ('statement_based','pairing','assertion_reason','single_liner','conceptual')),
  candidate jsonb not null,
  status text not null default 'draft' check (status in ('draft','accepted','discarded')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists mpsc_ai_question_bank_revisions_bank_idx
  on public.mpsc_ai_question_bank_revisions(bank_id, question_id, created_at desc);
alter table public.mpsc_ai_question_bank_revisions enable row level security;
comment on table public.mpsc_ai_question_bank_revisions is 'Teacher-reviewed alternate drafts for imported or regenerated MCQs; exposed only via authorized server routes.';
