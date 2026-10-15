-- Add an archive state for safely deleting question banks without destroying student history.
-- Existing question records, attempts and cached explanations remain attached for audit/history.
alter table public.mpsc_ai_question_banks
  drop constraint if exists mpsc_ai_question_banks_status_check;

alter table public.mpsc_ai_question_banks
  add constraint mpsc_ai_question_banks_status_check
  check (status in ('draft','pending_review','published','rejected','unpublished','archived'));

create index if not exists mpsc_ai_question_banks_active_status_created_idx
  on public.mpsc_ai_question_banks(status, created_at desc)
  where status <> 'archived';
