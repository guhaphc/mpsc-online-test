"use client";

import { ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  word_limit_exceeded_by: number;
  word_limit_overage_percent: number;
  word_limit_warning_level: "none" | "notice" | "strict";
  word_limit_warning: string | null;
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

function formatLines(value: string | null | undefined) {
  return escapeHtml(value || "Not available").replace(/\n/g, "<br>");
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
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [answerSectionOpen, setAnswerSectionOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"question" | "answer" | null>(null);
  const [cropIndex, setCropIndex] = useState(0);
  const [cropMargins, setCropMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [cropDrag, setCropDrag] = useState<{ edges: string[]; startX: number; startY: number; initial: typeof cropMargins } | null>(null);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropPreviewUrl, setCropPreviewUrl] = useState("");

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

  function clearCurrentWork() {
    const hasWork = Boolean(questionText.trim() || questionFile || answerText.trim() || answerFiles.length || activeEvaluation);
    if (hasWork && !window.confirm("Start a new question? The current on-screen question, answer, uploaded files and evaluation will be cleared. Saved questions and evaluation history will remain safe.")) return;
    setError("");
    setNotice("Current work cleared. Your saved questions and evaluation history are unchanged.");
    setSubject("");
    setMarks("10");
    setWordLimit("250");
    setQuestionText("");
    setQuestionFile(null);
    setSelectedQuestionId("");
    setAnswerMode("typed");
    setAnswerText("");
    setAnswerFiles([]);
    setActiveEvaluation(null);
    setActiveSubmissionId(null);
    setEditingSubmissionId(null);
    setAnswerSectionOpen(false);
    const questionInput = document.getElementById("custom-question-file") as HTMLInputElement | null;
    if (questionInput) questionInput.value = "";
    const answerInput = document.getElementById("custom-answer-files") as HTMLInputElement | null;
    if (answerInput) answerInput.value = "";
  }

  async function printEvaluationPdf() {
    if (!activeEvaluation || !activeSubmissionId) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Your browser blocked the print window. Allow pop-ups for this site and try again.");
      return;
    }
    printWindow.document.write("<!doctype html><html><head><title>Mains Evaluation Report</title></head><body><p>Preparing your report…</p></body></html>");
    printWindow.document.close();
    try {
      const submission = submissions.find((item) => item.id === activeSubmissionId);
      const question = submission ? questions.find((item) => item.id === submission.custom_question_id) : null;
      if (!submission || !question) throw new Error("Could not find the question and answer for this evaluation.");
      const token = await getToken();
      const modelResponse = await fetch(`/api/student/custom-mains/questions/${encodeURIComponent(question.id)}/model-answer`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const modelData = await modelResponse.json().catch(() => ({}));
      if (!modelResponse.ok) throw new Error(modelData.error || "Could not load the saved model answer.");
      const evaluation = activeEvaluation;
      const criteriaHtml = evaluation.criteria_scores.map((item) =>
        `<tr><td>${escapeHtml(item.criterion)}</td><td>${item.awarded_points} / ${item.max_points}</td><td>${formatLines(item.feedback)}</td></tr>`
      ).join("");
      const listHtml = (items: string[]) => items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>None recorded.</p>";
      const reportHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>MPSC/UPSC Mains Evaluation Report</title>
<style>
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: Arial, "Noto Sans Devanagari", sans-serif; color: #182230; font-size: 11pt; line-height: 1.55; }
header { border-bottom: 2px solid #243b53; padding-bottom: 12px; margin-bottom: 20px; }
h1 { font-size: 21pt; margin: 0 0 5px; color: #162d4d; }
.subtitle { color: #526174; margin: 0; }
h2 { font-size: 15pt; color: #17365d; border-bottom: 1px solid #d7dee8; padding-bottom: 5px; margin-top: 24px; }
h3 { font-size: 12pt; margin-bottom: 6px; }
.question { font-size: 12pt; font-weight: 700; background: #f2f5f9; border-left: 4px solid #243b53; padding: 12px; white-space: normal; }
.score { font-size: 18pt; font-weight: 700; margin: 12px 0; }
.meta { color: #526174; font-size: 9pt; }
.content { overflow-wrap: anywhere; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 10px 0 16px; }
th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; }
th { background: #edf2f7; }
li { margin-bottom: 5px; }
tr { break-inside: avoid; }
footer { margin-top: 26px; padding-top: 8px; border-top: 1px solid #d7dee8; color: #64748b; font-size: 8.5pt; }
</style></head><body>
<header><h1>MPSC / UPSC MAINS</h1><p class="subtitle">Answer Evaluation & Improvement Report</p><p class="meta">Generated: ${escapeHtml(new Date().toLocaleString())} · Subject: ${escapeHtml(question.subject || "Not specified")}</p></header>
<section><h2>1. Question</h2><div class="question">${formatLines(question.question_text)}</div><p class="meta">Maximum marks: ${question.marks} · Word limit: ${question.word_limit || "Not specified"}</p><div class="score">Score: ${evaluation.awarded_marks} / ${evaluation.max_marks}</div><p class="meta">Student answer word count: ${evaluation.word_count} · AI confidence: ${Math.round(evaluation.evaluation_confidence * 100)}%</p></section>
<section><h2>2. Student's Answer</h2><div class="content">${formatLines(submission.answer_text)}</div></section>
<section><h2>3. AI Model Answer</h2><div class="content">${formatLines(String(modelData.model_answer || evaluation.improved_answer || ""))}</div></section>
<section><h2>4. Detailed Evaluation</h2><table><thead><tr><th>Criterion</th><th>Marks</th><th>Examiner's feedback</th></tr></thead><tbody>${criteriaHtml}</tbody></table>
<h3>Overall feedback</h3><div class="content">${formatLines(evaluation.feedback)}</div>
<h3>Strengths</h3>${listHtml(evaluation.strengths)}
<h3>Missing points</h3>${listHtml(evaluation.missing_points)}
<h3>Factual errors</h3>${listHtml(evaluation.factual_errors)}
${evaluation.word_limit_warning ? `<h3>Word-limit guidance</h3><p>${escapeHtml(evaluation.word_limit_warning)} No marks are deducted solely for exceeding the word limit.</p>` : ""}
</section>
<section><h2>5. Guidance to Improve</h2><h3>Suggested answer framework</h3><div class="content">${formatLines(evaluation.answer_framework)}</div><h3>Improved answer for practice</h3><div class="content">${formatLines(evaluation.improved_answer)}</div></section>
<section><h2>6. Action Plan for the Next Answer</h2><ol><li>Identify every demand in the question before writing.</li><li>Prepare a brief introduction, structured main body and focused conclusion.</li><li>Include relevant analysis and examples, not just keywords.</li><li>Check factual accuracy and remove repetition or irrelevant material.</li><li>Follow the prescribed word limit while covering the key points.</li></ol></section>
<footer>Study feedback generated with AI. Verify factual claims and official references before using them in an examination answer.</footer>
<script>window.onload = () => setTimeout(() => window.print(), 350);</script>
</body></html>`;
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      setError("");
      setNotice("Evaluation report prepared. In the print dialog, choose Save as PDF to download it.");
    } catch (reason) {
      printWindow.close();
      setError(reason instanceof Error ? reason.message : "Could not prepare the PDF report.");
    }
  }

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
      setAnswerSectionOpen(true);
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
    setActiveSubmissionId(null);
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
      setActiveSubmissionId(submission.id);
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

  const cropFile = cropTarget === "question" ? questionFile : answerFiles[cropIndex] || null;

  useEffect(() => {
    if (!cropFile || cropFile.type === "application/pdf" || !cropTarget) {
      setCropPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(cropFile);
    setCropPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cropFile, cropTarget]);

  function openCrop(target: "question" | "answer", index = 0) {
    setCropTarget(target);
    setCropIndex(index);
    setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    setError("");
  }

  function closeCrop() {
    if (cropBusy) return;
    setCropTarget(null);
    setCropPreviewUrl("");
    setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 });
  }

  function updateCropFromPointer(event: ReactPointerEvent<HTMLElement>, edges: string[], startX: number, startY: number, initial: typeof cropMargins) {
    const imageElement = document.getElementById("crop-editor-image");
    if (!imageElement) return;
    const bounds = imageElement.getBoundingClientRect();
    const dx = ((event.clientX - startX) / bounds.width) * 100;
    const dy = ((event.clientY - startY) / bounds.height) * 100;
    setCropMargins({
      top: Math.max(0, Math.min(80, initial.top + (edges.includes("top") ? dy : 0))),
      right: Math.max(0, Math.min(80, initial.right + (edges.includes("right") ? -dx : 0))),
      bottom: Math.max(0, Math.min(80, initial.bottom + (edges.includes("bottom") ? -dy : 0))),
      left: Math.max(0, Math.min(80, initial.left + (edges.includes("left") ? dx : 0))),
    });
  }

  function beginCropDrag(event: ReactPointerEvent<HTMLElement>, edges: string[]) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropDrag({ edges, startX: event.clientX, startY: event.clientY, initial: cropMargins });
  }

  async function applyCrop() {
    if (!cropFile || !cropPreviewUrl) return;
    setCropBusy(true);
    try {
      const sourceUrl = URL.createObjectURL(cropFile);
      try {
        const image = new Image();
        image.src = sourceUrl;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Could not load this image for cropping."));
        });
        const left = Math.min(80, Math.max(0, cropMargins.left));
        const right = Math.min(80, Math.max(0, cropMargins.right));
        const top = Math.min(80, Math.max(0, cropMargins.top));
        const bottom = Math.min(80, Math.max(0, cropMargins.bottom));
        if (left + right >= 95 || top + bottom >= 95) throw new Error("Keep a readable area of the image inside the crop.");
        const x = Math.round(image.naturalWidth * left / 100);
        const y = Math.round(image.naturalHeight * top / 100);
        const width = Math.max(1, Math.round(image.naturalWidth * (100 - left - right) / 100));
        const height = Math.max(1, Math.round(image.naturalHeight * (100 - top - bottom) / 100));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare the cropped image.");
        context.drawImage(image, x, y, width, height, 0, 0, width, height);
        const mime = cropFile.type === "image/png" ? "image/png" : cropFile.type === "image/webp" ? "image/webp" : "image/jpeg";
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.94));
        if (!blob) throw new Error("Could not create the cropped image.");
        const extension = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
        const cropped = new File([blob], cropFile.name.replace(/\\.[^.]+$/, "") + "-cropped" + extension, { type: mime, lastModified: Date.now() });
        if (cropTarget === "question") setQuestionFile(cropped);
        else setAnswerFiles((current) => current.map((file, index) => index === cropIndex ? cropped : file));
        setNotice("Crop applied. You can reopen the editor to adjust the image again.");
        setCropTarget(null);
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not crop this image.");
    } finally {
      setCropBusy(false);
    }
  }

  function handleAnswerFiles(event: ChangeEvent<HTMLInputElement>) {
    setAnswerFiles(Array.from(event.target.files || []));
  }

  if (loading) return <main className="page"><section className="card"><p>Loading your custom Mains workspace…</p></section></main>;

  return (
    <main className="page custom-mains-page">
      <section className="card custom-mains-shell" style={{ width: "min(100%, 1000px)", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
          <button type="button" className="secondary" onClick={() => router.push("/student")}>← Student Dashboard</button>
          <button type="button" className="secondary" onClick={clearCurrentWork}>＋ New Question / Clear Current Work</button>
        </div>
        <div className="brand custom-mains-eyebrow" style={{ marginTop: 18 }}>MPSC / UPSC · MAINS PRACTICE</div>
        <h1 className="custom-mains-title">Upload Your Own Mains Question</h1>
        <p className="muted custom-mains-intro">Create a question, submit a typed or handwritten answer, and receive detailed evaluation against a marking guide saved before your answer is assessed.</p>
        <div className="custom-mains-steps" aria-label="Practice steps"><span>01&nbsp; Create question</span><span>02&nbsp; Write answer</span><span>03&nbsp; Review feedback</span></div>

        {error && <div role="alert" style={{ padding: 12, margin: "14px 0", borderRadius: 8, background: "#fff0f0", color: "#9b1c1c" }}>{error}</div>}
        {notice && <div role="status" style={{ padding: 12, margin: "14px 0", borderRadius: 8, background: "#edf8ef", color: "#176b31" }}>{notice}</div>}

        <details className="custom-mains-section custom-mains-accordion" style={{ marginTop: 20 }}>
          <summary className="custom-mains-summary"><span className="custom-mains-summary-title"><span className="custom-mains-number">01</span><span><strong>Add your question</strong><small>Type a question or upload a PDF/image</small></span></span><span className="custom-mains-chevron" aria-hidden="true">⌄</span></summary>
          <div className="custom-mains-panel-content">
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
            <label htmlFor="custom-question-file" style={{ display: "block", marginTop: 12 }}>Or upload question (PDF/JPG/PNG/WebP, up to 4 MB)</label>
            <input id="custom-question-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setQuestionFile(event.target.files?.[0] || null)} />
            {questionFile && <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <p className="muted" style={{ margin: 0 }}>Selected: {questionFile.name}</p>
              {questionFile.type.startsWith("image/") && <button type="button" className="secondary" onClick={() => openCrop("question")}>✂️ Crop question image</button>}
              {questionFile.type === "application/pdf" && <span className="muted">Cropping is available for image uploads; PDF pages remain unchanged.</span>}
              <button type="button" className="secondary" onClick={() => { setQuestionFile(null); const input = document.getElementById("custom-question-file") as HTMLInputElement | null; if (input) input.value = ""; }}>Remove / Reset</button>
            </div>}
            <button className="primary" type="submit" disabled={working} style={{ marginTop: 16 }}>{working ? "Preparing question…" : "Create question & marking guide"}</button>
          </form>
          </div>
        </details>

        <details className="custom-mains-section custom-mains-accordion" style={{ marginTop: 14 }} open={answerSectionOpen}>
          <summary className="custom-mains-summary"><span className="custom-mains-summary-title"><span className="custom-mains-number">02</span><span><strong>Write your answer</strong><small>{questions.length ? "Choose a question and submit your response" : "Create a question first to unlock this step"}</small></span></span><span className="custom-mains-chevron" aria-hidden="true">⌄</span></summary>
          <div className="custom-mains-panel-content">
          {questions.length === 0 ? <p className="muted">Create a question above to begin.</p> : <>
            <label htmlFor="custom-question-select">Choose your question</label>
            <select id="custom-question-select" value={selectedQuestionId} onChange={(event) => { setSelectedQuestionId(event.target.value); setActiveEvaluation(null); setActiveSubmissionId(null); }} style={{ width: "100%", marginBottom: 12 }}>
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
                <label htmlFor="custom-answer-files">Handwritten pages or one multi-page PDF (maximum 4 MB total; up to 4 images)</label>
                <input id="custom-answer-files" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={handleAnswerFiles} />
                {answerFiles.length > 0 && <>
                  <p className="muted">{answerFiles.length} file(s) selected. Keep all files under 4 MB combined and arrange image files in page order before selecting.</p>
                  <div style={{ display: "grid", gap: 8, margin: "10px 0" }}>
                    {answerFiles.map((file, index) => <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", border: "1px solid var(--border, #ddd)", borderRadius: 8, padding: 10 }}>
                      <span style={{ overflowWrap: "anywhere" }}>Page {index + 1}: {file.name}</span>
                      {file.type.startsWith("image/") ? <button type="button" className="secondary" onClick={() => openCrop("answer", index)} disabled={working}>✂️ Crop page</button> : <span className="muted">PDF page — crop unavailable</span>}
                    </div>)}
                  </div>
                </>}
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
          </div>
        </details>

        {submissions.length > 0 && <details className="custom-mains-section custom-mains-accordion" style={{ marginTop: 14 }}>
          <summary className="custom-mains-summary"><span className="custom-mains-summary-title"><span className="custom-mains-number">03</span><span><strong>Your submissions & results</strong><small>{submissions.length} submission{submissions.length === 1 ? "" : "s"} · Open to review feedback</small></span></span><span className="custom-mains-chevron" aria-hidden="true">⌄</span></summary>
          <div className="custom-mains-panel-content">
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
                </div> : <button type="button" className="secondary" onClick={() => { setSelectedQuestionId(submission.custom_question_id); setActiveEvaluation(submission.evaluation); setActiveSubmissionId(submission.id); }}>View evaluation</button>}
              </article>;
            })}
          </div>
          </div>
        </details>}

        {cropTarget && cropFile && <div role="dialog" aria-modal="true" aria-label="Crop uploaded image" style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#101827", display: "flex", flexDirection: "column", padding: "max(10px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))", color: "#fff" }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 48, flexShrink: 0 }}>
            <button type="button" onClick={closeCrop} disabled={cropBusy} aria-label="Close crop editor" style={{ border: 0, color: "#fff", background: "transparent", fontSize: 26, padding: "4px 10px" }}>✕</button>
            <div style={{ minWidth: 0, textAlign: "center" }}><strong style={{ display: "block", fontSize: 16 }}>Crop image</strong><small style={{ color: "#cbd5e1" }}>{cropTarget === "question" ? "Question image" : `Answer page ${cropIndex + 1}`}</small></div>
            <button type="button" onClick={() => { setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 }); }} disabled={cropBusy} style={{ border: "1px solid #64748b", borderRadius: 9, padding: "8px 12px", color: "#fff", background: "#263449" }}>Reset</button>
          </header>
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "8px 0 12px", touchAction: "none" }}>
            {cropPreviewUrl ? <div style={{ position: "relative", display: "inline-block", maxWidth: "96vw", maxHeight: "72vh", lineHeight: 0, userSelect: "none", touchAction: "none" }}>
              <img id="crop-editor-image" src={cropPreviewUrl} alt="Image to crop" draggable={false} style={{ display: "block", width: "auto", height: "auto", maxWidth: "96vw", maxHeight: "72vh", objectFit: "contain" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.48)", clipPath: `polygon(0 0, 100% 0, 100% ${100 - cropMargins.bottom}%, ${100 - cropMargins.right}% ${100 - cropMargins.bottom}%, ${100 - cropMargins.right}% ${cropMargins.top}%, ${cropMargins.left}% ${cropMargins.top}%, ${cropMargins.left}% ${100 - cropMargins.bottom}%, 0 ${100 - cropMargins.bottom}%)` }} />
                <div style={{ position: "absolute", left: `${cropMargins.left}%`, right: `${cropMargins.right}%`, top: `${cropMargins.top}%`, bottom: `${cropMargins.bottom}%`, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(15,23,42,.75)", pointerEvents: "auto", touchAction: "none" }}
                  onPointerMove={(event) => { if (cropDrag) updateCropFromPointer(event, cropDrag.edges, cropDrag.startX, cropDrag.startY, cropDrag.initial); }}
                  onPointerUp={() => setCropDrag(null)} onPointerCancel={() => setCropDrag(null)}>
                  {[
                    { name: "top-left", edges: ["top", "left"], pos: { top: -8, left: -8, cursor: "nwse-resize" } },
                    { name: "top", edges: ["top"], pos: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize", width: 42, height: 10 } },
                    { name: "top-right", edges: ["top", "right"], pos: { top: -8, right: -8, cursor: "nesw-resize" } },
                    { name: "right", edges: ["right"], pos: { right: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize", width: 10, height: 42 } },
                    { name: "bottom-right", edges: ["bottom", "right"], pos: { bottom: -8, right: -8, cursor: "nwse-resize" } },
                    { name: "bottom", edges: ["bottom"], pos: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize", width: 42, height: 10 } },
                    { name: "bottom-left", edges: ["bottom", "left"], pos: { bottom: -8, left: -8, cursor: "nesw-resize" } },
                    { name: "left", edges: ["left"], pos: { left: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize", width: 10, height: 42 } },
                  ].map((handle) => <button key={handle.name} type="button" aria-label={`Adjust ${handle.name} crop edge`} onPointerDown={(event) => beginCropDrag(event, handle.edges)} onPointerMove={(event) => { if (cropDrag) updateCropFromPointer(event, cropDrag.edges, cropDrag.startX, cropDrag.startY, cropDrag.initial); }} onPointerUp={() => setCropDrag(null)} onPointerCancel={() => setCropDrag(null)} style={{ position: "absolute", ...handle.pos, width: handle.pos.width || 18, height: handle.pos.height || 18, border: "2px solid #fff", borderRadius: handle.name.length > 5 && handle.name.includes("-") ? 4 : 7, background: "#2563eb", boxShadow: "0 1px 5px rgba(0,0,0,.6)", padding: 0, pointerEvents: "auto", touchAction: "none" }} />)}
                  <div style={{ position: "absolute", left: "33.33%", right: "33.33%", top: 0, bottom: 0, borderLeft: "1px solid rgba(255,255,255,.55)", borderRight: "1px solid rgba(255,255,255,.55)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", top: "33.33%", bottom: "33.33%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,.55)", borderBottom: "1px solid rgba(255,255,255,.55)", pointerEvents: "none" }} />
                </div>
              </div>
            </div> : <p role="alert">Image preview unavailable. Please reselect the image.</p>}
          </div>
          <footer style={{ flexShrink: 0, borderTop: "1px solid #334155", paddingTop: 10 }}>
            <p style={{ color: "#cbd5e1", fontSize: 13, textAlign: "center", margin: "0 0 10px" }}>Drag the corner or side handles to frame the text. The area outside the frame will be removed.</p>
            <button type="button" onClick={applyCrop} disabled={cropBusy || !cropPreviewUrl || cropMargins.left + cropMargins.right >= 95 || cropMargins.top + cropMargins.bottom >= 95} style={{ width: "100%", border: 0, borderRadius: 12, padding: "14px 18px", color: "#fff", background: "#2563eb", fontSize: 16, fontWeight: 700 }}>{cropBusy ? "Applying crop…" : "Apply Crop"}</button>
          </footer>
        </div>}

        {activeEvaluation && <details open className="custom-mains-section custom-mains-evaluation custom-mains-accordion" style={{ marginTop: 14 }}>
          <summary className="custom-mains-summary"><span className="custom-mains-summary-title"><span className="custom-mains-number custom-mains-number-gold">✓</span><span><strong>Evaluation result</strong><small>{activeEvaluation.awarded_marks} / {activeEvaluation.max_marks} marks · Detailed feedback</small></span></span><span className="custom-mains-chevron" aria-hidden="true">⌄</span></summary>
          <div className="custom-mains-panel-content">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><button type="button" className="primary" onClick={printEvaluationPdf}>📄 Print / Download Evaluation PDF</button></div>
          <div style={{ fontSize: 28, fontWeight: 750 }}>{activeEvaluation.awarded_marks} / {activeEvaluation.max_marks} marks</div>
          <p className="muted">{activeEvaluation.word_count} words{activeEvaluation.word_limit ? ` · Word limit: ${activeEvaluation.word_limit}` : ""} · AI confidence: {Math.round(activeEvaluation.evaluation_confidence * 100)}%</p>
          {activeEvaluation.word_limit_warning && <div role="alert" aria-live="polite" style={{ padding: 14, margin: "12px 0 18px", borderRadius: 10, border: activeEvaluation.word_limit_warning_level === "strict" ? "1px solid #d97706" : "1px solid #e5b85c", background: activeEvaluation.word_limit_warning_level === "strict" ? "#fff4e5" : "#fff9e8", color: "#78350f" }}>
            <strong>{activeEvaluation.word_limit_warning_level === "strict" ? "⚠ Strict word-limit warning" : "⚠ Word-limit notice"}</strong>
            <p style={{ margin: "6px 0 0" }}>{activeEvaluation.word_limit_warning}</p>
            <small>No marks are deducted solely for exceeding the word limit.</small>
          </div>}
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
          </div>
        </details>}
      </section>
    </main>
  );
}
