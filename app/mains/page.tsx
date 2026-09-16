"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Stage = { id: number; name: string };
type Paper = { id: number; stage_id: number; paper_no: number; name: string };
type Item = {
  id: number;
  paper_id: number | null;
  parent_id: number | null;
  name: string;
  item_type: string;
};

type MainQuestion = {
  id: number;
  stage_id: number;
  paper_id: number;
  syllabus_item_id: number | null;
  question_text: string;
  marks: number;
  word_limit: number;
  model_answer: string | null;
  status: string;
};

type Submission = {
  id: number;
  mains_question_id: number;
  answer_type: "typed" | "handwritten";
  answer_text: string | null;
  word_count: number;
  status: string;
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function MainsAnswerPage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [questions, setQuestions] = useState<MainQuestion[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, Submission>>({});

  const [stageId, setStageId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("mpsc_profiles")
          .select("role, access_status")
          .eq("id", user.id)
          .single();

        if (profileError) throw new Error(profileError.message);

        if (profile?.role === "admin" && profile?.access_status === "approved") {
          router.replace("/admin");
          return;
        }
        if (profile?.access_status !== "approved") {
          router.replace("/pending");
          return;
        }

        const [st, pa, it, qu, su] = await Promise.all([
          supabase.from("mpsc_exam_stages").select("id,name").order("id"),
          supabase.from("mpsc_papers").select("id,stage_id,paper_no,name").order("id"),
          supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,name,item_type").order("id"),
          supabase.from("mpsc_mains_questions")
            .select("id,stage_id,paper_id,syllabus_item_id,question_text,marks,word_limit,model_answer,status")
            .eq("status", "published")
            .order("id", { ascending: false }),
          supabase.from("mpsc_mains_answer_submissions")
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .eq("user_id", user.id)
            .order("id", { ascending: false }),
        ]);

        if (st.error) throw new Error(st.error.message);
        if (pa.error) throw new Error(pa.error.message);
        if (it.error) throw new Error(it.error.message);
        if (qu.error) throw new Error(qu.error.message);
        if (su.error) throw new Error(su.error.message);

        setStages((st.data || []) as Stage[]);
        setPapers((pa.data || []) as Paper[]);
        setItems((it.data || []) as Item[]);
        setQuestions((qu.data || []) as MainQuestion[]);

        const map: Record<number, Submission> = {};
        for (const row of (su.data || []) as Submission[]) {
          if (!map[row.mains_question_id]) map[row.mains_question_id] = row;
        }
        setSubmissions(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load Mains questions.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const mainsStages = useMemo(
    () => stages.filter((s) => s.name.toLowerCase().includes("main")),
    [stages]
  );

  const filteredPapers = useMemo(
    () => papers.filter((p) => !stageId || p.stage_id === Number(stageId)),
    [papers, stageId]
  );

  const subjects = useMemo(
    () => items.filter(
      (i) => i.item_type === "subject" && (!paperId || i.paper_id === Number(paperId))
    ),
    [items, paperId]
  );

  const topics = useMemo(
    () => items.filter(
      (i) => i.item_type !== "subject" && i.parent_id === Number(subjectId)
    ),
    [items, subjectId]
  );

  function belongsToSubject(itemId: number, subject: number) {
    let current = items.find((i) => i.id === itemId);
    const seen = new Set<number>();

    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      if (current.id === subject) return true;
      if (current.parent_id === null) return false;
      current = items.find((i) => i.id === current!.parent_id);
    }
    return false;
  }

  const filteredQuestions = useMemo(
    () => questions.filter((q) => {
      if (stageId && q.stage_id !== Number(stageId)) return false;
      if (paperId && q.paper_id !== Number(paperId)) return false;
      if (topicId && q.syllabus_item_id !== Number(topicId)) return false;
      if (subjectId && !topicId && q.syllabus_item_id !== null &&
          !belongsToSubject(q.syllabus_item_id, Number(subjectId))) return false;
      return true;
    }),
    [questions, stageId, paperId, subjectId, topicId, items]
  );

  const selected = questions.find((q) => q.id === selectedId) || null;
  const currentWords = wordCount(answer);

  useEffect(() => {
    if (!selected) {
      setAnswer("");
      return;
    }
    setAnswer(submissions[selected.id]?.answer_text || "");
    setSuccess("");
    setError("");
  }, [selectedId, submissions, selected]);

  async function submitTypedAnswer(event: FormEvent) {
    event.preventDefault();
    if (!selected || !answer.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");

      const payload = {
        user_id: user.id,
        mains_question_id: selected.id,
        answer_type: "typed",
        answer_text: answer.trim(),
        word_count: currentWords,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existing = submissions[selected.id];
      const result = existing
        ? await supabase.from("mpsc_mains_answer_submissions")
            .update(payload)
            .eq("id", existing.id)
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .single()
        : await supabase.from("mpsc_mains_answer_submissions")
            .insert(payload)
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .single();

      if (result.error) throw new Error(result.error.message);

      setSubmissions((old) => ({
        ...old,
        [selected.id]: result.data as Submission,
      }));
      setSuccess("Answer submitted successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit answer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mains-answer-page">
      <div className="mains-answer-shell">
        <header className="mains-answer-header">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Mains Answer Writing</h1>
            <p className="muted">Select a published Mains question and write your answer.</p>
          </div>
          <button className="secondary" onClick={() => router.push("/student")}>
            Dashboard
          </button>
        </header>

        {error && <div className="mains-message mains-error">{error}</div>}
        {success && <div className="mains-message mains-success">{success}</div>}

        <section className="mains-filter-card">
          <h2>Find a Question</h2>
          <div className="mains-filter-grid">
            <label>
              Examination Stage
              <select value={stageId} onChange={(e) => {
                setStageId(e.target.value);
                setPaperId(""); setSubjectId(""); setTopicId(""); setSelectedId(null);
              }}>
                <option value="">Select stage</option>
                {mainsStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label>
              Paper
              <select value={paperId} onChange={(e) => {
                setPaperId(e.target.value);
                setSubjectId(""); setTopicId(""); setSelectedId(null);
              }} disabled={!stageId}>
                <option value="">All papers</option>
                {filteredPapers.map((p) => (
                  <option key={p.id} value={p.id}>Paper {p.paper_no} · {p.name}</option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select value={subjectId} onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId(""); setSelectedId(null);
              }} disabled={!paperId}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label>
              Topic
              <select value={topicId} onChange={(e) => {
                setTopicId(e.target.value);
                setSelectedId(null);
              }} disabled={!subjectId}>
                <option value="">All topics</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="mains-empty">Loading Mains questions...</div>
        ) : (
          <div className="mains-answer-grid">
            <section className="mains-question-list">
              <div className="mains-list-title">
                <div>
                  <h2>Published Questions</h2>
                  <p>{filteredQuestions.length} question(s)</p>
                </div>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="mains-empty">
                  No published Mains questions found for these filters.
                </div>
              ) : filteredQuestions.map((q, index) => (
                <button
                  key={q.id}
                  type="button"
                  className={selectedId === q.id ? "mains-question-row selected" : "mains-question-row"}
                  onClick={() => setSelectedId(q.id)}
                >
                  <span className="mains-q-number">{index + 1}</span>
                  <span className="mains-q-text">
                    {q.question_text}
                    <small>
                      {q.marks} marks · {q.word_limit} words
                      {submissions[q.id] ? " · Answer submitted" : ""}
                    </small>
                  </span>
                </button>
              ))}
            </section>

            <section className="mains-writing-card">
              {!selected ? (
                <div className="mains-empty">
                  <strong>Select a question</strong>
                  <span>Your answer-writing area will appear here.</span>
                </div>
              ) : (
                <>
                  <div className="mains-selected-question">
                    <div>
                      <span className="mains-badge">Mains Question</span>
                      <h2>{selected.question_text}</h2>
                    </div>
                    <div className="mains-marks">
                      <strong>{selected.marks}</strong>
                      <span>Marks</span>
                    </div>
                  </div>

                  <div className="mains-word-bar">
                    <span>Word limit: <b>{selected.word_limit}</b></span>
                    <span>Words: <b>{currentWords}</b></span>
                    <span className={currentWords > selected.word_limit ? "over" : ""}>
                      {currentWords > selected.word_limit ? "Over limit" : "Within limit"}
                    </span>
                  </div>

                  <form onSubmit={submitTypedAnswer}>
                    <label className="mains-answer-label">
                      ✍️ Write Your Answer
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={18}
                        placeholder="Write your answer here..."
                      />
                    </label>

                    <div className="mains-actions">
                      <button className="primary" type="submit" disabled={saving || !answer.trim()}>
                        {saving ? "Submitting..." : "Submit Answer"}
                      </button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => setAnswer("")}>
                        Clear
                      </button>
                    </div>
                  </form>

                  <div className="mains-upload-placeholder">
                    <strong>📷 Handwritten Answer</strong>
                    <p>
                      In the next step you will be able to take photos with your
                      phone camera or upload PDF pages of your handwritten answer.
                    </p>
                    <button className="secondary" type="button" disabled>
                      Handwritten Upload — Next Step
                    </button>
                  </div>

                  {submissions[selected.id] && (
                    <div className="mains-submission-status">
                      ✓ Submitted · {submissions[selected.id].word_count} words
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
