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
    <>
      <style jsx global>{`
        .mains-answer-page {
          min-height: 100vh;
          background: #f6f8fc;
          color: #172033;
          padding: 20px 12px 48px;
        }
        .mains-answer-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }
        .mains-answer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .mains-answer-header h1 {
          margin: 4px 0 8px;
          font-size: clamp(30px, 6vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }
        .brand {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .14em;
          color: #5e6a7e;
        }
        .muted {
          color: #687386;
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
        }
        .mains-filter-card, .mains-writing-card, .mains-question-list {
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-filter-card { padding: 18px; margin-bottom: 18px; }
        .mains-filter-card h2, .mains-list-title h2 {
          margin: 0 0 14px;
          font-size: 24px;
        }
        .mains-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .mains-filter-grid label, .mains-answer-label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-weight: 700;
        }
        .mains-filter-grid select {
          width: 100%;
          min-height: 46px;
          border: 1px solid #ccd4df;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
          color: #172033;
          font-size: 15px;
        }
        .mains-answer-grid {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
          gap: 18px;
          align-items: start;
        }
        .mains-question-list { padding: 18px; }
        .mains-list-title p { margin: 0 0 12px; color: #687386; }
        .mains-question-row {
          width: 100%;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          text-align: left;
          padding: 14px 10px;
          margin-top: 8px;
          border: 1px solid #dbe1e9;
          border-radius: 12px;
          background: #fff;
          color: #172033;
          cursor: pointer;
        }
        .mains-question-row:hover, .mains-question-row.selected {
          border-color: #8ca4c0;
          background: #f4f7fb;
        }
        .mains-q-number {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e9eef5;
          font-weight: 800;
        }
        .mains-q-text {
          min-width: 0;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .mains-q-text small {
          display: block;
          margin-top: 6px;
          color: #687386;
          font-size: 13px;
        }
        .mains-writing-card { padding: 20px; }
        .mains-selected-question {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: start;
        }
        .mains-selected-question h2 {
          margin: 10px 0 0;
          font-size: clamp(22px, 4vw, 31px);
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .mains-badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          background: #e9eef5;
          font-size: 12px;
          font-weight: 800;
        }
        .mains-marks {
          min-width: 74px;
          text-align: center;
          padding: 10px;
          border: 1px solid #dbe1e9;
          border-radius: 12px;
        }
        .mains-marks strong { display: block; font-size: 24px; }
        .mains-marks span { font-size: 12px; color: #687386; }
        .mains-word-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin: 18px 0;
          padding: 11px 13px;
          border-radius: 10px;
          background: #f2f5f9;
          color: #4d596d;
          font-size: 14px;
        }
        .mains-word-bar .over { font-weight: 800; }
        .mains-answer-label { font-size: 16px; }
        .mains-answer-label textarea {
          width: 100%;
          min-height: 360px;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #cbd3de;
          border-radius: 12px;
          padding: 14px;
          font: inherit;
          line-height: 1.6;
          color: #172033;
          background: #fff;
        }
        .mains-answer-label textarea:focus { outline: 2px solid #9db2ca; outline-offset: 1px; }
        .mains-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 12px;
        }
        .mains-actions button, .mains-answer-header button, .mains-upload-placeholder button {
          min-height: 46px;
          border-radius: 10px;
          padding: 10px 16px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }
        .mains-actions .primary { border: 0; background: #234f78; color: #fff; }
        .mains-actions .secondary, .mains-answer-header .secondary, .mains-upload-placeholder .secondary { border: 1px solid #ccd4df; background: #fff; color: #172033; }
        .mains-upload-placeholder {
          margin-top: 18px;
          padding: 16px;
          border: 1px dashed #b9c4d2;
          border-radius: 12px;
          background: #fafbfd;
        }
        .mains-upload-placeholder strong { font-size: 17px; }
        .mains-upload-placeholder p { margin: 8px 0 12px; color: #687386; line-height: 1.5; }
        .mains-submission-status, .mains-message, .mains-empty {
          padding: 12px 14px;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .mains-submission-status { margin-top: 14px; background: #edf7ef; }
        .mains-error { background: #fff0f0; color: #a33a3a; }
        .mains-success { background: #edf7ef; color: #287a45; }
        .mains-empty { color: #687386; background: #fff; border: 1px dashed #cbd3de; }
        .mains-collapsible {
          margin-bottom: 18px;
        }
        .mains-collapsible > summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px;
          font-size: 24px;
          font-weight: 800;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-collapsible > summary::-webkit-details-marker { display: none; }
        .mains-collapsible > summary::after {
          content: "+";
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #d7dce5;
          border-radius: 10px;
          font-size: 22px;
          background: #fff;
        }
        .mains-collapsible[open] > summary::after { content: "−"; }
        .mains-collapsible > .mains-collapsible-body {
          margin-top: 10px;
        }
        .mains-filter-card.mains-collapsible { padding: 0; background: transparent; border: 0; box-shadow: none; }
        .mains-filter-card.mains-collapsible > summary { margin-bottom: 0; }
        .mains-filter-card.mains-collapsible[open] > .mains-filter-body {
          padding: 18px;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 0 0 18px 18px;
          border-top: 0;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-filter-card.mains-collapsible[open] > summary { border-radius: 18px 18px 0 0; }
        .mains-question-list.mains-collapsible, .mains-writing-card.mains-collapsible { padding: 0; }
        .mains-question-list.mains-collapsible > summary, .mains-writing-card.mains-collapsible > summary { margin-bottom: 0; }
        .mains-question-list.mains-collapsible[open] > .mains-collapsible-body,
        .mains-writing-card.mains-collapsible[open] > .mains-collapsible-body {
          padding: 18px;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 0 0 18px 18px;
          border-top: 0;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        @media (max-width: 800px) {
          .mains-collapsible > summary {
            padding: 15px 14px;
            font-size: 20px;
          }
          .mains-answer-page { padding: 14px 10px 36px; }
          .mains-answer-header { flex-direction: column; }
          .mains-answer-header button { width: 100%; }
          .mains-filter-grid { grid-template-columns: 1fr; }
          .mains-answer-grid { grid-template-columns: 1fr; }
          .mains-question-list, .mains-writing-card { padding: 14px; }
          .mains-selected-question { grid-template-columns: 1fr; }
          .mains-marks { width: fit-content; min-width: 72px; }
          .mains-answer-label textarea { min-height: 320px; font-size: 16px; }
          .mains-actions { grid-template-columns: 1fr; }
        }
      `}</style>
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

        <details className="mains-filter-card mains-collapsible" open>
          <summary>Find a Question</summary>
          <div className="mains-filter-body">
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
          </div>
        </details>

        {loading ? (
          <div className="mains-empty">Loading Mains questions...</div>
        ) : (
          <div className="mains-answer-grid">
            <details className="mains-question-list mains-collapsible" open>
              <summary>Published Questions <span style={{fontSize: "14px", fontWeight: 700, color: "#687386"}}>({filteredQuestions.length})</span></summary>
              <div className="mains-collapsible-body">

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
              </div>
            </details>

            <details className="mains-writing-card mains-collapsible" open={Boolean(selected)}>
              <summary>Answer Writing</summary>
              <div className="mains-collapsible-body">
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
              </div>
            </details>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
