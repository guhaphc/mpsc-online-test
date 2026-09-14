export type TestRecord = {
  id: number;
  title: string;
  stage_id: number | null;
  paper_id: number | null;
  syllabus_item_id: number | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  is_published: boolean;
};

export type Question = {
  id: number;
  test_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  explanation?: string | null;
  sort_order?: number;
};

export type SyllabusItem = {
  id: number;
  paper_id: number;
  parent_id: number | null;
  item_type: string;
  name: string;
  sort_order: number;
};

export const optionKeys = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof optionKeys)[number];

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export function formatPenalty(value: number) {
  const penalty = Math.abs(Number(value) || 0);
  return penalty ? `-${penalty} mark${penalty === 1 ? "" : "s"}` : "No negative marking";
}

export function questionOption(question: Question, option: OptionKey) {
  return question[`option_${option.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"];
}

export function normaliseOption(value: string | null | undefined): OptionKey | null {
  const answer = (value ?? "").trim().toUpperCase();
  return optionKeys.includes(answer as OptionKey) ? (answer as OptionKey) : null;
}
