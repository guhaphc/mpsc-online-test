-- Allow the status values used by the Question Bank Studio's archive/unpublish actions.
-- Archiving is soft deletion; it preserves question-bank rows for historical references.
alter table public.mpsc_ai_question_banks
  drop constraint if exists mpsc_ai_question_banks_status_check;

alter table public.mpsc_ai_question_banks
  add constraint mpsc_ai_question_banks_status_check
  check (status in ('draft', 'pending_review', 'published', 'rejected', 'unpublished', 'archived'));
