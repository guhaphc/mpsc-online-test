create table if not exists public.mpsc_ai_question_explanations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.mpsc_ai_question_bank_items(id) on delete cascade,
  language text not null,
  question_fingerprint text not null,
  explanation_version integer not null default 1,
  explanation jsonb not null,
  generated_model text not null default 'gemini-3.1-flash-lite',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, language, question_fingerprint, explanation_version)
);
create index if not exists mpsc_ai_question_explanations_question_idx
  on public.mpsc_ai_question_explanations(question_id, language);
alter table public.mpsc_ai_question_explanations enable row level security;
comment on table public.mpsc_ai_question_explanations is 'Reusable AI-generated educational explanations for published MCQ questions; accessed only via authenticated server routes.';
