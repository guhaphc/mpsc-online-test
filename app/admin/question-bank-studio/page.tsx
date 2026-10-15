"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Bank = { id:string; title:string; exam:string; subject:string; topic:string; language:string; source_type:string; source_name:string; source_mode:string; created_by:string; status:string; created_at:string };
type Item = { id:string; question_order:number; question_text:string; option_a:string; option_b:string; option_c:string; option_d:string; correct_answer:string; explanation:string; difficulty:string; source_reference:string };
type Revision = { id:string; bank_id:string; question_id:string; question_type:string; candidate:Item; status:string; created_at:string };

export default function QuestionBankStudioPage() {
  const router=useRouter();
  const [role,setRole]=useState("");
  const [banks,setBanks]=useState<Bank[]>([]);
  const [selectedId,setSelectedId]=useState("");
  const [selectedBank,setSelectedBank]=useState<Bank|null>(null);
  const [items,setItems]=useState<Item[]>([]);
  const [revisions,setRevisions]=useState<Revision[]>([]);
  const [regenTypes,setRegenTypes]=useState<Record<string,string>>({});
  const [importForm,setImportForm]=useState({title:"",exam:"MPSC",subject:"",topic:"",language:"English",text:""});
  const [timeLimit,setTimeLimit]=useState("30");
  const [form,setForm]=useState({title:"",exam:"MPSC",subject:"",topic:"",language:"English",source_mode:"source_only",count:"10",easy:"2",moderate:"3",tough:"3",extra_tough:"2",webpage_url:"",source_text:""});
  const [sourceFile,setSourceFile]=useState<File|null>(null);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function token() {
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error("Your session expired. Please sign in again.");
    return session.access_token;
  }
  async function api(path:string,init:RequestInit={}) {
    const auth=await token();
    const response=await fetch(path,{...init,headers:{...(init.headers||{}),Authorization:"Bearer "+auth}});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Request failed.");
    return result;
  }
  async function loadBanks() {
    const result=await api("/api/question-banks");
    setBanks(result.banks||[]);
    setLoading(false);
  }
  async function loadBank(id:string) {
    setSelectedId(id);setError("");setNotice("");
    const result=await api("/api/question-banks?bank_id="+encodeURIComponent(id));
    setSelectedBank(result.bank);setItems(result.questions||[]);setTimeLimit(String(result.bank?.time_limit_minutes||30));
    try { const r=await api("/api/question-banks/revisions?bank_id="+encodeURIComponent(id)); setRevisions(r.revisions||[]); } catch { setRevisions([]); }
  }
  useEffect(()=>{(async()=>{
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.replace("/");return;}
      const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
      if(profile?.access_status!=="approved"||!["admin","teacher"].includes(profile?.role||"")){router.replace("/student");return;}
      setRole(profile.role);await loadBanks();
    }catch(e){setError(e instanceof Error?e.message:"Could not load question banks.");setLoading(false);}
  })();},[]);

  function setCount(value:string) {
    const d=value==="10"?[2,3,3,2]:value==="25"?[5,8,7,5]:value==="50"?[10,15,15,10]:[20,30,30,20];
    setForm(c=>({...c,count:value,easy:String(d[0]),moderate:String(d[1]),tough:String(d[2]),extra_tough:String(d[3])}));
  }
  async function generate(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setNotice("");setWorking(true);
    try {
      const total=Number(form.easy)+Number(form.moderate)+Number(form.tough)+Number(form.extra_tough);
      if(total!==Number(form.count))throw new Error("Difficulty quantities must add up to the total.");
      const sourceCount=Number(Boolean(sourceFile))+Number(Boolean(form.webpage_url.trim()))+Number(Boolean(form.source_text.trim()));
      if(sourceCount!==1)throw new Error("Provide exactly one source: file, webpage URL or pasted text.");
      const data=new FormData();
      Object.entries(form).forEach(([k,v])=>data.append(k,v));
      if(sourceFile)data.append("source_file",sourceFile);
      const result=await api("/api/question-banks",{method:"POST",body:data});
      setNotice(result.message||"Draft generated.");
      setSourceFile(null);
      const input=document.getElementById("qb-file") as HTMLInputElement|null;if(input)input.value="";
      await loadBanks();
      if(result.bank_id)await loadBank(result.bank_id);
    }catch(e){setError(e instanceof Error?e.message:"Question generation failed.");}
    finally{setWorking(false);}
  }
  async function importExisting(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setNotice("");setWorking(true);
    try {
      const result=await api("/api/question-banks/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(importForm)});
      setNotice(result.message||"Imported question bank saved as draft.");
      setImportForm({title:"",exam:"MPSC",subject:"",topic:"",language:"English",text:""});
      await loadBanks();if(result.bank_id)await loadBank(result.bank_id);
    } catch(e) { setError(e instanceof Error?e.message:"Could not import questions."); }
    finally { setWorking(false); }
  }
  async function regenerateQuestion(q:Item) {
    if(!selectedBank)return;
    const question_type=regenTypes[q.id]||"statement_based";
    setWorking(true);setError("");setNotice("");
    try {
      const result=await api("/api/question-banks/regenerate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:selectedBank.id,question_id:q.id,question_type})});
      setRevisions(old=>[result.revision,...old]);setNotice("Regenerated question saved as a separate draft. Original question is unchanged.");
    } catch(e) { setError(e instanceof Error?e.message:"Could not regenerate question."); }
    finally { setWorking(false); }
  }
  async function reviewRevision(revisionId:string,action:"accept"|"discard") {
    setWorking(true);setError("");setNotice("");
    try {
      await api("/api/question-banks/revisions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision_id:revisionId,action})});
      setNotice(action==="accept"?"Regenerated version accepted.":"Regenerated draft discarded.");
      if(selectedBank)await loadBank(selectedBank.id);
    } catch(e) { setError(e instanceof Error?e.message:"Could not review regenerated question."); }
    finally { setWorking(false); }
  }
  async function saveBankSettings() {
    if(!selectedBank)return;setWorking(true);setError("");setNotice("");
    try {
      await api("/api/question-banks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:selectedBank.id,action:"bank_settings",time_limit_minutes:Number(timeLimit)})});
      setNotice("Test time limit saved.");await loadBank(selectedBank.id);await loadBanks();
    } catch(e) { setError(e instanceof Error?e.message:"Could not save test settings."); }
    finally { setWorking(false); }
  }
  function editItem(id:string,key:keyof Item,value:string) {
    setItems(old=>old.map(q=>q.id===id?({...q,[key]:value} as Item):q));
  }
  async function saveItems() {
    if(!selectedBank)return;
    setWorking(true);setError("");setNotice("");
    try {
      await api("/api/question-banks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:selectedBank.id,action:"save",questions:items})});
      setNotice("Edits saved.");await loadBank(selectedBank.id);
    }catch(e){setError(e instanceof Error?e.message:"Could not save edits.");}
    finally{setWorking(false);}
  }
  async function manageBank(bank:Bank, action:"unpublish"|"archive") {
    const message = action==="unpublish"
      ? `Unpublish “${bank.title}”? Students will no longer be able to start this test. Existing attempt history and saved explanations will be preserved. You can submit it for approval again later.`
      : `Delete “${bank.title}” from the active question-bank list? It will be archived, not physically erased, so existing student scores and attempt history remain intact. This cannot be undone from this screen.`;
    if(!window.confirm(message))return;
    setWorking(true);setError("");setNotice("");
    try {
      await api("/api/question-banks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:bank.id,action})});
      if(selectedId===bank.id){setSelectedId("");setSelectedBank(null);setItems([]);setRevisions([]);}
      setNotice(action==="unpublish"?"Question bank unpublished. Student access is disabled; history is preserved.":"Question bank deleted from the active list. Student history is preserved.");
      await loadBanks();
    }catch(e){setError(e instanceof Error?e.message:"Could not update this question bank.");}
    finally{setWorking(false);}
  }
  async function doAction(action:string) {
    if(!selectedBank)return;
    const label=action==="submit"?"Submit this bank for admin approval?":action==="publish"?"Publish this bank to students?":"Reject this bank?";
    if(!window.confirm(label))return;
    setWorking(true);setError("");setNotice("");
    try {
      await api("/api/question-banks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:selectedBank.id,action})});
      setNotice(action==="submit"?"Submitted for admin approval.":action==="publish"?"Published to students.":"Bank rejected.");
      await loadBanks();await loadBank(selectedBank.id);
    }catch(e){setError(e instanceof Error?e.message:"Could not update status.");}
    finally{setWorking(false);}
  }
  const canEdit=!!selectedBank&&(["draft","unpublished"].includes(selectedBank.status)||(role==="admin"&&selectedBank.status==="pending_review"))&&(role==="admin"||selectedBank.created_by===banks.find(b=>b.id===selectedBank.id)?.created_by);
  const isAdmin=role==="admin";

  return <main className="page qb-studio-page"><section className="card qb-studio-card" style={{maxWidth:1050,margin:"0 auto"}}>
    <header style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:20}}>
      <div><div className="eyebrow">AI QUESTION BANK STUDIO</div><h1>Create MCQ Question Bank</h1><p className="muted">Upload source material, generate four difficulty levels, review and publish through approval.</p></div>
      <button className="secondary" type="button" onClick={()=>router.push(isAdmin?"/admin":"/student")}>Back to Dashboard</button>
    </header>
    {error&&<div role="alert" className="form-error" style={{marginBottom:14}}>{error}</div>}
    {notice&&<div role="status" className="form-success" style={{marginBottom:14}}>{notice}</div>}
    <details open={!selectedBank} style={{border:"1px solid var(--border,#d8dee8)",borderRadius:14,padding:16,marginBottom:20}}>
      <summary style={{fontSize:19,fontWeight:750,cursor:"pointer"}}>1 · Source and generation settings</summary>
      <form className="qb-studio-form" onSubmit={generate} style={{display:"grid",gap:14,marginTop:16}}>
        <div className="qb-studio-fields" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <label>Question bank title<input required maxLength={180} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Indian Constitution — Fundamental Rights"/></label>
          <label>Exam<select value={form.exam} onChange={e=>setForm({...form,exam:e.target.value})}><option>MPSC</option><option>UPSC</option><option>Other</option></select></label>
          <label>Subject<input required maxLength={160} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Polity, History, Geography"/></label>
          <label>Topic<input maxLength={180} value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="Optional topic"/></label>
          <label>Language<select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}><option>English</option><option>Marathi</option></select></label>
          <label>Generation mode<select value={form.source_mode} onChange={e=>setForm({...form,source_mode:e.target.value})}><option value="source_only">Strictly from source</option><option value="source_plus_ai">Source + AI knowledge</option></select></label>
          <label>Total questions<select value={form.count} onChange={e=>setCount(e.target.value)}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
        </div>
        <div className="qb-studio-source" style={{border:"1px solid var(--border,#d8dee8)",borderRadius:12,padding:14}}>
          <strong>Choose exactly one source</strong>
          <label style={{display:"block",marginTop:12}}>Upload PDF or image (max 4 MB)<input id="qb-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>{setSourceFile(e.target.files?.[0]||null);setForm(c=>({...c,webpage_url:"",source_text:""}));}}/><small className="muted">PDF, JPG, PNG or WebP</small></label>
          <label style={{display:"block",marginTop:12}}>Or public webpage URL<input type="url" value={form.webpage_url} onChange={e=>{setForm(c=>({...c,webpage_url:e.target.value,source_text:""}));setSourceFile(null);const el=document.getElementById("qb-file") as HTMLInputElement|null;if(el)el.value="";}} placeholder="https://..."/></label>
          <label style={{display:"block",marginTop:12}}>Or paste source text<textarea rows={6} maxLength={60000} value={form.source_text} onChange={e=>{setForm(c=>({...c,source_text:e.target.value,webpage_url:""}));setSourceFile(null);const el=document.getElementById("qb-file") as HTMLInputElement|null;if(el)el.value="";}} placeholder="Paste at least 100 characters of source material"/></label>
        </div>
        <div><strong>Difficulty distribution</strong><p className="muted">Counts must total {form.count}. Defaults: 20% Easy, 30% Moderate, 30% Tough, 20% Extra Tough.</p>
          <div className="qb-studio-difficulty" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            {([["easy","Easy"],["moderate","Moderate"],["tough","Tough"],["extra_tough","Extra Tough"]] as const).map(([key,label])=><label key={key}>{label}<input type="number" min="0" max={form.count} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
          </div>
        </div>
        <button className="primary" type="submit" disabled={working}>{working?"Generating in batches…":"Generate question bank as draft"}</button>
        <p className="muted" style={{fontSize:13}}>Generated questions remain drafts until reviewed and approved. AI answers must be checked before publication.</p>
      </form>
    </details>
    <details style={{border:"1px solid var(--border,#d8dee8)",borderRadius:14,padding:16,marginBottom:20}}>
      <summary style={{fontSize:19,fontWeight:750,cursor:"pointer"}}>2 · Import an existing question bank (paste text)</summary>
      <p className="muted">Paste prepared MCQs. AI will structure them into editable draft questions; review every answer before publishing.</p>
      <form className="qb-studio-form qb-import-form" onSubmit={importExisting} style={{display:"grid",gap:12,marginTop:12,minWidth:0}}>
        <div className="qb-studio-fields" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,minWidth:0}}>
          <label>Question bank title<input required maxLength={180} value={importForm.title} onChange={e=>setImportForm({...importForm,title:e.target.value})}/></label>
          <label>Exam<select value={importForm.exam} onChange={e=>setImportForm({...importForm,exam:e.target.value})}><option>MPSC</option><option>UPSC</option><option>Other</option></select></label>
          <label>Subject<input required maxLength={160} value={importForm.subject} onChange={e=>setImportForm({...importForm,subject:e.target.value})}/></label>
          <label>Topic<input maxLength={180} value={importForm.topic} onChange={e=>setImportForm({...importForm,topic:e.target.value})}/></label>
          <label>Language<select value={importForm.language} onChange={e=>setImportForm({...importForm,language:e.target.value})}><option>English</option><option>Marathi</option></select></label>
        </div>
        <label>Paste existing questions<textarea required rows={9} maxLength={60000} value={importForm.text} onChange={e=>setImportForm({...importForm,text:e.target.value})} placeholder={"Q1. Example question?\nA. Option one\nB. Option two\nC. Option three\nD. Option four\nCorrect Answer: B\nExplanation: ..."} /></label>
        <button className="primary" type="submit" disabled={working}>{working?"Importing and structuring questions…":"Import as a new draft"}</button>
      </form>
    </details>
    <section style={{border:"1px solid var(--border,#d8dee8)",borderRadius:14,padding:16,marginBottom:20}}>
      <h2>3 · Saved question banks</h2>
      {loading?<p>Loading…</p>:banks.length===0?<p className="muted">No question banks yet.</p>:<div style={{display:"grid",gap:8}}>
        {banks.map(bank=><article key={bank.id} className="qb-saved-bank" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",border:"1px solid var(--border,#d8dee8)",borderRadius:12,padding:12}}>
          <button type="button" className={selectedId===bank.id?"primary":"secondary"} onClick={()=>void loadBank(bank.id)} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",textAlign:"left",padding:8,flex:"1 1 220px",minWidth:0}}>
            <span style={{minWidth:0,overflowWrap:"anywhere"}}><strong>{bank.title}</strong><small style={{display:"block",fontWeight:400,marginTop:4}}>{bank.exam} · {bank.subject}{bank.topic?" · "+bank.topic:""} · {new Date(bank.created_at).toLocaleDateString()}</small></span><span className={"qb-status-badge qb-status-"+bank.status}>{bank.status.replace("_"," ")}</span>
          </button>
          <div className="qb-bank-actions" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {bank.status==="published"&&<button type="button" className="secondary" disabled={working} onClick={()=>void manageBank(bank,"unpublish")}>Unpublish</button>}
            <button type="button" className="secondary" disabled={working} onClick={()=>void manageBank(bank,"archive")} aria-label={"Delete "+bank.title}>Delete</button>
          </div>
        </article>)}
      </div>}
    </section>
    {selectedBank&&<section style={{border:"1px solid var(--border,#d8dee8)",borderRadius:14,padding:16}}>
      <div className="eyebrow">4 · REVIEW & PUBLISH</div><h2>{selectedBank.title}</h2>
      <p className="muted">{selectedBank.source_type.toUpperCase()} · {selectedBank.source_name} · {selectedBank.source_mode==="source_only"?"Source only":"Source + AI knowledge"} · Status: <strong>{selectedBank.status.replace("_"," ")}</strong></p>
      {items.length===0?<p className="muted">No saved questions.</p>:<div style={{display:"grid",gap:14}}>
        {items.map((q,index)=><article className="qb-question-card" key={q.id} style={{border:"1px solid var(--border,#d8dee8)",borderRadius:12,padding:14}}>
          <div className="qb-question-head" style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><strong>Question {index+1}</strong><label>Difficulty<select disabled={!canEdit} value={q.difficulty} onChange={e=>editItem(q.id,"difficulty",e.target.value)}>{["Easy","Moderate","Tough","Extra Tough"].map(d=><option key={d}>{d}</option>)}</select></label></div>
          <label>Question<textarea rows={3} disabled={!canEdit} value={q.question_text} onChange={e=>editItem(q.id,"question_text",e.target.value)}/></label>
          <div className="qb-question-options" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
            {(["option_a","option_b","option_c","option_d"] as const).map((key,i)=><label key={key}>Option {String.fromCharCode(65+i)}<textarea rows={2} disabled={!canEdit} value={q[key]} onChange={e=>editItem(q.id,key,e.target.value)}/></label>)}
          </div>
          <div className="qb-question-meta" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
            <label>Correct answer<select disabled={!canEdit} value={q.correct_answer} onChange={e=>editItem(q.id,"correct_answer",e.target.value)}>{["A","B","C","D"].map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Source reference<input disabled={!canEdit} value={q.source_reference||""} onChange={e=>editItem(q.id,"source_reference",e.target.value)}/></label>
          </div>
          <label>Explanation<textarea rows={3} disabled={!canEdit} value={q.explanation} onChange={e=>editItem(q.id,"explanation",e.target.value)}/></label>
          {canEdit&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8,marginTop:12,padding:12,borderRadius:10,background:"var(--surface,#f7f7f7)"}}>
            <label>Regenerate this question as<select value={regenTypes[q.id]||"statement_based"} onChange={e=>setRegenTypes(old=>({...old,[q.id]:e.target.value}))}><option value="statement_based">Statement-Based</option><option value="pairing">Pairing / Strict Elimination</option><option value="assertion_reason">Assertion and Reason</option><option value="single_liner">Single-Liner / Factual</option><option value="conceptual">Definitional / Conceptual</option></select></label>
            <div style={{display:"flex",alignItems:"end"}}><button type="button" className="secondary" disabled={working} onClick={()=>void regenerateQuestion(q)}>✨ Regenerate this question</button></div>
          </div>}
          {revisions.filter(r=>r.question_id===q.id&&r.status==="draft").map(rev=><div key={rev.id} style={{marginTop:12,padding:12,border:"1px solid #e8c66a",borderRadius:10}}>
            <strong>Regenerated draft · {({"statement_based":"Statement-Based","pairing":"Pairing / Strict Elimination","assertion_reason":"Assertion and Reason","single_liner":"Single-Liner / Factual","conceptual":"Definitional / Conceptual"} as Record<string,string>)[rev.question_type]||rev.question_type}</strong>
            <p style={{whiteSpace:"pre-wrap"}}>{rev.candidate.question_text}</p>
            {(["option_a","option_b","option_c","option_d"] as const).map((key,i)=><p key={key} style={{margin:"4px 0"}}><strong>{String.fromCharCode(65+i)}.</strong> {rev.candidate[key]}</p>)}
            <p><strong>Correct answer:</strong> {rev.candidate.correct_answer}</p><p>{rev.candidate.explanation}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" className="primary" disabled={working} onClick={()=>void reviewRevision(rev.id,"accept")}>Accept regenerated version</button><button type="button" className="secondary" disabled={working} onClick={()=>void reviewRevision(rev.id,"discard")}>Discard draft</button></div>
          </div>)}
        </article>)}
      </div>}
      {canEdit&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:16,padding:12,border:"1px solid var(--border,#d8dee8)",borderRadius:10}}>
        <label>Time allowed for this test (minutes)<input type="number" min="1" max="300" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)}/></label>
        <div style={{display:"flex",alignItems:"end"}}><button type="button" className="secondary" disabled={working||!Number.isInteger(Number(timeLimit))||Number(timeLimit)<1||Number(timeLimit)>300} onClick={()=>void saveBankSettings()}>Save test settings</button></div>
      </div>}
      {canEdit&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}><button className="secondary" disabled={working} onClick={()=>void saveItems()}>Save edits</button><button className="primary" disabled={working||!items.length} onClick={()=>void doAction("submit")}>Submit for admin approval</button></div>}
      {isAdmin&&selectedBank.status==="pending_review"&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}><button className="primary" disabled={working||!items.length} onClick={()=>void doAction("publish")}>Approve & publish to students</button><button className="secondary" disabled={working} onClick={()=>void doAction("reject")}>Reject bank</button></div>}
      {selectedBank.status==="published"&&<div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><p className="form-success" style={{margin:0}}>Published and visible to students.</p><button type="button" className="secondary" disabled={working} onClick={()=>void manageBank(selectedBank,"unpublish")}>Unpublish this bank</button></div>}
    </section>}
  </section></main>;
}
