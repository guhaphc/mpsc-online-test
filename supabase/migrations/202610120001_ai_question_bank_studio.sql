create table if not exists public.mpsc_ai_question_banks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam text not null default 'MPSC',
  subject text not null,
  topic text not null default '',
  language text not null default 'English',
  source_type text not null check (source_type in ('pdf','image','webpage','text')),
  source_name text not null default '',
  source_mode text not null check (source_mode in ('source_only','source_plus_ai')),
  created_by uuid not null references public.mpsc_profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.mpsc_ai_question_bank_items (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.mpsc_ai_question_banks(id) on delete cascade,
  question_order integer not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A','B','C','D')),
  explanation text not null default '',
  difficulty text not null check (difficulty in ('Easy','Moderate','Tough','Extra Tough')),
  source_reference text not null default '',
  created_at timestamptz not null default now(),
  unique (bank_id, question_order)
);

create index if not exists mpsc_ai_question_banks_status_created_idx
  on public.mpsc_ai_question_banks(status, created_at desc);
create index if not exists mpsc_ai_question_banks_creator_idx
  on public.mpsc_ai_question_banks(created_by, created_at desc);
create index if not exists mpsc_ai_question_bank_items_bank_order_idx
  on public.mpsc_ai_question_bank_items(bank_id, question_order);

alter table public.mpsc_ai_question_banks enable row level security;
alter table public.mpsc_ai_question_bank_items enable row level security;

comment on table public.mpsc_ai_question_banks is 'AI-generated MCQ banks; access is mediated by authenticated server routes.';
comment on table public.mpsc_ai_question_bank_items is 'Reviewable MCQs belonging to AI question banks; access is mediated by authenticated server routes.';
