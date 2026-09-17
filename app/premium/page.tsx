"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage = { id: number; name: string; sort_order: number };
type Paper = { id: number; stage_id: number | null; paper_no: number | null; name: string; sort_order: number };
type Item = { id: number; paper_id: number | null; parent_id: number | null; item_type: string; name: string; sort_order: number };
type Question = {
  id: number; test_id: number; question_text: string; option_a: string; option_b: string;
  option_c: string; option_d: string; correct_answer: string; marks: number; explanation: string | null; question_order: number;
};
type Test = {
  id: number; title: string; paper_id: number | null; syllabus_item_id: number | null;
  duration_minutes: number; total_marks: number; negative_marking: number; is_published: boolean; questions: Question[];
};

export default function PremiumQuestionBankPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [stageId, setStageId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [itemId, setItemId] = useState("");
  const [testId, setTestId] = useState("");
  const [includeAnswers, setIncludeAnswers] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        const { data: profile, error: profileError } = await supabase
          .from("mpsc_profiles").select("role, access_status").eq("id", user.id).single();
        if (profileError) throw profileError;
        if (profile?.access_status !== "approved") {
          router.replace(profile?.role === "admin" ? "/admin" : "/pending"); return;
        }

        const { data: access, error: accessError } = await supabase
          .from("mpsc_premium_access").select("is_premium, valid_until").eq("user_id", user.id).maybeSingle();
        if (accessError) throw accessError;
        const active = Boolean(access?.is_premium) && (!access?.valid_until || new Date(access.valid_until).getTime() >= Date.now());
        const allowed = active || profile?.role === "admin";
        if (!allowed) { if (!cancelled) { setPremium(false); setLoading(false); } return; }

        const [sr, pr, ir, tr] = await Promise.all([
          supabase.from("mpsc_exam_stages").select("id,name,sort_order").order("sort_order"),
          supabase.from("mpsc_papers").select("id,stage_id,paper_no,name,sort_order").order("sort_order"),
          supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,item_type,name,sort_order").order("sort_order"),
          supabase.from("mpsc_tests").select("id,title,paper_id,syllabus_item_id,duration_minutes,total_marks,negative_marking,is_published").eq("is_published", true).order("created_at", { ascending: false }),
        ]);
        const firstError = sr.error || pr.error || ir.error || tr.error;
        if (firstError) throw firstError;

        const published = (tr.data ?? []) as Omit<Test, "questions">[];
        const questionResults = await Promise.all(
          published.map((t) => supabase.from("mpsc_questions")
            .select("id,test_id,question_text,option_a,option_b,option_c,option_d,correct_answer,marks,explanation,question_order")
            .eq("test_id", t.id).order("question_order"))
        );
        const questionError = questionResults.find((r) => r.error)?.error;
        if (questionError) throw questionError;
        if (cancelled) return;
        setStages((sr.data ?? []) as Stage[]);
        setPapers((pr.data ?? []) as Paper[]);
        setItems((ir.data ?? []) as Item[]);
        setTests(published.map((t, i) => ({ ...t, questions: (questionResults[i].data ?? []) as Question[] })));
        setPremium(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load premium question bank.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const visiblePapers = useMemo(() => papers.filter((p) => !stageId || p.stage_id === Number(stageId)), [papers, stageId]);
  const visibleItems = useMemo(() => items.filter((i) => !paperId || i.paper_id === Number(paperId)), [items, paperId]);
  const filteredTests = useMemo(() => tests.filter((t) => {
    const paper = papers.find((p) => p.id === t.paper_id);
    return (!stageId || paper?.stage_id === Number(stageId)) && (!paperId || t.paper_id === Number(paperId)) && (!itemId || t.syllabus_item_id === Number(itemId));
  }), [tests, papers, stageId, paperId, itemId]);
  const printableTests = useMemo(() => testId ? filteredTests.filter((t) => String(t.id) === testId) : filteredTests, [filteredTests, testId]);
  const questionCount = printableTests.reduce((sum, t) => sum + t.questions.length, 0);

  const stageName = (id: number | null) => stages.find((s) => s.id === id)?.name ?? "MPSC / UPSC";
  const paperLabel = (id: number | null) => {
    const p = papers.find((x) => x.id === id);
    return p ? `Paper ${p.paper_no ?? ""} · ${p.name}` : "General";
  };
  const itemName = (id: number | null) => items.find((x) => x.id === id)?.name ?? "";

  const resetFromStage = (value: string) => { setStageId(value); setPaperId(""); setItemId(""); setTestId(""); };
  const resetFromPaper = (value: string) => { setPaperId(value); setItemId(""); setTestId(""); };

  if (loading) return <main className="premium-page"><section className="premium-card"><p>Checking premium access…</p></section></main>;
  if (error) return <main className="premium-page"><section className="premium-card"><h1>Premium Question Bank</h1><p className="premium-error">{error}</p><button onClick={() => window.location.reload()}>Retry</button></section></main>;
  if (!premium) return <main className="premium-page"><section className="premium-card premium-locked"><div className="premium-badge">⭐ PREMIUM</div><h1>Premium Question Bank</h1><p>This feature is available to premium students.</p><div className="premium-lock">🔒 Premium access required<br/><small>Ask the administrator to activate premium access for your account.</small></div><button onClick={() => router.push("/student")}>Back to Dashboard</button></section></main>;

  return (
    <main className="premium-page">
      <style jsx global>{`
        .premium-page{min-height:100vh;background:#f5f7fb;padding:16px;color:#172033}
        .premium-card{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #e3e7ef;border-radius:18px;padding:18px;box-shadow:0 8px 30px rgba(20,35,60,.06)}
        .premium-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #e8ebf1;padding-bottom:14px;margin-bottom:16px}
        .premium-header h1{margin:3px 0 5px;font-size:25px}.premium-header p{margin:0;color:#687386;font-size:14px}
        .premium-badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;padding:5px 9px;border-radius:999px;background:#eef3ff;color:#3159a6}
        .premium-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.premium-grid label{font-size:12px;font-weight:700;color:#586276}.premium-grid select{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #d8deea;border-radius:10px;background:#fff;font:inherit;font-size:13px}
        .premium-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:14px 0}.premium-actions label{font-size:13px;color:#4d586b}.premium-actions input{margin-right:7px}
        .premium-button{border:0;border-radius:10px;padding:11px 15px;font-weight:800;cursor:pointer;background:#1e4fa8;color:white}.premium-button:disabled{opacity:.45;cursor:not-allowed}.premium-secondary{border:1px solid #d8deea;background:#fff;color:#334155;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer}
        .premium-summary{display:flex;gap:15px;font-size:13px;color:#697386;background:#f8f9fc;border-radius:10px;padding:10px 12px;margin-bottom:16px}.premium-summary strong{color:#172033}
        .print-document{background:#fff}.print-title{text-align:center;padding:12px 0 18px;border-bottom:2px solid #172033}.print-title h1{margin:4px 0;font-size:28px}.print-title p{margin:0;color:#687386}.print-test{margin-top:22px}.print-test h2{margin:0 0 4px;font-size:19px}.print-meta{margin:0 0 13px;color:#667085;font-size:12px}.print-question{padding:12px 0;border-bottom:1px solid #dfe3ea;break-inside:avoid}.question-heading{display:grid;grid-template-columns:34px 1fr auto;gap:7px;font-size:14px;line-height:1.5}.question-heading small{white-space:nowrap;color:#667085}.print-options{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:9px 0 0 34px;font-size:13px;line-height:1.4}.answer-box{margin:9px 0 0 34px;padding:9px 11px;background:#f4f7fc;border-left:3px solid #5377b9;font-size:12px;line-height:1.5}.answer-box p{margin:5px 0 0}.premium-lock{margin:18px 0;padding:16px;border:1px dashed #cfd6e3;border-radius:12px;background:#fafbfc}.premium-error{color:#b42318;background:#fff2f0;padding:12px;border-radius:10px}
        @media(max-width:760px){.premium-page{padding:8px}.premium-card{padding:13px;border-radius:14px}.premium-header{flex-direction:column}.premium-header h1{font-size:21px}.premium-grid{grid-template-columns:1fr 1fr}.premium-actions{align-items:flex-start;flex-direction:column}.premium-button{width:100%}.print-options{grid-template-columns:1fr;margin-left:0}.question-heading{grid-template-columns:29px 1fr}.question-heading small{grid-column:2}.answer-box{margin-left:0}}
        @media print{.premium-page{padding:0;background:#fff}.premium-card{max-width:none;border:0;box-shadow:none;padding:0}.no-print,.premium-header,.premium-grid,.premium-actions,.premium-summary{display:none!important}.print-title{padding-top:0}.print-document{font-size:11pt}.print-question{break-inside:avoid}.premium-page{color:#000}}
      `}</style>
      <section className="premium-card">
        <header className="premium-header no-print">
          <div><div className="premium-badge">⭐ PREMIUM</div><h1>Printable Question Bank</h1><p>Published MCQs with answers and explanations for offline reference.</p></div>
          <button className="premium-secondary" onClick={() => router.push("/student")}>Dashboard</button>
        </header>

        <div className="premium-grid no-print">
          <label>Examination stage<select value={stageId} onChange={(e) => resetFromStage(e.target.value)}><option value="">All stages</option>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Paper<select value={paperId} onChange={(e) => resetFromPaper(e.target.value)}><option value="">All papers</option>{visiblePapers.map((p) => <option key={p.id} value={p.id}>Paper {p.paper_no ?? ""} · {p.name}</option>)}</select></label>
          <label>Subject / topic<select value={itemId} onChange={(e) => {setItemId(e.target.value);setTestId("")}}><option value="">All subjects and topics</option>{visibleItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
          <label>Question paper<select value={testId} onChange={(e) => setTestId(e.target.value)}><option value="">All matching tests</option>{filteredTests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
        </div>

        <div className="premium-actions no-print">
          <label><input type="checkbox" checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} /> Include correct answers and explanations</label>
          <button className="premium-button" disabled={!questionCount} onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
        </div>
        <div className="premium-summary no-print"><strong>{questionCount} questions</strong><span>{printableTests.length} published test{printableTests.length === 1 ? "" : "s"} selected</span></div>

        {questionCount === 0 ? <div className="premium-lock no-print"><strong>No questions available</strong><br/><small>Choose another filter or publish a test that contains questions.</small></div> : (
          <div className="print-document">
            <div className="print-title"><div className="premium-badge">MPSC / UPSC</div><h1>Question Bank</h1><p>{includeAnswers ? "Questions, correct answers and explanations" : "Practice questions"}</p></div>
            {printableTests.map((test) => (
              <section className="print-test" key={test.id}>
                <h2>{test.title}</h2>
                <p className="print-meta">{stageName(papers.find((p) => p.id === test.paper_id)?.stage_id ?? null)} · {paperLabel(test.paper_id)}{itemName(test.syllabus_item_id) ? ` · ${itemName(test.syllabus_item_id)}` : ""}</p>
                {test.questions.map((q, index) => (
                  <article className="print-question" key={q.id}>
                    <div className="question-heading"><strong>Q{index + 1}.</strong><span>{q.question_text}</span><small>{q.marks} mark{Number(q.marks) === 1 ? "" : "s"}</small></div>
                    <div className="print-options"><div>A. {q.option_a}</div><div>B. {q.option_b}</div><div>C. {q.option_c}</div><div>D. {q.option_d}</div></div>
                    {includeAnswers && <div className="answer-box"><strong>Correct Answer: {q.correct_answer}</strong><p><strong>Explanation:</strong> {q.explanation || "No explanation is available for this question."}</p></div>}
                  </article>
                ))}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
