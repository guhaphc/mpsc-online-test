"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage={id:number;name:string;sort_order:number};
type Paper={id:number;stage_id:number;paper_no:number;name:string;sort_order:number};
type Item={id:number;paper_id:number;parent_id:number|null;item_type:string;name:string;sort_order:number};
type Note={id:number;syllabus_item_id:number|null;title:string;content:string|null;language:string;status:string;version:number;updated_at:string};

export default function NotesPage(){
 const router=useRouter();
 const [stages,setStages]=useState<Stage[]>([]),[papers,setPapers]=useState<Paper[]>([]),[items,setItems]=useState<Item[]>([]),[notes,setNotes]=useState<Note[]>([]);
 const [stage,setStage]=useState(""),[paper,setPaper]=useState(""),[subject,setSubject]=useState(""),[topic,setTopic]=useState("");
 const [open,setOpen]=useState<number|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/");return;}
  const {data:p}=await supabase.from("mpsc_profiles").select("access_status,role").eq("id",user.id).maybeSingle();
  if(p?.access_status!=="approved"||p?.role==="admin"){router.replace(p?.role==="admin"?"/admin":"/pending");return;}
  const [a,b,c,n]=await Promise.all([
   supabase.from("mpsc_exam_stages").select("id,name,sort_order").order("sort_order"),
   supabase.from("mpsc_papers").select("id,stage_id,paper_no,name,sort_order").order("sort_order"),
   supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,item_type,name,sort_order").order("sort_order"),
   supabase.from("ai_note_documents").select("id,syllabus_item_id,title,content,language,status,version,updated_at").eq("status","published").order("updated_at",{ascending:false})
  ]);
  const e=a.error||b.error||c.error||n.error;if(e)setError(e.message);else{setStages(a.data||[]);setPapers(b.data||[]);setItems(c.data||[]);setNotes((n.data||[]) as Note[]);}setLoading(false);
 })()},[router]);

 const ps=useMemo(()=>papers.filter(x=>x.stage_id===Number(stage)),[papers,stage]);
 const ss=useMemo(()=>items.filter(x=>x.paper_id===Number(paper)&&x.item_type==="subject"&&x.parent_id===null),[items,paper]);
 const ts=useMemo(()=>items.filter(x=>x.parent_id===Number(subject)&&(x.item_type==="topic"||x.item_type==="subtopic")),[items,subject]);
 const visible=useMemo(()=>notes.filter(n=>!topic||n.syllabus_item_id===Number(topic)),[notes,topic]);
 const noteTopic=(id:number|null)=>items.find(x=>x.id===id)?.name||"";
 const selected=visible.find(n=>n.id===open)||null;

 if(loading)return <main className="page"><section className="card"><p>Loading Study Notes...</p></section></main>;
 if(error)return <main className="page"><section className="card"><h2>Unable to load notes</h2><p>{error}</p><button onClick={()=>location.reload()}>Retry</button></section></main>;

 return <main className="page"><section className="card notes-student-card">
  <div className="subjects-header"><div><div className="eyebrow">MPSC / UPSC</div><h1>Interactive Study Notes</h1><p>Open a syllabus topic and study its published notes.</p></div><button className="secondary-button" onClick={()=>router.push("/student")}>Dashboard</button></div>
  <div className="notes-filters">
   <label>Examination<select value={stage} onChange={e=>{setStage(e.target.value);setPaper("");setSubject("");setTopic("")}}><option value="">All examinations</option>{stages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label>Paper<select value={paper} disabled={!stage} onChange={e=>{setPaper(e.target.value);setSubject("");setTopic("")}}><option value="">All papers</option>{ps.map(x=><option key={x.id} value={x.id}>Paper {x.paper_no} — {x.name}</option>)}</select></label>
   <label>Subject<select value={subject} disabled={!paper} onChange={e=>{setSubject(e.target.value);setTopic("")}}><option value="">All subjects</option>{ss.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label>Topic<select value={topic} disabled={!subject} onChange={e=>setTopic(e.target.value)}><option value="">All topics</option>{ts.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  </div>
  <div className="notes-summary"><strong>{visible.length}</strong><span>published notes</span></div>
  {visible.length===0?<div className="empty-box"><strong>No published notes for this selection</strong><span>Choose another topic or check back after the administrator publishes notes.</span></div>:
   <div className="notes-list">{visible.map(n=><article className={open===n.id?"note-reader active":"note-reader"} key={n.id}>
    <button className="note-header" onClick={()=>setOpen(open===n.id?null:n.id)}><span><strong>{n.title}</strong><small>{noteTopic(n.syllabus_item_id)} · {n.language} · v{n.version}</small></span><span>{open===n.id?"−":"+"}</span></button>
    {open===n.id&&<div className="note-content">{n.content?.split(/\n\n+/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}<div className="note-footer">Published study note · Updated {new Date(n.updated_at).toLocaleDateString()}</div></div>}
   </article>)}</div>}
 </section></main>;
}
