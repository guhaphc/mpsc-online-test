"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDuration, normaliseOption, OptionKey, optionKeys, questionOption, Question, TestRecord } from "@/lib/tests";

export default function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<TestRecord | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  async function load() {
    setLoading(true); setError("");
    const id = Number(testId);
    if (!Number.isInteger(id)) { setError("This test link is invalid."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    const { data: profile } = await supabase.from("mpsc_profiles").select("access_status").eq("id", user.id).single();
    if (profile?.access_status !== "approved") { router.replace("/pending"); return; }
    const [testResult, questionResult] = await Promise.all([
      supabase.from("mpsc_tests").select("*").eq("id", id).eq("is_published", true).single(),
      supabase.from("mpsc_questions").select("*").eq("test_id", id).order("question_order"),
    ]);
    if (testResult.error || questionResult.error) { setError((testResult.error || questionResult.error)?.message || "Unable to load the test."); }
    else if (!testResult.data) setError("This test is not available.");
    else if (!questionResult.data?.length) setError("This test does not have any questions yet.");
    else { const loadedTest = testResult.data as TestRecord; setTest(loadedTest); setQuestions(questionResult.data as Question[]); setSecondsLeft(Number(loadedTest.duration_minutes) * 60); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!test || loading || submitting || submitted.current) return;
    if (secondsLeft <= 0) { submitTest(true); return; }
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, test, loading, submitting]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitTest(automatic = false) {
    if (!test || submitted.current) return;
    if (!automatic && !window.confirm("Submit this test now? You will not be able to change your answers after submission.")) return;
    submitted.current = true; setSubmitting(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    const penalty = Number(test.negative_marking) > 0 ? -Number(test.negative_marking) : Number(test.negative_marking) || 0;
    const summary = questions.reduce((result, question) => {
      const selected = answers[question.id]; const correct = normaliseOption(question.correct_answer);
      if (!selected) return result;
      if (selected === correct) { result.correct += 1; result.score += Number(question.marks); }
      else { result.incorrect += 1; result.score += penalty; }
      return result;
    }, { correct: 0, incorrect: 0, score: 0 });
    const { data: attempt, error: attemptError } = await supabase.from("mpsc_attempts").insert({ user_id: user.id, test_id: test.id, score: summary.score, submitted_at: new Date().toISOString() }).select("id").single();
    if (attemptError || !attempt) { submitted.current = false; setSubmitting(false); setError(attemptError?.message || "Your attempt could not be saved. Please try again."); return; }
    const answerRows = questions.map((question) => {
      const selected = answers[question.id] || null; const correct = normaliseOption(question.correct_answer); const isCorrect = selected !== null && selected === correct;
      return { attempt_id: attempt.id, question_id: question.id, selected_option: selected, is_correct: isCorrect, marks_awarded: selected === null ? 0 : isCorrect ? Number(question.marks) : penalty };
    });
    const { error: answersError } = await supabase.from("mpsc_answers").insert(answerRows);
    if (answersError) { setSubmitting(false); setError(`Your attempt was saved, but answers could not be saved: ${answersError.message}`); return; }
    router.replace(`/tests/${test.id}/result?attempt=${attempt.id}`);
  }

  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const question = questions[current];
  if (loading) return <main className="page"><section className="card"><p>Loading your test...</p></section></main>;
  if (error && !test) return <main className="page"><section className="card"><h1>Test unavailable</h1><p className="form-error">{error}</p><button className="secondary" onClick={() => router.push("/tests")}>Back to Tests</button></section></main>;
  if (!test || !question) return null;
  return <main className="page"><section className="card test-runner">
    <header className="runner-header"><div><div className="eyebrow">{formatDuration(Number(test.duration_minutes))} test</div><h1>{test.title}</h1><p>Question {current + 1} of {questions.length}</p></div><div className={secondsLeft <= 60 ? "timer timer-warning" : "timer"} aria-label={`${time} remaining`}>⏱ {time}</div></header>
    {error && <p className="form-error">{error}</p>}
    <div className="progress-track"><span style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
    <article className="question-panel"><span className="question-label">Question {current + 1}</span><h2>{question.question_text}</h2><div className="option-list">{optionKeys.map((option) => <label className={answers[question.id] === option ? "option selected" : "option"} key={option}><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === option} onChange={() => setAnswers((value) => ({ ...value, [question.id]: option }))} /><span className="option-letter">{option}</span><span>{questionOption(question, option)}</span></label>)}</div></article>
    <div className="question-nav" aria-label="Question navigation">{questions.map((item, index) => <button type="button" key={item.id} className={`${index === current ? "current " : ""}${answers[item.id] ? "answered" : ""}`} onClick={() => setCurrent(index)} aria-label={`Question ${index + 1}${answers[item.id] ? ", answered" : ", unanswered"}`}>{index + 1}</button>)}</div>
    <p className="nav-legend"><span><i className="legend-dot answered-dot" /> Answered</span><span><i className="legend-dot" /> Unanswered</span></p>
    <div className="runner-actions"><button className="secondary" disabled={current === 0 || submitting} onClick={() => setCurrent((value) => value - 1)}>Previous</button>{current < questions.length - 1 ? <button className="secondary" disabled={submitting} onClick={() => setCurrent((value) => value + 1)}>Next</button> : <span />}</div>
    <button className="primary" disabled={submitting} onClick={() => submitTest(false)}>{submitting ? "Submitting test..." : "Submit Test"}</button>
  </section></main>;
}
