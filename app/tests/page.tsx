"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDuration, formatPenalty, Paper, stageIdForTest, SyllabusItem, TestRecord } from "@/lib/tests";

type Stage = { id: number; name: string; sort_order: number };

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<SyllabusItem[]>([]);
  const [stageId, setStageId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [itemId, setItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    const { data: profile, error: profileError } = await supabase.from("mpsc_profiles").select("access_status, role").eq("id", user.id).single();
    if (profileError || profile?.access_status !== "approved") { router.replace(profile?.role === "admin" ? "/admin" : "/pending"); return; }
    const [testResult, stageResult, paperResult, itemResult] = await Promise.all([
      supabase.from("mpsc_tests").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("mpsc_exam_stages").select("id, name, sort_order").order("sort_order"),
      supabase.from("mpsc_papers").select("id, stage_id, paper_no, name, sort_order").order("sort_order"),
      supabase.from("mpsc_syllabus_items").select("id, paper_id, parent_id, item_type, name, sort_order").order("sort_order"),
    ]);
    const firstError = testResult.error || stageResult.error || paperResult.error || itemResult.error;
    if (firstError) setError(firstError.message);
    else { setTests((testResult.data ?? []) as TestRecord[]); setStages(stageResult.data ?? []); setPapers(paperResult.data ?? []); setItems(itemResult.data ?? []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePapers = useMemo(() => papers.filter((paper) => !stageId || paper.stage_id === Number(stageId)), [papers, stageId]);
  const visibleItems = useMemo(() => items.filter((item) => !paperId || item.paper_id === Number(paperId)), [items, paperId]);
  const filteredTests = useMemo(() => tests.filter((test) =>
    (!stageId || stageIdForTest(test, papers) === Number(stageId)) && (!paperId || test.paper_id === Number(paperId)) && (!itemId || test.syllabus_item_id === Number(itemId))
  ), [tests, papers, stageId, paperId, itemId]);
  const stageName = (id: number | null) => stages.find((stage) => stage.id === id)?.name;
  const paperName = (id: number | null) => { const paper = papers.find((entry) => entry.id === id); return paper ? `Paper ${paper.paper_no} · ${paper.name}` : undefined; };
  const itemName = (id: number | null) => items.find((item) => item.id === id)?.name;

  return <main className="page"><section className="card tests-card">
    <header className="tests-header"><div><div className="eyebrow">MPSC / UPSC</div><h1>Practice Tests</h1><p>Choose a published test and practise at your own pace.</p></div><button className="secondary" onClick={() => router.push("/student")}>Dashboard</button></header>
    {loading ? <p className="muted">Loading available tests...</p> : error ? <div className="empty-box"><strong>Unable to load tests</strong><span>{error}</span><button className="secondary" onClick={load}>Retry</button></div> : <>
      <div className="test-filters" aria-label="Filter tests">
        <label>Examination stage<select value={stageId} onChange={(event) => { setStageId(event.target.value); setPaperId(""); setItemId(""); }}><option value="">All stages</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
        <label>Paper<select value={paperId} onChange={(event) => { setPaperId(event.target.value); setItemId(""); }}><option value="">All papers</option>{visiblePapers.map((paper) => <option key={paper.id} value={paper.id}>Paper {paper.paper_no} · {paper.name}</option>)}</select></label>
        <label>Subject / topic<select value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">All subjects and topics</option>{visibleItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className="test-list">{filteredTests.length === 0 ? <div className="empty-box"><strong>No published tests found</strong><span>Try clearing a filter or check back when a new test is published.</span></div> : filteredTests.map((test) => <article className="test-card" key={test.id}><div className="test-card-main"><div className="test-meta">{stageName(stageIdForTest(test, papers)) || "MPSC / UPSC"}</div><h2>{test.title}</h2><p>{paperName(test.paper_id) || "General test"}{itemName(test.syllabus_item_id) ? ` · ${itemName(test.syllabus_item_id)}` : ""}</p><div className="test-details"><span>⏱ {formatDuration(Number(test.duration_minutes))}</span><span>🏅 {test.total_marks} marks</span><span>− {formatPenalty(test.negative_marking)}</span></div></div><button className="primary test-start" onClick={() => router.push(`/tests/${test.id}`)}>Start Test</button></article>)}</div>
    </>}
  </section></main>;
}
