"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage = { id:number; name:string; sort_order:number };
type Paper = { id:number; stage_id:number; paper_no:number; name:string; sort_order:number };
type Item = { id:number; paper_id:number; parent_id:number|null; item_type:string; name:string; sort_order:number };
type Note = { id:number; syllabus_item_id:number|null; topic_id:number|null; title:string; content:string|null; language:string; status:string; version:number; created_at:string; updated_at:string; published_at:string|null };
type Source = { id:number; note_id:number; source_type:string; title:string; url:string|null; file_url:string|null; storage_path:string|null; description:string|null; source_order:number };
type NoteForm = { stage:string; paper:string; subject:string; topic:string; title:string; language:string; content:string };
type SourceForm = { type:string; title:string; url:string; file:string; description:string; upload:File|null };

const emptyNote = ():NoteForm => ({ stage:"", paper:"", subject:"", topic:"", title:"", language:"English", content:"", customTopic:"", instructions:"", sourceMode:"ai_reference", format:"auto" });
const emptySource = ():SourceForm => ({ type:"web", title:"", url:"", file:"", description:"", upload:null });

export default function AdminNotesPage(){
  const router=useRouter();
  const [stages,setStages]=useState<Stage[]>([]),[papers,setPapers]=useState<Paper[]>([]),[items,setItems]=useState<Item[]>([]),[notes,setNotes]=useState<Note[]>([]),[sources,setSources]=useState<Source[]>([]);
  const [form,setForm]=useState<NoteForm>(emptyNote()),[sourceForm,setSourceForm]=useState<SourceForm>(emptySource()),[editing,setEditing]=useState<Note|null>(null);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[generating,setGenerating]=useState(false),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState(""),[success,setSuccess]=useState("");

  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/");return;}
    const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();
    if(profile?.role!=="admin"||profile.access_status!=="approved"){router.replace("/");return;}
    const [a,b,c,d]=await Promise.all([
      supabase.from("mpsc_exam_stages").select("id,name,sort_order").order("sort_order"),
      supabase.from("mpsc_papers").select("id,stage_id,paper_no,name,sort_order").order("sort_order"),
      supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,item_type,name,sort_order").order("sort_order"),
      supabase.from("ai_note_documents").select("*").order("updated_at",{ascending:false})
    ]);
    const e=a.error||b.error||c.error||d.error;
    if(e)setError(e.message);else{setStages(a.data||[]);setPapers(b.data||[]);setItems(c.data||[]);setNotes((d.data||[]) as Note[]);}
    setLoading(false);
  })()},[router]);

  const selectedPapers=useMemo(()=>papers.filter(p=>p.stage_id===Number(form.stage)),[papers,form.stage]);
  const selectedSubjects=useMemo(()=>items.filter(i=>i.paper_id===Number(form.paper)&&i.item_type==="subject"&&i.parent_id===null),[items,form.paper]);
  const selectedTopics=useMemo(()=>items.filter(i=>i.parent_id===Number(form.subject)&&(i.item_type==="topic"||i.item_type==="subtopic")),[items,form.subject]);
  const setField=(key:keyof NoteForm,value:string)=>setForm(v=>({...v,[key]:value}));
  const reset=()=>{setEditing(null);setForm(emptyNote());setSourceForm(emptySource());setSources([]);setError("");setSuccess("");};

  async function editNote(note:Note){
    setError("");setSuccess("");setEditing(note);
    const item=items.find(x=>x.id===note.syllabus_item_id);const parent=item?.parent_id?items.find(x=>x.id===item.parent_id):null;const paper=papers.find(x=>x.id===item?.paper_id);const stage=stages.find(x=>x.id===paper?.stage_id);
    setForm({stage:String(stage?.id||""),paper:String(paper?.id||""),subject:String(parent?.id||""),topic:String(item?.id||""),title:note.title,language:note.language,content:note.content||"",customTopic:"",instructions:"",sourceMode:"ai_reference",format:"auto"});
    const {data,error:sourceError}=await supabase.from("ai_note_sources").select("*").eq("note_id",note.id).order("source_order");
    if(sourceError)setError(sourceError.message);else setSources((data||[]) as Source[]);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function saveNote(e:FormEvent){
    e.preventDefault();setError("");setSuccess("");
    if(!form.stage||!form.paper||!form.subject||(!form.topic&&!form.customTopic.trim())||!form.title.trim()){setError("Select the complete syllabus path and enter a note title.");return;}
    setSaving(true);
    const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}
    const payload={syllabus_item_id:Number(form.topic),topic_id:null,title:form.title.trim(),language:form.language,content:form.content,updated_at:new Date().toISOString()};
    const result=editing?await supabase.from("ai_note_documents").update(payload).eq("id",editing.id).select().single():await supabase.from("ai_note_documents").insert({...payload,created_by:user.id}).select().single();
    if(result.error||!result.data)setError(result.error?.message||"Could not save the note.");else{const note=result.data as Note;setEditing(note);setNotes(v=>editing?v.map(n=>n.id===note.id?note:n):[note,...v]);setSuccess("Note saved. Add sources, then generate AI notes.");}
    setSaving(false);
  }

  async function addSource(e:FormEvent){
    e.preventDefault();setError("");setSuccess("");
    if(!editing){setError("Save the note first.");return;}
    const autoTitle=sourceForm.title.trim() || sourceForm.upload?.name.replace(/\.[^/.]+$/,"") || "Reference source";
    if(!sourceForm.url.trim()&&!sourceForm.file.trim()&&!sourceForm.upload){setError("Add a URL or select a PDF/image from your phone.");return;}
    let storagePath:string|null=null;let fileUrl=sourceForm.file.trim()||null;
    if(sourceForm.upload){
      if(sourceForm.upload.size>8*1024*1024){setError("File is too large. Maximum size is 8 MB.");return;}
      const allowed=["application/pdf","image/jpeg","image/png","image/webp"];
      if(!allowed.includes(sourceForm.upload.type)){setError("Only PDF, JPG, PNG, and WEBP files are supported.");return;}
      const safe=sourceForm.upload.name.replace(/[^a-zA-Z0-9._-]/g,"_");storagePath=`${editing.id}/${crypto.randomUUID()}-${safe}`;
      const {error:uploadError}=await supabase.storage.from("ai-note-sources").upload(storagePath,sourceForm.upload,{contentType:sourceForm.upload.type,upsert:false});
      if(uploadError){setError(uploadError.message);return;}fileUrl=null;
    }
    const sourceType=sourceForm.upload?(sourceForm.upload.type==="application/pdf"?"pdf":"image"):sourceForm.type;
    const {data,error:sourceError}=await supabase.from("ai_note_sources").insert({note_id:editing.id,source_type:sourceType,title:autoTitle,url:sourceForm.url.trim()||null,file_url:fileUrl,storage_path:storagePath,description:sourceForm.description.trim()||null,source_order:sources.length}).select().single();
    if(sourceError||!data){if(storagePath)await supabase.storage.from("ai-note-sources").remove([storagePath]);setError(sourceError?.message||"Could not add source.");return;}
    setSources(v=>[...v,data as Source]);setSourceForm(emptySource());setSuccess("Source added successfully. You can now generate AI notes.");
  }

  async function deleteSource(source:Source){
    setBusy(source.id);setError("");
    const {error:e}=await supabase.from("ai_note_sources").delete().eq("id",source.id);
    if(e)setError(e.message);else{if(source.storage_path)await supabase.storage.from("ai-note-sources").remove([source.storage_path]);setSources(v=>v.filter(s=>s.id!==source.id));}
    setBusy(null);
  }

  async function generateNotes(){
    if(!editing){setError("Save the note first.");return;}if(!sources.length){setError("Add at least one source before generating.");return;}
    setGenerating(true);setError("");setSuccess("");
    try{
      const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error("Your session has expired. Please sign in again.");
      const stage=stages.find(x=>x.id===Number(form.stage))?.name||"";const paper=papers.find(x=>x.id===Number(form.paper))?.name||"";const subject=items.find(x=>x.id===Number(form.subject))?.name||"";const topic=form.customTopic.trim()||items.find(x=>x.id===Number(form.topic))?.name||"";
      const response=await fetch("/api/ai/study-notes",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({stage,paper,subject,topic,title:form.title,language:form.language,sources,additionalInstructions:form.instructions,sourceMode:form.sourceMode,format:form.format,syllabusTopic:items.find(x=>x.id===Number(form.topic))?.name||null})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"AI note generation failed.");const content=String(data.content||"").trim();if(!content)throw new Error("AI returned empty notes.");
      const {data:saved,error:e}=await supabase.from("ai_note_documents").update({content,version:(editing.version||1)+1,updated_at:new Date().toISOString()}).eq("id",editing.id).select().single();if(e||!saved)throw new Error(e?.message||"Could not save generated notes.");
      await supabase.from("ai_note_generations").insert({note_id:editing.id,model:String(data.model||"gemini-3.1-flash-lite"),prompt_version:"study-notes-v1",source_ids:sources.map(s=>s.id),generated_content:content});
      setEditing(saved as Note);setNotes(v=>v.map(n=>n.id===editing.id?saved as Note:n));setForm(v=>({...v,content}));setSuccess("Draft generated successfully. Review and edit before publishing.");
    }catch(e){setError(e instanceof Error?e.message:"AI note generation failed.")}finally{setGenerating(false);}
  }

  async function togglePublish(note:Note){
    setBusy(note.id);setError("");const published=note.status==="published";const {data,error:e}=await supabase.from("ai_note_documents").update({status:published?"draft":"published",published_at:published?null:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",note.id).select().single();
    if(e||!data)setError(e?.message||"Could not update note status.");else{setNotes(v=>v.map(n=>n.id===note.id?data as Note:n));setSuccess(published?"Note unpublished.":"Note published.");}setBusy(null);
  }

  async function deleteNote(note:Note){
    if(!window.confirm(`Delete “${note.title}”?`))return;setBusy(note.id);setError("");const {error:e}=await supabase.from("ai_note_documents").delete().eq("id",note.id);if(e)setError(e.message);else{setNotes(v=>v.filter(n=>n.id!==note.id));if(editing?.id===note.id)reset();setSuccess("Note deleted.");}setBusy(null);
  }

  const topicName=(id:number|null)=>items.find(i=>i.id===id)?.name||"General";
  const paperName=(id:number|null)=>{const i=items.find(x=>x.id===id);const p=papers.find(x=>x.id===i?.paper_id);return p?`Paper ${p.paper_no} · ${p.name}`:"No paper";};

  if(loading)return <main className="page"><section className="card admin-card"><p>Loading AI Study Notes...</p></section></main>;

  return <main className="page"><section className="card admin-card notes-admin-card">
    <div className="admin-head"><div><div className="brand">MPSC / UPSC</div><h1>AI Study Notes</h1><p className="muted">Create, source, edit, review and publish syllabus-linked notes.</p></div><button className="secondary" onClick={()=>router.push("/admin")}>Admin Dashboard</button></div>
    {error&&<p className="form-error">{error}</p>}{success&&<p className="form-success">{success}</p>}
    <div className="admin-tools"><div><strong>{editing?"Edit note":"Create a note"}</strong><span>Every note is linked to a syllabus topic.</span></div><button className="secondary" onClick={reset}>New Note</button></div>
    <form className="form notes-form" onSubmit={saveNote}>
      <label>Examination Stage<select value={form.stage} onChange={e=>{setField("stage",e.target.value);setField("paper","");setField("subject","");setField("topic","")}}><option value="">Select stage</option>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Paper<select value={form.paper} disabled={!form.stage} onChange={e=>{setField("paper",e.target.value);setField("subject","");setField("topic","")}}><option value="">Select paper</option>{selectedPapers.map(p=><option key={p.id} value={p.id}>Paper {p.paper_no} — {p.name}</option>)}</select></label>
      <label>Subject<select value={form.subject} disabled={!form.paper} onChange={e=>{setField("subject",e.target.value);setField("topic","")}}><option value="">Select subject</option>{selectedSubjects.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
      <label>Syllabus Topic<select value={form.topic} disabled={!form.subject} onChange={e=>setField("topic",e.target.value)}><option value="">Select topic</option>{selectedTopics.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
      <label>Specific Generation Topic <span className="field-optional">(optional — customize wording without changing the syllabus link)</span><textarea value={form.customTopic} onChange={e=>setField("customTopic",e.target.value)} rows={3} placeholder="Example: Emotional Intelligence — meaning, components, administrative applications and MPSC answer-writing points."/></label><div className="form-grid"><label>Note Format<select value={form.format} onChange={e=>setField("format",e.target.value)}><option value="auto">Subject-specific MPSC format</option><option value="standard">Standard MPSC study note</option><option value="prelims">Prelims-focused</option><option value="mains">Mains-focused</option><option value="answer-writing">Mains answer-writing</option></select></label><label>Generation Source<select value={form.sourceMode} onChange={e=>setField("sourceMode",e.target.value)}><option value="ai_reference">AI + reference material</option><option value="ai_only">AI knowledge only</option><option value="reference_only">Reference material only</option></select></label></div><label>Additional AI Instructions <span className="field-optional">(optional)</span><textarea value={form.instructions} onChange={e=>setField("instructions",e.target.value)} rows={3} placeholder="Focus on specific points, examples, committees, Maharashtra relevance, Prelims and Mains."/></label><label>Note Title<input value={form.title} onChange={e=>setField("title",e.target.value)} placeholder="e.g. Indian National Movement"/></label>
      <label>Language<select value={form.language} onChange={e=>setField("language",e.target.value)}><option>English</option><option>Marathi</option><option>Bilingual</option></select></label>
      <label>Note Content<textarea value={form.content} onChange={e=>setField("content",e.target.value)} rows={14} placeholder="AI-generated or manually edited content appears here."/></label>
      <button className="primary" disabled={saving}>{saving?"Saving...":editing?"Save Note":"Create Draft Note"}</button>
      {editing&&<button type="button" className="ai-generate-button" disabled={generating||saving||sources.length===0} onClick={generateNotes}>{generating?"✨ Generating notes...":"✨ Generate AI Notes"}</button>}
    </form>
    {editing&&<section className="notes-source-box">
      <div className="section-heading"><div><h2>Sources</h2><p>Upload a PDF/image from Android or add a reference URL.</p></div></div>
      {sources.length>0&&<div className="source-list">{sources.map(s=><article className="source-row" key={s.id}><div><strong>{s.title}</strong><span>{s.source_type.toUpperCase()} · {s.storage_path?"Private upload":s.url||s.file_url||"Reference"}</span>{s.description&&<small>{s.description}</small>}</div><button className="reject" disabled={busy===s.id} onClick={()=>deleteSource(s)}>Delete</button></article>)}</div>}
      <form className="form source-form" onSubmit={addSource}>
        <label>Source Type<select value={sourceForm.type} onChange={e=>setSourceForm(v=>({...v,type:e.target.value}))}><option value="web">Website</option><option value="pdf">PDF</option><option value="image">Image</option><option value="document">Document</option><option value="book">Book / Reference</option><option value="manual">Manual</option></select></label>
        <label>Source Title<input value={sourceForm.title} onChange={e=>setSourceForm(v=>({...v,title:e.target.value}))} placeholder="e.g. Government report"/></label>
        <label>Website URL<input type="url" value={sourceForm.url} onChange={e=>setSourceForm(v=>({...v,url:e.target.value}))} placeholder="https://..."/></label>
        <label>Public File URL<input type="url" value={sourceForm.file} onChange={e=>setSourceForm(v=>({...v,file:e.target.value}))} placeholder="Optional public PDF/image URL"/></label>
        <label>Upload PDF / Image<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setSourceForm(v=>({...v,upload:e.target.files?.[0]||null}))}/>{sourceForm.upload&&<small className="upload-name">Selected: {sourceForm.upload.name}</small>}</label>
        <label>Description<input value={sourceForm.description} onChange={e=>setSourceForm(v=>({...v,description:e.target.value}))}/></label>
        <button className="secondary" type="submit">+ Add Source</button>
      </form>
    </section>}
    <section className="admin-test-list"><div className="section-heading"><div><h2>All Notes</h2><p>Students can access only published notes.</p></div></div>
      {notes.length===0?<div className="empty-box"><strong>No notes yet</strong><span>Create your first syllabus-linked study note.</span></div>:<div className="test-list">{notes.map(n=><article className="test-card admin-test-row" key={n.id}><div className="test-card-main"><div className={n.status==="published"?"status published":"status draft"}>{n.status}</div><h2>{n.title}</h2><p>{paperName(n.syllabus_item_id)} · {topicName(n.syllabus_item_id)}</p><div className="test-details"><span>{n.language}</span><span>Version {n.version}</span><span>{new Date(n.updated_at).toLocaleDateString()}</span></div></div><div className="admin-row-actions"><button className="secondary" onClick={()=>editNote(n)}>Edit</button><button className={n.status==="published"?"secondary":"approve"} disabled={busy===n.id} onClick={()=>togglePublish(n)}>{n.status==="published"?"Unpublish":"Publish"}</button><button className="reject" disabled={busy===n.id} onClick={()=>deleteNote(n)}>Delete</button></div></article>)}</div>}
    </section>
  </section></main>;
}
