"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type CustomQuestion = {
  id: string;
  subject: string | null;
  question_text: string;
  marks: number;
  word_limit: number | null;
  source_filename: string | null;
  status: string;
  created_at: string;
};

type Evaluation = {
  awarded_marks: number;
  max_marks: number;
  evaluation_confidence: number;
  word_count: number;
  word_limit: number | null;
  criteria_scores: Array<{ criterion: string; awarded_points: number; max_points: number; feedback: string }>;
  strengths: string[];
  missing_points: string[];
  factual_errors: string[];
  feedback: string;
  answer_framework: string;
  improved_answer: string;
  evaluated_at?: string;
};

type Submission = {
  id: string;
  custom_question_id: string;
  answer_type: "typed" | "handwritten";
  answer_text: string | null;
  word_count: number;
  status: string;
  evaluation: Evaluation | null;
  created_at: string;
};

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

export default function CustomMainsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("10");
  const [wordLimit, setWordLimit] = useState("250");
  const [questionText, setQuestionText] = useState("");
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [answerMode, setAnswerMode] = useState<"typed" | "handwritten">("typed");
  const [answerText, setAnswerText] = useState("");
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [activeEvaluation, setActiveEvaluation] = useState<Evaluation | null>(null);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId],
  );

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const loadData = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      router.replace("/");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const [questionResponse, submissionResponse] = await Promise.all([
      fetch("/api/student/custom-mains/questions", { headers, cache: "no-store" }),
      fetch("/api/student/custom-mains/submissions", { headers, cache: "no-store" }),
    ]);
    if (questionResponse.status === 401 || submissionResponse.status === 401) {
      await supabase.auth.signOut();
      router.replace("/");
      return;
    }
    const questionData = await questionResponse.json().catch(() => ({}));
    const submissionData = await submissionResponse.json().catch(() => ({}));
    if (!questionResponse.ok) throw new Error(questionData.error || "Could not load your questions.");
    if (!submissionResponse.ok) throw new Error(submissionData.error || "Could not load your submissions.");
    const loadedQuestions = (questionData.questions || []) as CustomQuestion[];
    setQuestions(loadedQuestions);
    setSubmissions((submissionData.submissions || []) as Submission[]);
    setSelectedQuestionId((current) => current || loadedQuestions[0]?.id || "");
  }, [getToken, router]);

  useEffect(() => {
    loadData().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load this page."))
      .finally(() => setLoading(false));
  }, [loadData]);

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!questionText.trim() && !questionFile) {
      setError("Type the question or select a PDF/image.");
      return;
    }
    setWorking(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("question_text", questionText);
      form.append("subject", subject);
      form.append("marks", marks);
      form.append("word_limit", wordLimit);
      if (questionFile) form.append("question_file", questionFile);
      const response = await fetch("/api/student/custom-mains/questions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create the question.");
      const question = result.question as CustomQuestion;
      setQuestions((current) => [question, ...current]);
      setSelectedQuestionId(question.id);
      setQuestionText("");
      setQuestionFile(null);
      setNotice("Question saved. Its model answer and marking rubric are secured on the server for evaluation.");
      const input = document.getElementById("custom-question-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the question.");
    } finally {
      setWorking(false);
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuestion) {
      setError("Select one of your questions first.");
      return;
    }
    if (answerMode === "typed" && !answerText.trim()) {
      setError("Enter your answer before submitting.");
      return;
    }
    if (answerMode === "handwritten" && !answerFiles.length) {
      setError("Upload at least one handwritten page or a PDF.");
      return;
    }
    setError("");
    setNotice("");
    setActiveEvaluation(null);
    setWorking(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("question_id", selectedQuestion.id);
      form.append("answer_type", answerMode);
      form.append("answer_text", answerText);
      answerFiles.forEach((file) => form.append("files", file));
      const response = await fetch("/api/student/custom-mains/submissions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit your answer.");
      if (answerMode === "handwritten") {
        setAnswerText(String(result.extracted_text || ""));
        setNotice(`Handwritten pages uploaded and transcribed (OCR confidence: ${Math.round((Number(result.ocr_confidence) || 0) * 100)}%). Review or correct the transcription below, then save it before evaluation.`);
      } else {
        setNotice("Your answer has been submitted. You can now evaluate it against the saved marking rubric.");
      }
      setAnswerFiles([]);
      const input = document.getElementById("custom-answer-files") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadData();
      if (result.submission?.id) {
        setSubmissions((current) => {
          const existing = current.filter((item) => item.id !== result.submission.id);
          return [{ ...result.submission, answer_text: result.extracted_text || answerText, evaluation: null, created_at: new Date().toISOString() }, ...existing] as Submission[];
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit your answer.");
    } finally {
      setWorking(false);
    }
  }

  async function saveTranscription(submission: Submission) {
    setError("");
    setNotice("");
    setWorking(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/student/custom-mains/submissions", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submission.id, answer_text: answerText }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save transcription.");
      setSubmissions((current) => current.map((item) => item.id === submission.id
        ? { ...item, answer_text: answerText, word_count: wordCount(answerText), status: "submitted" }
        : item));
      setEditingSubmissionId(null);
      setNotice("Transcription saved. Evaluate when you are ready.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save transcription.");
    } finally {
      setWorking(false);
    }
  }

  async function evaluateSubmission(submission: Submission) {
    setError("");
    setNotice("");
    setActiveEvaluation(null);
    setEvaluatingId(submission.id);
    try {
      const token = await getToken();
      const response = await fetch("/api/student/custom-mains/evaluate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submission.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not evaluate the answer.");
      setActiveEvaluation(result.evaluation as Evaluation);
      setSubmissions((current) => current.map((item) => item.id === submission.id
        ? { ...item, status: "evaluated", evaluation: result.evaluation as Evaluation }
        : item));
      setNotice("Evaluation completed using the marking rubric saved when you created the question.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not evaluate the answer.");
    } finally {
      setEvaluatingId(null);
    }
  }

  function handleAnswerFiles(event: ChangeEvent<HTMLInputElement>) {
    setAnswerFiles(Array.from(event.target.files || []));
  }

  if (loading) return <main className="page"><section className="card"><p>Loading your custom Mains workspace…</p></section></main>;

  return (
    <main className="page">
      <section className="card" style={{ width: "min(100%, 1000px)", margin: "0 auto" }}>
        <button type="button" className="secondary" onClick={() => router.push("/student")}>← Student Dashboard</button>
        <div className="brand" style={{ marginTop: 18 }}>MPSC / UPSC · MAINS PRACTICE</div>
        <h1>Upload Your Own Mains Question</h1>
        <p className="muted">Create a question, submit a typed or handwritten answer, and receive detailed evaluation against a marking guide saved before your answer is assessed.</p>

        {error && <div role="alert" style={{ padding: 12, margin: "14px 0", borderRadius: 8, background: "#fff0f0", color: "#9b1c1c" }}>{error}</div>}
        {notice && <div role="status" style={{ padding: 12, margin: "14px 0", borderRadius: 8, background: "#edf8ef", color: "#176b31" }}>{notice}</div>}

        <section style={{ border: "1px solid var(--border, #ddd)", borderRadius: 12, padding: 18, marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>1. Add your question</h2>
          <p className="muted">Type/paste the question or upload a PDF/image. AI prepares a model answer and marking rubric privately on the server.</p>
          <form onSubmit={createQuestion}>
            <label htmlFor="custom-subject">Subject (optional)</label>
            <input id="custom-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="e.g. Polity, Ethics, History" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
              <div><label htmlFor="custom-marks">Maximum marks</label><input id="custom-marks" type="number" min="1" max="100" value={marks} onChange={(event) => setMarks(event.target.value)} required /></div>
              <div><label htmlFor="custom-word-limit">Word limit (optional)</label><input id="custom-word-limit" type="number" min="25" max="5000" value={wordLimit} onChange={(event) => setWordLimit(event.target.value)} placeholder="e.g. 250" /></div>
            </div>
            <label htmlFor="custom-question-text" style={{ display: "block", marginTop: 12 }}>Question text</label>
            <textarea id="custom-question-text" value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={5} maxLength={15000} placeholder="Type or paste the complete question here…" />
            <label htmlFor="custom-question-file" style={{ display: "block", marginTop: 12 }}>Or upload question (PDF/JPG/PNG/WebP, up to 8 MB)</label>
            <input id="custom-question-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setQuestionFile(event.target.files?.[0] || null)} />
            {questionFile && <p className="muted">Selected: {questionFile.name}</p>}
            <button className="primary" type="submit" disabled={working} style={{ marginTop: 16 }}>{working ? "Preparing question…" : "Create question & marking guide"}</button>
          </form>
        </section>

        <section style={{ border: "1px solid var(--border, #ddd)", borderRadius: 12, padding: 18, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>2. Submit your answer</h2>
          {questions.length === 0 ? <p className="muted">Create a question above to begin.</p> : <>
            <label htmlFor="custom-question-select">Choose your question</label>
            <select id="custom-question-select" value={selectedQuestionId} onChange={(event) => { setSelectedQuestionId(event.target.value); setActiveEvaluation(null); }} style={{ width: "100%", marginBottom: 12 }}>
              {questions.map((question) => <option key={question.id} value={question.id}>{question.subject ? `${question.subject} · ` : ""}{question.question_text.slice(0, 130)}{question.question_text.length > 130 ? "…" : ""} ({question.marks} marks)</option>)}
            </select>
            {selectedQuestion && <div style={{ background: "var(--surface, #f7f7f7)", borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <strong>{selectedQuestion.subject || "Mains question"} · {selectedQuestion.marks} marks{selectedQuestion.word_limit ? ` · ${selectedQuestion.word_limit} words` : ""}</strong>
              <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{selectedQuestion.question_text}</p>
            </div>}
            <div role="group" aria-label="Answer type" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <button type="button" className={answerMode === "typed" ? "primary" : "secondary"} onClick={() => setAnswerMode("typed")}>Type answer</button>
              <button type="button" className={answerMode === "handwritten" ? "primary" : "secondary"} onClick={() => setAnswerMode("handwritten")}>Upload handwritten pages</button>
            </div>
            <form onSubmit={submitAnswer}>
              {answerMode === "typed" ? <>
                <label htmlFor="custom-answer-text">Your answer</label>
                <textarea id="custom-answer-text" value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={10} maxLength={50000} placeholder="Write your answer with introduction, main points and conclusion…" />
                <p className="muted">{wordCount(answerText)} words</p>
              </> : <>
                <label htmlFor="custom-answer-files">Handwritten pages or one PDF (up to 12 files; 8 MB each)</label>
                <input id="custom-answer-files" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={handleAnswerFiles} />
                {answerFiles.length > 0 && <p className="muted">{answerFiles.length} file(s) selected. Arrange image files in page order before selecting.</p>}
                {answerText && <>
                  <label htmlFor="custom-ocr-text" style={{ display: "block", marginTop: 14 }}>OCR transcription — review and correct before evaluation</label>
                  <textarea id="custom-ocr-text" value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={8} />
                  <p className="muted">{wordCount(answerText)} words</p>
                </>}
              </>}
              <button className="primary" type="submit" disabled={working} style={{ marginTop: 10 }}>{working ? "Submitting…" : answerMode === "typed" ? "Submit typed answer" : "Upload pages & transcribe"}</button>
            </form>
            {answerMode === "handwritten" && answerText && submissions.some((item) => item.status === "submitted" && item.answer_text === answerText) && (
              <p className="muted">After OCR, choose the matching submission below to save corrections and evaluate it.</p>
            )}
          </>}
        </section>

        {submissions.length > 0 && <section style={{ border: "1px solid var(--border, #ddd)", borderRadius: 12, padding: 18, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>3. Your submissions & results</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {submissions.map((submission) => {
              const question = questions.find((item) => item.id === submission.custom_question_id);
              return <article key={submission.id} style={{ border: "1px solid var(--border, #ddd)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong>{question?.subject || "Mains answer"} · {question?.marks || submission.evaluation?.max_marks || "—"} marks</strong>
                  <span className="muted">{submission.status === "evaluated" ? "Evaluated" : "Awaiting evaluation"} · {new Date(submission.created_at).toLocaleDateString()}</span>
                </div>
                <p className="muted">{submission.answer_type === "handwritten" ? "Handwritten/OCR" : "Typed"} · {submission.word_count} words</p>
                {submission.status !== "evaluated" ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {submission.answer_type === "handwritten" && <button type="button" className="secondary" onClick={() => { setSelectedQuestionId(submission.custom_question_id); setAnswerMode("handwritten"); setAnswerText(submission.answer_text || ""); setEditingSubmissionId(submission.id); }}>Review transcription</button>}
                  {submission.answer_type === "handwritten" && editingSubmissionId === submission.id && <button type="button" className="secondary" disabled={working} onClick={() => saveTranscription(submission)}>{working ? "Saving…" : "Save corrected transcription"}</button>}
                  <button type="button" className="primary" disabled={evaluatingId === submission.id} onClick={() => evaluateSubmission(submission)}>{evaluatingId === submission.id ? "Evaluating…" : "Evaluate answer"}</button>
                </div> : <button type="button" className="secondary" onClick={() => setActiveEvaluation(submission.evaluation)}>View evaluation</button>}
              </article>;
            })}
          </div>
        </section>}

        {activeEvaluation && <section style={{ border: "2px solid var(--accent, #3559e0)", borderRadius: 12, padding: 18, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Evaluation result</h2>
          <div style={{ fontSize: 28, fontWeight: 750 }}>{activeEvaluation.awarded_marks} / {activeEvaluation.max_marks} marks</div>
          <p className="muted">{activeEvaluation.word_count} words{activeEvaluation.word_limit ? ` · Word limit: ${activeEvaluation.word_limit}` : ""} · AI confidence: {Math.round(activeEvaluation.evaluation_confidence * 100)}%</p>
          <h3>Criterion-wise marks</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {activeEvaluation.criteria_scores.map((criterion) => <div key={criterion.criterion} style={{ padding: 10, borderRadius: 8, background: "var(--surface, #f7f7f7)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{criterion.criterion}</strong><strong>{criterion.awarded_points} / {criterion.max_points}</strong></div>
              <p style={{ marginBottom: 0 }}>{criterion.feedback}</p>
            </div>)}
          </div>
          <h3>Overall feedback</h3><p style={{ whiteSpace: "pre-wrap" }}>{activeEvaluation.feedback}</p>
          <h3>Strengths</h3>{activeEvaluation.strengths.length ? <ul>{activeEvaluation.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>—</p>}
          <h3>Missing points</h3>{activeEvaluation.missing_points.length ? <ul>{activeEvaluation.missing_points.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>—</p>}
          <h3>Factual errors</h3>{activeEvaluation.factual_errors.length ? <ul>{activeEvaluation.factual_errors.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>None identified.</p>}
          <h3>Suggested answer framework</h3><p style={{ whiteSpace: "pre-wrap" }}>{activeEvaluation.answer_framework}</p>
          <h3>Improved model answer</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{activeEvaluation.improved_answer}</div>
        </section>}
      </section>
    </main>
  );
}
