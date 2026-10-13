"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Bank={id:string;title:string;exam:string;subject:string;topic:string;language:string;status:string};
type Question={id:string;question_order:number;question_text:string;option_a:string;option_b:string;option_c:string;option_d:string;difficulty:string;source_reference:string};
type DeepExplanation={question_id:string;concept:string;detailed_explanation:string;option_analysis:Record<string,string>;example:string;exam_takeaways:string[];memory_aid:string;caution:string};
type Result={question_id:string;question_order:number;question_text:string;options:Record<string,string>;selected_answer:string;correct_answer:string;correct:boolean;explanation:string;difficulty:string;source_reference:string;deep_explanation?:DeepExplanation};
export default function QuestionBanksPage(){
 const router=useRouter();
 const [banks,setBanks]=useState<Bank[]>([]);
 const [bank,setBank]=useState<Bank|null>(null);
 const [questions,setQuestions]=useState<Question[]>([]);
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [results,setResults]=useState<Result[]|null>(null);
 const [score,setScore]=useState<{total:number;answered:number;correct:number;score_percent:number}|null>(null);
 const [loading,setLoading]=useState(true);
 const [working,setWorking]=useState(false);
 const [explanationWorking,setExplanationWorking]=useState(false);
 const [error,setError]=useState("");
 async function getToken(){const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error("Please sign in again.");return session.access_token;}
 async function api(path:string,init:RequestInit={}){const token=await getToken();const res=await fetch(path,{...init,headers:{...(init.headers||{}),Authorization:"Bearer "+token}});const json=await res.json();if(!res.ok)throw new Error(json.error||"Request failed.");return json;}
 async function load(){try{const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();if(profile?.access_status!=="approved"){router.replace("/pending");return;}const result=await api("/api/question-banks");setBanks(result.banks||[]);}catch(e){setError(e instanceof Error?e.message:"Could not load question banks.");}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 async function openBank(id:string){setWorking(true);setError("");setResults(null);setScore(null);setAnswers({});try{const data=await api("/api/question-banks?bank_id="+encodeURIComponent(id));setBank(data.bank);setQuestions(data.questions||[]);}catch(e){setError(e instanceof Error?e.message:"Could not open bank.");}finally{setWorking(false);}}
 async function submit(){if(!bank)return;setWorking(true);setError("");try{const payload=questions.map(q=>({question_id:q.id,answer:answers[q.id]||""}));const data=await api("/api/question-banks/attempt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:bank.id,answers:payload})});setResults(data.results||[]);setScore({total:data.total,answered:data.answered,correct:data.correct,score_percent:data.score_percent});window.scrollTo({top:0,behavior:"smooth"});}catch(e){setError(e instanceof Error?e.message:"Could not grade attempt.");}finally{setWorking(false);}}
 async function generateDeepExplanations(){if(!bank||!results)return;setExplanationWorking(true);setError("");try{const payload=questions.map(q=>({question_id:q.id,answer:answers[q.id]||""}));const data=await api("/api/question-banks/explanations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bank_id:bank.id,answers:payload})});const deep:DeepExplanation[]=data.explanations||[];setResults(old=>(old||[]).map(r=>({...r,deep_explanation:deep.find(x=>x.question_id===r.question_id)})));}catch(e){setError(e instanceof Error?e.message:"Could not generate in-depth explanations.");}finally{setExplanationWorking(false);}}
 return <main className="page"><section className="card" style={{maxWidth:950,margin:"0 auto"}}>
  <header style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"flex-start"}}><div><div className="eyebrow">MPSC / UPSC</div><h1>Practice Question Banks</h1><p className="muted">Practise published AI-generated MCQs and review explanations after submitting.</p></div><button className="secondary" onClick={()=>router.push("/student")}>Dashboard</button></header>
  {error&&<p className="form-error" role="alert">{error}</p>}
  {!bank&&<section style={{marginTop:20}}>{loading?<p>Loading published question banks…</p>:banks.length===0?<div className="empty-box"><strong>No published question banks yet</strong><span>Approved question banks will appear here.</span></div>:<div style={{display:"grid",gap:12}}>{banks.map(b=><article key={b.id} style={{border:"1px solid var(--border,#d8dee8)",borderRadius:12,padding:16,display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><div className="eyebrow">{b.exam} · {b.language}</div><h2 style={{margin:"5px 0"}}>{b.title}</h2><p className="muted" style={{margin:0}}>{b.subject}{b.topic?" · "+b.topic:""}</p></div><button className="primary" disabled={working} onClick={()=>void openBank(b.id)}>Start practice</button></article>)}</div>}</section>}
  {bank&&<section style={{marginTop:20}}>
   <button className="secondary" onClick={()=>{setBank(null);setQuestions([]);setResults(null);setScore(null);setAnswers({});}}>← All question banks</button>
   <h2>{bank.title}</h2><p className="muted">{bank.subject}{bank.topic?" · "+bank.topic:""} · {questions.length} questions</p>
   {score&&<div style={{border:"1px solid #bbdfc8",background:"#f0fdf4",borderRadius:12,padding:16,margin:"16px 0"}}><div className="eyebrow">YOUR RESULT</div><h2 style={{margin:"6px 0"}}>{score.correct} / {score.total} correct · {score.score_percent}%</h2><p style={{margin:0}}>Answered {score.answered} of {score.total}. Review the explanations below.</p></div>}
   <div style={{display:"grid",gap:14,marginTop:16}}>
    {questions.map((q,index)=>{
     const result=results?.find(r=>r.question_id===q.id);
     const options={A:q.option_a,B:q.option_b,C:q.option_c,D:q.option_d};
     return (
      <article key={q.id} style={{border:"1px solid var(--border,#d8dee8)",borderRadius:12,padding:16}}>
       <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><strong>Q{index+1}</strong><span className="eyebrow">{q.difficulty}</span></div>
       <h3 style={{whiteSpace:"pre-wrap"}}>{q.question_text}</h3>
       <div style={{display:"grid",gap:8}}>
        {(["A","B","C","D"] as const).map(letter=>{
         const correct=result?.correct_answer===letter;
         const wrong=result?.selected_answer===letter&&!result.correct;
         return <label key={letter} style={{display:"flex",alignItems:"flex-start",gap:10,padding:10,border:"1px solid "+(correct?"#86efac":wrong?"#fca5a5":"var(--border,#d8dee8)"),borderRadius:9,background:correct?"#f0fdf4":wrong?"#fff1f2":"transparent"}}>
          <input type="radio" name={q.id} value={letter} disabled={!!results||working} checked={(answers[q.id]||"")===letter} onChange={()=>setAnswers(old=>({...old,[q.id]:letter}))}/>
          <span><strong>{letter}.</strong> {options[letter]}{correct?" ✓ Correct answer":""}{wrong?" — Your answer":""}</span>
         </label>;
        })}
       </div>
       {result && <div style={{marginTop:12,padding:12,background:"var(--surface,#f7f7f7)",borderRadius:8}}>
        <strong>Basic explanation</strong><p style={{whiteSpace:"pre-wrap",marginBottom:6}}>{result.explanation}</p>
        {result.source_reference && <small className="muted">Source: {result.source_reference}</small>}
        {result.deep_explanation && <div style={{marginTop:14,display:"grid",gap:10}}>
         <h4 style={{margin:"4px 0"}}>AI in-depth explanation</h4>
         <div><strong>Concept</strong><p>{result.deep_explanation.concept}</p></div>
         <div><strong>Detailed explanation</strong><p style={{whiteSpace:"pre-wrap"}}>{result.deep_explanation.detailed_explanation}</p></div>
         <div><strong>Why each option is right or wrong</strong>{(["A","B","C","D"] as const).map(letter=><p key={letter}><b>{letter}.</b> {result.deep_explanation?.option_analysis[letter]}</p>)}</div>
         <div><strong>Example</strong><p>{result.deep_explanation.example}</p></div>
         <div><strong>MPSC/UPSC exam takeaways</strong><ul>{result.deep_explanation.exam_takeaways.map((point,i)=><li key={i}>{point}</li>)}</ul></div>
         <div><strong>Memory aid</strong><p>{result.deep_explanation.memory_aid}</p></div>
         {result.deep_explanation.caution && <p className="muted">{result.deep_explanation.caution}</p>}
        </div>}
       </div>}
      </article>
     );
    })}
   </div>
   {!results?<button className="primary" style={{marginTop:18,width:"100%"}} disabled={working||!questions.length} onClick={()=>void submit()}>{working?"Checking answers…":"Submit answers and view results"}</button>:<div style={{display:"grid",gap:10,marginTop:18}}><button className="primary" style={{width:"100%"}} disabled={explanationWorking} onClick={()=>void generateDeepExplanations()}>{explanationWorking?"Generating in-depth explanations…":results.some(r=>r.deep_explanation)?"Regenerate AI explanations":"Generate in-depth AI explanations for all questions"}</button><button className="secondary" onClick={()=>{setBank(null);setQuestions([]);setResults(null);setScore(null);setAnswers({});}}>Finish practice</button></div>}
  </section>}
 </section></main>;
}
