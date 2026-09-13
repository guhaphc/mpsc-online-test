"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Question, TestRecord } from "@/lib/tests";

type Attempt = { id: number; test_id: number; user_id: string; score: number; submitted_at: string };
type Answer = { question_id: number; selected_option: string | null; is_correct: boolean; marks_awarded: number };

export default function ResultPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params); const router = useRouter(); const searchParams = useSearchParams();
  const [test, setTest] = useState<TestRecord | null>(null); const [questions, setQuestions] = useState<Question[]>([]); const [answers, setAnswers] = useState<Answer[]>([]); const [attempt, setAttempt] = useState<Attempt | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { (async () => {
    const id = Number(testId); const attemptId = Number(searchParams.get("attempt"));
    if (!Number.isInteger(id) || !Number.isInteger(attemptId)) { setError("This result link is invalid."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { router.replace("/"); return; }
    const [attemptResult, testResult, questionResult] = await Promise.all([
      supabase.from("mpsc_attempts").select("id, test_id, user_id, score, submitted_at").eq("id", attemptId).eq("test_id", id).eq("user_id", user.id).single(),
      supabase.from("mpsc_tests").select("*").eq("id", id).single(),
      supabase.from("mpsc_questions").select("*").eq("test_id", id),
    ]);
    const firstError = attemptResult.error || testResult.error || questionResult.error;
    if (firstError || !attemptResult.data) setError(firstError?.message || "The result could not be found.");
    else { const answerResult = await supabase.from("mpsc_answers").select("question_id, selected_option, is_correct, marks_awarded").eq("attempt_id", attemptId); if (answerResult.error) setError(answerResult.error.message); else { setAttempt(attemptResult.data as Attempt); setTest(testResult.data as TestRecord); setQuestions(questionResult.data as Question[]); setAnswers(answerResult.data as Answer[]); } }
    setLoading(false);
  })(); }, [router, searchParams, testId]);
  if (loading) return <main className="page"><section className="card"><p>Loading your result...</p></section></main>;
  if (error || !attempt || !test) return <main className="page"><section className="card"><h1>Result unavailable</h1><p className="form-error">{error || "The result could not be found."}</p><button className="secondary" onClick={() => router.push("/tests")}>Back to Tests</button></section></main>;
  const attempted = answers.filter((answer) => answer.selected_option !== null).length; const correct = answers.filter((answer) => answer.is_correct).length; const incorrect = attempted - correct; const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks), 0) || Number(test.total_marks); const percentage = totalMarks ? (Number(attempt.score) / totalMarks) * 100 : 0;
  return <main className="page"><section className="card result-card"><div className="eyebrow">Test submitted</div><h1>Test Result</h1><p className="muted">{test.title}</p><div className="score-card"><span>Your score</span><strong>{Number(attempt.score).toFixed(2)}</strong><small>out of {totalMarks} marks · {percentage.toFixed(2)}%</small></div><div className="result-grid"><div><strong>{questions.length}</strong><span>Total questions</span></div><div><strong>{attempted}</strong><span>Attempted</span></div><div><strong className="correct-value">{correct}</strong><span>Correct</span></div><div><strong className="incorrect-value">{incorrect}</strong><span>Incorrect</span></div><div><strong>{questions.length - attempted}</strong><span>Unanswered</span></div><div><strong>{totalMarks}</strong><span>Total marks</span></div></div><div className="result-actions"><button className="primary" onClick={() => router.push("/tests")}>Back to Tests</button><button className="secondary" onClick={() => router.push("/student")}>Back to Dashboard</button></div></section></main>;
}
