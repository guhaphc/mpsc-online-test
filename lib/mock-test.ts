import { OptionKey, optionKeys } from "@/lib/tests";

export type GeneratedQuestion = {
  question_text: string; option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: OptionKey; marks: number; explanation: string; question_order: number;
};

/** Reject malformed model output before it can reach mpsc_questions. */
export function validateGeneratedQuestions(value: unknown, expected: number, marks: number): GeneratedQuestion[] {
  if (!Array.isArray(value) || value.length !== expected) throw new Error(`The AI returned ${Array.isArray(value) ? value.length : 0} questions; expected ${expected}.`);
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const q = raw as Record<string, unknown>;
    const text = typeof q.question_text === "string" ? q.question_text.trim() : "";
    const options = ["option_a", "option_b", "option_c", "option_d"].map((key) => typeof q[key] === "string" ? q[key].trim() : "");
    const answer = typeof q.correct_answer === "string" ? q.correct_answer.trim().toUpperCase() : "";
    if (!text || options.some((option) => !option) || !optionKeys.includes(answer as OptionKey) || !Number.isFinite(marks) || marks <= 0) throw new Error(`Question ${index + 1} failed validation.`);
    const fingerprint = text.toLocaleLowerCase().replace(/\s+/g, " ");
    if (seen.has(fingerprint)) throw new Error("The AI returned duplicate question text.");
    seen.add(fingerprint);
    return { question_text: text, option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3], correct_answer: answer as OptionKey, marks, explanation: typeof q.explanation === "string" ? q.explanation.trim() : "", question_order: index + 1 };
  });
}
