"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDuration, formatPenalty, optionKeys, Question, TestRecord } from "@/lib/tests";

type Stage = { id: number; name: string; sort_order: number };
type Paper = { id: number; stage_id: number; paper_no: number; name: string; sort_order: number };
type SyllabusItem = { id: number; paper_id: number; parent_id: number | null; item_type: string; name: string; sort_order: number };
type TestForm = { title: string; stage_id: string; paper_id: string; subject_id: string; syllabus_item_id: string; duration_minutes: string; total_marks: string; negative_marking: string; is_published: boolean };
type QuestionForm = { id?: number; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; marks: string; explanation: string; sort_order: string };

const blankTest = (): TestForm => ({ title: "", stage_id: "", paper_id: "", subject_id: "", syllabus_item_id: "", duration_minutes: "60", total_marks: "100", negative_marking: "0", is_published: false });
const blankQuestion = (order = 1): QuestionForm => ({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", marks: "1", explanation: "", sort_order: String(order) });

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestRecord[]>([]); const [stages, setStages] = useState<Stage[]>([]); const [papers, setPapers] = useState<Paper[]>([]); const [items, setItems] = useState<SyllabusItem[]>([]);
  const [form, setForm] = useState<TestForm>(blankTest()); const [editing, setEditing] = useState<TestRecord | null>(null); const [questions, setQuestions] = useState<Question[]>([]); const [questionForm, setQuestionForm] = useState<QuestionForm | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [busyId, setBusyId] = useState<number | null>(null); const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    const { data: profile, error: profileError } = await supabase.from("mpsc_profiles").select("role, access_status").eq("id", user.id).single();
    if (profileError || profile?.role !== "admin" || profile.access_status !== "approved") { router.replace("/"); return; }
    const [testResult, stageResult, paperResult, itemResult] = await Promise.all([
      supabase.from("mpsc_tests").select("*").order("created_at", { ascending: false }),
      supabase.from("mpsc_exam_stages").select("id, name, sort_order").order("sort_order"),
      supabase.from("mpsc_papers").select("id, stage_id, paper_no, name, sort_order").order("sort_order"),
      supabase.from("mpsc_syllabus_items").select("id, paper_id, parent_id, item_type, name, sort_order").order("sort_order"),
    ]);
    const firstError = testResult.error || stageResult.error || paperResult.error || itemResult.error;
    if (firstError) setError(firstError.message); else { setTests((testResult.data ?? []) as TestRecord[]); setStages(stageResult.data ?? []); setPapers(paperResult.data ?? []); setItems(itemResult.data ?? []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const matchingPapers = useMemo(() => papers.filter((paper) => paper.stage_id === Number(form.stage_id)), [papers, form.stage_id]);
  const subjects = useMemo(() => items.filter((item) => item.paper_id === Number(form.paper_id) && item.item_type === "subject" && item.parent_id === null), [items, form.paper_id]);
  const topics = useMemo(() => items.filter((item) => item.parent_id === Number(form.subject_id) && (item.item_type === "topic" || item.item_type === "subtopic")), [items, form.subject_id]);
  const itemName = (id: number | null) => items.find((item) => item.id === id)?.name;
  const paperName = (id: number | null) => { const paper = papers.find((entry) => entry.id === id); return paper ? `Paper ${paper.paper_no} · ${paper.name}` : "No paper selected"; };

  function startNew() { setEditing(null); setForm(blankTest()); setQuestions([]); setQuestionForm(null); setError(""); setSuccess(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function edit(test: TestRecord) {
    setEditing(test); setSuccess(""); setError("");
    const selected = items.find((item) => item.id === test.syllabus_item_id);
    const subject = selected?.item_type === "subject" ? selected : items.find((item) => item.id === selected?.parent_id);
    setForm({ title: test.title, stage_id: test.stage_id?.toString() ?? "", paper_id: test.paper_id?.toString() ?? "", subject_id: subject?.id.toString() ?? "", syllabus_item_id: test.syllabus_item_id?.toString() ?? "", duration_minutes: String(test.duration_minutes), total_marks: String(test.total_marks), negative_marking: String(test.negative_marking ?? 0), is_published: test.is_published });
    const { data, error: questionError } = await supabase.from("mpsc_questions").select("*").eq("test_id", test.id).order("sort_order");
    if (questionError) setError(questionError.message); else setQuestions((data ?? []) as Question[]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveTest(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.title.trim() || !form.stage_id || !form.paper_id || !form.subject_id || !form.duration_minutes || !form.total_marks) { setError("Please complete the title and syllabus fields, duration, and total marks."); return; }
    const syllabusId = form.syllabus_item_id || form.subject_id;
    setSaving(true);
    const payload = { title: form.title.trim(), stage_id: Number(form.stage_id), paper_id: Number(form.paper_id), syllabus_item_id: Number(syllabusId), duration_minutes: Number(form.duration_minutes), total_marks: Number(form.total_marks), negative_marking: Number(form.negative_marking || 0), is_published: form.is_published };
    const result = editing ? await supabase.from("mpsc_tests").update(payload).eq("id", editing.id).select().single() : await supabase.from("mpsc_tests").insert(payload).select().single();
    setSaving(false);
    if (result.error || !result.data) { setError(result.error?.message || "The test could not be saved."); return; }
    const saved = result.data as TestRecord; setEditing(saved); setTests((current) => editing ? current.map((test) => test.id === saved.id ? saved : test) : [saved, ...current]); setSuccess(editing ? "Test details updated." : "Draft created. Add questions, then publish when ready.");
  }
  async function saveQuestion(event: FormEvent) {
    event.preventDefault(); if (!editing || !questionForm) return; setError(""); setSuccess("");
    if (!questionForm.question_text.trim() || optionKeys.some((key) => !questionForm[`option_${key.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"].trim())) { setError("Add a question and all four answer options."); return; }
    setSaving(true);
    const payload = { test_id: editing.id, question_text: questionForm.question_text.trim(), option_a: questionForm.option_a.trim(), option_b: questionForm.option_b.trim(), option_c: questionForm.option_c.trim(), option_d: questionForm.option_d.trim(), correct_option: questionForm.correct_option, marks: Number(questionForm.marks), explanation: questionForm.explanation.trim() || null, sort_order: Number(questionForm.sort_order) };
    const result = questionForm.id ? await supabase.from("mpsc_questions").update(payload).eq("id", questionForm.id).select().single() : await supabase.from("mpsc_questions").insert(payload).select().single();
    setSaving(false);
    if (result.error || !result.data) { setError(result.error?.message || "The question could not be saved."); return; }
    const saved = result.data as Question; setQuestions((current) => [...current.filter((question) => question.id !== saved.id), saved].sort((a, b) => Number(a.sort_order) - Number(b.sort_order))); setQuestionForm(null); setSuccess("Question saved.");
  }
  async function deleteQuestion(id: number) { if (!window.confirm("Delete this question?")) return; setBusyId(id); const { error: deleteError } = await supabase.from("mpsc_questions").delete().eq("id", id); setBusyId(null); if (deleteError) setError(deleteError.message); else { setQuestions((current) => current.filter((question) => question.id !== id)); setSuccess("Question deleted."); } }
  async function togglePublish(test: TestRecord) { setBusyId(test.id); setError(""); const { error: updateError } = await supabase.from("mpsc_tests").update({ is_published: !test.is_published }).eq("id", test.id); setBusyId(null); if (updateError) setError(updateError.message); else { setTests((current) => current.map((item) => item.id === test.id ? { ...item, is_published: !item.is_published } : item)); if (editing?.id === test.id) setForm((current) => ({ ...current, is_published: !test.is_published })); setSuccess(test.is_published ? "Test unpublished." : "Test published for students."); } }
  async function deleteTest(test: TestRecord) { if (!window.confirm(`Delete “${test.title}” and its questions? This cannot be undone.`)) return; setBusyId(test.id); const { error: deleteError } = await supabase.from("mpsc_tests").delete().eq("id", test.id); setBusyId(null); if (deleteError) setError(deleteError.message); else { setTests((current) => current.filter((item) => item.id !== test.id)); if (editing?.id === test.id) startNew(); setSuccess("Test deleted."); } }

  return <main className="page"><section className="card admin-tests-card">
    <header className="tests-header"><div><div className="eyebrow">ADMIN · TESTS</div><h1>{editing ? "Edit Test" : "Test Management"}</h1><p>Create structured MPSC / UPSC practice tests and publish them when ready.</p></div><button className="secondary" onClick={() => router.push("/admin")}>Admin Dashboard</button></header>
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}
    <form className="form admin-test-form" onSubmit={saveTest}><h2>{editing ? "Test details" : "New test"}</h2>
      <label>Test title<input value={form.title} maxLength={180} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mains GS Paper I · History" required /></label>
      <div className="form-grid"><label>Examination stage<select value={form.stage_id} onChange={(e) => setForm({ ...form, stage_id: e.target.value, paper_id: "", subject_id: "", syllabus_item_id: "" })} required><option value="">Select stage</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><label>Paper<select value={form.paper_id} disabled={!form.stage_id} onChange={(e) => setForm({ ...form, paper_id: e.target.value, subject_id: "", syllabus_item_id: "" })} required><option value="">Select paper</option>{matchingPapers.map((paper) => <option key={paper.id} value={paper.id}>Paper {paper.paper_no} · {paper.name}</option>)}</select></label></div>
      <div className="form-grid"><label>Subject<select value={form.subject_id} disabled={!form.paper_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value, syllabus_item_id: e.target.value })} required><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label><label>Topic <span className="field-optional">Optional</span><select value={form.syllabus_item_id} disabled={!form.subject_id} onChange={(e) => setForm({ ...form, syllabus_item_id: e.target.value || form.subject_id })}><option value="">Entire subject</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label></div>
      <div className="form-grid"><label>Duration (minutes)<input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required /></label><label>Total marks<input type="number" min="1" step="0.25" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} required /></label><label>Negative marking<input type="number" min="0" step="0.25" value={form.negative_marking} onChange={(e) => setForm({ ...form, negative_marking: e.target.value })} /></label></div>
      <label className="check-label"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Publish this test for students</label>
      <div className="inline-actions"><button className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save test details" : "Create draft"}</button>{editing && <button type="button" className="secondary" onClick={startNew}>Create another test</button>}</div>
    </form>
    {editing && <section className="question-editor"><div className="section-heading"><div><h2>Questions <span>{questions.length}</span></h2><p>Add questions in the order students should see them.</p></div><button type="button" className="secondary" onClick={() => setQuestionForm(blankQuestion(questions.length + 1))}>Add question</button></div>
      {questionForm && <form className="form question-form" onSubmit={saveQuestion}><h3>{questionForm.id ? "Edit question" : "New question"}</h3><label>Question text<textarea value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} required /></label>{optionKeys.map((option) => <label key={option}>Option {option}<input value={questionForm[`option_${option.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"]} onChange={(e) => setQuestionForm({ ...questionForm, [`option_${option.toLowerCase()}`]: e.target.value })} required /></label>)}<div className="form-grid"><label>Correct answer<select value={questionForm.correct_option} onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}>{optionKeys.map((option) => <option key={option}>{option}</option>)}</select></label><label>Marks<input type="number" min="0.25" step="0.25" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} required /></label><label>Question order<input type="number" min="1" value={questionForm.sort_order} onChange={(e) => setQuestionForm({ ...questionForm, sort_order: e.target.value })} required /></label></div><label>Explanation <span className="field-optional">Optional</span><textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} /></label><div className="inline-actions"><button className="primary" disabled={saving}>{saving ? "Saving..." : "Save question"}</button><button type="button" className="secondary" onClick={() => setQuestionForm(null)}>Cancel</button></div></form>}
      {questions.length === 0 ? <div className="empty-box"><strong>No questions yet</strong><span>Add your first MCQ before publishing this test.</span></div> : <div className="admin-question-list">{questions.map((question, index) => <article key={question.id} className="admin-question"><div><span className="question-number">{index + 1}</span><strong>{question.question_text}</strong><small>Order {question.sort_order ?? index + 1} · {question.marks} marks · Correct: {question.correct_option}</small></div><div className="actions"><button className="secondary" onClick={() => setQuestionForm({ id: question.id, question_text: question.question_text, option_a: question.option_a, option_b: question.option_b, option_c: question.option_c, option_d: question.option_d, correct_option: question.correct_option, marks: String(question.marks), explanation: question.explanation ?? "", sort_order: String(question.sort_order ?? index + 1) })}>Edit</button><button className="reject" disabled={busyId === question.id} onClick={() => deleteQuestion(question.id)}>Delete</button></div></article>)}</div>}</section>}
    <section className="admin-test-list"><div className="section-heading"><div><h2>All tests</h2><p>Published tests are visible on the student Tests page.</p></div><button type="button" className="secondary" onClick={startNew}>New test</button></div>{loading ? <p className="muted">Loading tests...</p> : tests.length === 0 ? <div className="empty-box"><strong>No tests created</strong><span>Create a draft to begin building your first practice test.</span></div> : <div className="test-list">{tests.map((test) => <article className="test-card admin-test-row" key={test.id}><div className="test-card-main"><div className={test.is_published ? "status published" : "status draft"}>{test.is_published ? "Published" : "Draft"}</div><h2>{test.title}</h2><p>{paperName(test.paper_id)} · {itemName(test.syllabus_item_id) || "General"}</p><div className="test-details"><span>⏱ {formatDuration(Number(test.duration_minutes))}</span><span>🏅 {test.total_marks} marks</span><span>{formatPenalty(test.negative_marking)}</span></div></div><div className="admin-row-actions"><button className="secondary" onClick={() => edit(test)}>Edit</button><button className={test.is_published ? "secondary" : "approve"} disabled={busyId === test.id} onClick={() => togglePublish(test)}>{test.is_published ? "Unpublish" : "Publish"}</button><button className="reject" disabled={busyId === test.id} onClick={() => deleteTest(test)}>Delete</button></div></article>)}</div>}</section>
  </section></main>;
}
