"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage={id:number;name:string;sort_order:number};
type Paper={id:number;stage_id:number;paper_no:number;name:string;sort_order:number};
type Item={id:number;paper_id:number;parent_id:number|null;item_type:string;name:string;sort_order:number};
type Note={id:number;syllabus_item_id:number|null;status:string;version:number};
type Result={id:number;name:string;status:"done"|"skipped"|"failed";message?:string};

export default function BulkNotesPage(){
 const router=useRouter();
 const [stages,setStages]=useState<Stage[]>([]),[papers,setPapers]=useState<Paper[]>([]),[items,setItems]=useState<Item[]>([]),[notes,setNotes]=useState<Note[]>([]);
 const [stage,setStage]=useState(""),[paper,setPaper]=useState(""),[subject,setSubject]=useState("");
 const [language,setLanguage]=useState("English"),[format,setFormat]=useState("auto");
 const [loading,setLoading]=useState(true),[running,setRunning]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [done,setDone]=useState(0),[skipped,setSkipped]=useState(0),[failed,setFailed]=useState(0),[current,setCurrent]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 const stopRef=useRef(false);

 useEffect(()=>{(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/");return;}
  const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();
  if(profile?.role!=="admin"||profile.access_status!=="approved"){router.replace("/");return;}
  const [a,b,c,d]=await Promise.all([
   supabase.from("mpsc_exam_stages").select("id,name,sort_order").order("sort_order"),
   supabase.from("mpsc_papers").select("id,stage_id,paper_no,name,sort_order").order("sort_order"),
   supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,item_type,name,sort_order").order("sort_order"),
   supabase.from("ai_note_documents").select("id,syllabus_item_id,status,version")
  ]);
  const e=a.error||b.error||c.error||d.error;
  if(e)setError(e.message);else{setStages(a.data||[]);setPapers(b.data||[]);setItems(c.data||[]);setNotes((d.data||[]) as Note[]);}
  setLoading(false);
 })()},[router]);

 const selectedPapers=useMemo(()=>papers.filter(p=>p.stage_id===Number(stage)),[papers,stage]);
 const selectedSubjects=useMemo(()=>items.filter(i=>i.paper_id===Number(paper)&&i.parent_id===null&&i.item_type==="subject"),[items,paper]);
 const noteIds=useMemo(()=>new Set(notes.map(n=>n.syllabus_item_id).filter((x):x is number=>x!==null)),[notes]);

 function descendants(rootIds:number[]){
  const out:number[]=[]; const queue=[...rootIds];
  while(queue.length){const id=queue.shift()!;out.push(id);for(const child of items.filter(i=>i.parent_id===id))queue.push(child.id);}
  return out;
 }
 const candidates=useMemo(()=>{
  let roots:number[]=[];
  if(subject) roots=[Number(subject)];
  else if(paper) roots=items.filter(i=>i.paper_id===Number(paper)&&i.parent_id===null).map(i=>i.id);
  else if(stage){const pids=papers.filter(p=>p.stage_id===Number(stage)).map(p=>p.id);roots=items.filter(i=>pids.includes(i.paper_id)&&i.parent_id===null).map(i=>i.id);}
  else roots=items.filter(i=>i.parent_id===null).map(i=>i.id);
  const ids=new Set(descendants(roots));
  return items.filter(i=>ids.has(i.id)&&!items.some(c=>c.parent_id===i.id)).sort((a,b)=>a.paper_id-b.paper_id||a.sort_order-b.sort_order);
 },[items,papers,stage,paper,subject]);
 const remaining=candidates.filter(i=>!noteIds.has(i.id));

 function subjectFor(item:Item){
  let cur:Item|undefined=item;
  while(cur?.parent_id){cur=items.find(x=>x.id===cur!.parent_id);}
  return cur?.name||"";
 }

 async function generate(){
  if(!candidates.length){setError("No syllabus topics found for this selection.");return;}
  if(!remaining.length){setMessage("All selected leaf topics already have notes. Nothing to generate.");return;}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token){setError("Your session has expired. Please sign in again.");return;}
  stopRef.current=false;setRunning(true);setError("");setMessage("");setDone(0);setSkipped(0);setFailed(0);setResults([]);
  let d=0,s=0,f=0;
  for(const item of remaining){
   if(stopRef.current)break;
   setCurrent(item.name);
   const paperObj=papers.find(p=>p.id===item.paper_id); const stageObj=stages.find(x=>x.id===paperObj?.stage_id);
   const subjectName=subjectFor(item);
   try{
    const existing=notes.find(n=>n.syllabus_item_id===item.id);
    if(existing){s++;setSkipped(s);continue;}
    const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Admin session expired.");
    const title=item.name;
    const {data:created,error:createError}=await supabase.from("ai_note_documents").insert({syllabus_item_id:item.id,topic_id:null,title,language,content:"",status:"draft",version:0,created_by:user.id,updated_at:new Date().toISOString()}).select("id,syllabus_item_id,status,version").single();
    if(createError||!created)throw new Error(createError?.message||"Could not create draft note.");
    const response=await fetch("/api/ai/study-notes",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({stage:stageObj?.name||"",paper:paperObj?.name||"",subject:subjectName,topic:item.name,title,language,sources:[],additionalInstructions:"This is a bulk syllabus generation job. Stay tightly within this syllabus topic. Include exam-oriented points and avoid unsupported current facts.",sourceMode:"ai_only",format,syllabusTopic:item.name})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"AI generation failed.");
    const content=String(data.content||"").trim();if(!content)throw new Error("AI returned empty content.");
    const {data:saved,error:saveError}=await supabase.from("ai_note_documents").update({content,title:String(data.title||title).trim()||title,version:1,status:"draft",published_at:null,updated_at:new Date().toISOString()}).eq("id",created.id).select("id,syllabus_item_id,status,version").single();
    if(saveError||!saved)throw new Error(saveError?.message||"Could not save generated note.");
    await supabase.from("ai_note_generations").insert({note_id:created.id,model:String(data.model||"gemini-3.1-flash-lite"),prompt_version:"study-notes-v2-bulk",source_ids:[],generated_content:content});
    d++;setDone(d);setResults(r=>[{id:item.id,name:item.name,status:"done"},...r]);
   }catch(e){f++;setFailed(f);setResults(r=>[{id:item.id,name:item.name,status:"failed",message:e instanceof Error?e.message:"Generation failed"},...r]);}
  }
  setCurrent("");setRunning(false);
  const {data:refreshed}=await supabase.from("ai_note_documents").select("id,syllabus_item_id,status,version");
  setNotes((refreshed||[]) as Note[]);
  if(stopRef.current)setMessage("Bulk generation paused. Start again to generate the remaining topics.");else setMessage(`Bulk generation completed. Generated ${d}, skipped ${s}, failed ${f}.`);
 }
 function stop(){stopRef.current=true;setMessage("Stopping after the current topic...");}
 const total=remaining.length,processed=done+failed+skipped,percent=total?Math.round(processed*100/total):0;
 if(loading)return <main className="page"><section className="card admin-card"><p>Loading syllabus...</p></section></main>;
 return <main className="page"><section className="card admin-card notes-admin-card">
  <div className="admin-head"><div><div className="brand">MPSC / UPSC</div><h1>Bulk AI Study Notes</h1><p className="muted">Generate draft notes from the syllabus queue, one topic at a time.</p></div><button className="secondary" onClick={()=>router.push("/admin/notes")}>AI Notes</button></div>
  {error&&<p className="form-error">{error}</p>}{message&&<p className="form-success">{message}</p>}
  <div className="form-grid">
   <label>Stage<select value={stage} disabled={running} onChange={e=>{setStage(e.target.value);setPaper("");setSubject("")}}><option value="">All stages</option>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Paper<select value={paper} disabled={running||!stage} onChange={e=>{setPaper(e.target.value);setSubject("")}}><option value="">All papers</option>{selectedPapers.map(p=><option key={p.id} value={p.id}>Paper {p.paper_no} — {p.name}</option>)}</select></label>
  </div>
  <label>Subject<select value={subject} disabled={running||!paper} onChange={e=>setSubject(e.target.value)}><option value="">All subjects</option>{selectedSubjects.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
  <div className="form-grid"><label>Language<select value={language} disabled={running} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Marathi</option><option>Bilingual</option></select></label><label>Format<select value={format} disabled={running} onChange={e=>setFormat(e.target.value)}><option value="auto">Subject-specific</option><option value="prelims">Prelims-focused</option><option value="mains">Mains-focused</option><option value="answer-writing">Answer-writing</option></select></label></div>
  <div className="bulk-summary"><div><strong>{candidates.length}</strong><span>Leaf topics</span></div><div><strong>{remaining.length}</strong><span>Remaining</span></div><div><strong>{noteIds.size}</strong><span>Existing notes</span></div></div>
  <div className="bulk-progress"><div className="bulk-progress-bar"><span style={{width:`${percent}%`}}/></div><div className="bulk-progress-text"><span>{processed}/{total}</span><span>{percent}%</span></div></div>
  {current&&<p className="muted">Generating: <strong>{current}</strong></p>}
  <div className="admin-row-actions"><button className="ai-generate-button" disabled={running||!remaining.length} onClick={generate}>{running?"✨ Generating...":"✨ Generate Remaining"}</button>{running&&<button className="reject" onClick={stop}>Pause</button>}<button className="secondary" disabled={running} onClick={()=>router.push("/admin/notes")}>Review Notes</button></div>
  {results.length>0&&<section className="admin-test-list"><div className="section-heading"><div><h2>Latest Results</h2><p>Generated notes remain drafts until you review and publish them.</p></div></div><div className="test-list">{results.slice(0,30).map(r=><article className="test-card admin-test-row" key={`${r.id}-${r.status}`}><div className="test-card-main"><div className={r.status==="done"?"status published":"status draft"}>{r.status}</div><h2>{r.name}</h2>{r.message&&<p>{r.message}</p>}</div></article>)}</div></section>}
 </section></main>;
}
