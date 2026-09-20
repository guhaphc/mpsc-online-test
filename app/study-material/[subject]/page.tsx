// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ancientHistorySections } from "@/lib/ancient-history-complete";
import { governanceSections } from "@/lib/governance-complete";
import { governanceComprehensiveEnhancements } from "@/lib/governance-comprehensive";
import { politySections } from "@/lib/polity-complete";
import { polityFoundationDetailedSections } from "@/lib/polity-foundation-detailed";
import { polityExecutiveAndDpspDetailedSections } from "@/lib/polity-executive-dpsp-detailed";
import { polityParliamentJudiciaryDetailedSections } from "@/lib/polity-parliament-judiciary-detailed";
import { polityJudicialLocalDetailedSections } from "@/lib/polity-judicial-local-detailed";
import { polityPart2DetailedSections } from "@/lib/polity-part2-detailed";
import { polityPart2Chapters40to54DetailedSections } from "@/lib/polity-part2-chapters40-54-detailed";
import { fundamentalRightsSections } from "@/lib/fundamental-rights-complete";
import { medievalHistoryPdfSections } from "@/lib/medieval-history-pdf";

const subjects:Record<string,string>={
 "polity":"Indian Polity","governance":"Governance","ancient-history":"Ancient History","medieval-history":"Medieval History",
 "modern-history":"Modern Indian History","world-history":"World History","indian-culture":"Indian Culture","physical-geography":"Physical Geography","indian-geography":"Indian Geography","indian-society":"Indian Society","agriculture":"Agriculture","economy":"Indian Economy","industry-infrastructure":"Industry & Infrastructure","science-technology":"Science & Technology","defence-security":"Defence & Security","nuclear-energy":"Nuclear Energy & Technology","nanotechnology":"Nano Technology","ipr":"Intellectual Property Rights","environment-ecology":"Environment & Ecology","climate-change":"Climate Change","internal-security":"Internal Security","disaster-management":"Disaster Management","ethics":"Ethics, Integrity & Aptitude","applied-ethics":"Applied Ethics","essay":"Essay","current-affairs":"Current Affairs & Important Information"
};

type Section={id:string;chapter?:string;title:string;subtitle:string;body:string[];facts?:string[];subtopics?:{title:string;points:string[]}[]};

export default function StudyMaterialSubjectPage(){
 const router=useRouter(); const params=useParams<{subject:string}>(); const subjectKey=params?.subject||"";
 const sections:Section[]=subjectKey==="polity"
  ? [...polityFoundationDetailedSections,...polityExecutiveAndDpspDetailedSections,...fundamentalRightsSections,...polityParliamentJudiciaryDetailedSections,...polityJudicialLocalDetailedSections,...polityPart2DetailedSections,...polityPart2Chapters40to54DetailedSections]
  : subjectKey==="governance"?governanceSections
  : subjectKey==="governance"?governanceSections.map(s=>{const e=governanceComprehensiveEnhancements[s.id];return e?{...s,...e,facts:[...(s.facts||[]),...(e.facts||[])]}:s})
  : subjectKey==="ancient-history"?ancientHistorySections
  : subjectKey==="medieval-history"?medievalHistoryPdfSections:[];
 const [loading,setLoading]=useState(true),[active,setActive]=useState(sections[0]?.id||"");
 const [chapterOpen,setChapterOpen]=useState(false),[topicsOpen,setTopicsOpen]=useState(false);
 const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(""),[nightMode,setNightMode]=useState(false);
 const [done,setDone]=useState<string[]>([]),[language,setLanguage]=useState<"Marathi"|"English">("Marathi");
 const [translatedById,setTranslatedById]=useState<Record<string,Section>>({});
 const [translationLoading,setTranslationLoading]=useState(false),[translationError,setTranslationError]=useState("");
 const [aiOpen,setAiOpen]=useState(false),[aiLoading,setAiLoading]=useState(false),[aiError,setAiError]=useState(""),[aiAnalysis,setAiAnalysis]=useState(""),[aiPoint,setAiPoint]=useState("");
 const [pageReading,setPageReading]=useState(true),[keywords,setKeywords]=useState<string[]>([]),[keywordsLoading,setKeywordsLoading]=useState(false),[keywordsError,setKeywordsError]=useState("");
 const [currentAffairs,setCurrentAffairs]=useState<CurrentAffair[]>([]),[courtJudgments,setCourtJudgments]=useState<CourtJudgment[]>([]);

 const title=subjects[subjectKey]||"Study Material";
 const displaySections=sections.map(s=>translatedById[language+":"+s.id]||s);
 const current=displaySections.find(s=>s.id===active)||displaySections[0];
 const chapters=useMemo(()=>Array.from(new Set(sections.map(s=>s.chapter||"General"))),[sections]);
 const currentChapter=current?.chapter||"General";
 const chapterSections=displaySections.filter(s=>(s.chapter||"General")===currentChapter);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return displaySections;return displaySections.filter(s=>(s.title+" "+s.subtitle+" "+s.body.join(" ")+" "+(s.facts||[]).join(" ")).toLowerCase().includes(q));},[query,displaySections]);
 const completedCount=done.filter(id=>sections.some(s=>s.id===id)).length;
 const progress=Math.round(completedCount/Math.max(sections.length,1)*100);

 useEffect(()=>{try{const saved=localStorage.getItem(`study-progress-${subjectKey}`);if(saved)setDone(JSON.parse(saved));}catch{}},[subjectKey]);
 useEffect(()=>{try{localStorage.setItem(`study-progress-${subjectKey}`,JSON.stringify(done));}catch{}},[done,subjectKey]);
 useEffect(()=>{
  let cancelled=false;
  (async()=>{
   if(!current)return; setKeywords([]);setKeywordsError("");setKeywordsLoading(true);
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error("Authentication required.");
    const response=await fetch("/api/ai/study-keywords",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({title:current.title,subtitle:current.subtitle,content:(current.body||[]).join("\n").slice(0,30000)})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Keywords failed.");
    if(!cancelled)setKeywords(Array.isArray(data.keywords)?data.keywords.slice(0,8):[]);
   }catch(e){if(!cancelled)setKeywordsError(e instanceof Error?e.message:"Keywords unavailable.");}
   finally{if(!cancelled)setKeywordsLoading(false);}
  })();
  return()=>{cancelled=true};
 },[current?.id]);

 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();if(profile?.role==="admin"&&profile?.access_status==="approved"){router.replace("/admin");return;}if(profile?.access_status!=="approved"){router.replace("/pending");return;}setLoading(false);})();},[router]);
 useEffect(()=>{(async()=>{
   if(subjectKey!=="polity")return;
   const [a,b]=await Promise.all([
     supabase.from("polity_current_affairs").select("id,headline,category,what_happened,polity_relevance,prelims_fact,mains_angle,source_url,updated_at,month,year").eq("status","approved").order("year",{ascending:false}).order("month",{ascending:false}).order("updated_at",{ascending:false}),
     supabase.from("polity_court_judgments").select("id,case_name,issue,constitutional_provision,judgment_summary,importance,prelims_point,mains_angle,source_url,updated_at,month,year").eq("status","approved").order("year",{ascending:false}).order("month",{ascending:false}).order("updated_at",{ascending:false})
   ]);
   if(!a.error)setCurrentAffairs((a.data||[]) as CurrentAffair[]);
   if(!b.error)setCourtJudgments((b.data||[]) as CourtJudgment[]);
 })()},[subjectKey]);

 async function translateSection(section:Section,targetLanguage:"Marathi"|"English"){
  const cacheKey=targetLanguage+":"+section.id;
  if(translatedById[cacheKey])return translatedById[cacheKey]; setTranslationLoading(true);setTranslationError("");
  try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error("तुमचे सत्र कालबाह्य झाले आहे. पुन्हा प्रवेश करा.");
   const response=await fetch("/api/ai/study-material-translate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({targetLanguage,section})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Translation failed.");if(data.section?.id){setTranslatedById(x=>({...x,[targetLanguage+":"+data.section.id]:data.section}));return data.section;}
  }catch(e){setTranslationError(e instanceof Error?e.message:"Translation failed.");}finally{setTranslationLoading(false);}
 }
 async function changeLanguage(next:"Marathi"|"English"){
  setTranslationError("");setLanguage(next);
  if(current){
    const base=sections.find(s=>s.id===current.id)||current;
    if(next==="English"||next==="Marathi") await translateSection(base,next);
  }
}
 function openTopic(id:string){setActive(id);setTopicsOpen(false);setChapterOpen(false);requestAnimationFrame(()=>document.getElementById(`topic-${id}`)?.scrollIntoView({behavior:"smooth",block:"start"}));if(language==="English"||language==="Marathi"){const s=sections.find(x=>x.id===id);if(s)translateSection(s,language);}}
 function chooseChapter(chapter:string){const first=sections.find(s=>(s.chapter||"General")===chapter);if(first)setActive(first.id);setChapterOpen(false);setTopicsOpen(false);if(first)requestAnimationFrame(()=>document.getElementById(`topic-${first.id}`)?.scrollIntoView({behavior:"smooth",block:"start"}));}
 async function openAi(point:string){
  setAiPoint(point);setAiOpen(true);setAiLoading(true);setAiError("");setAiAnalysis("");
  try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error("तुमचे सत्र कालबाह्य झाले आहे. पुन्हा प्रवेश करा.");
   const response=await fetch("/api/ai/keypoint-analysis",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({subject:title,topic:current.title,keyPoint:point,noteContext:current.body.join("\n")})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"AI analysis failed.");setAiAnalysis(String(data.analysis||""));
  }catch(e){setAiError(e instanceof Error?e.message:"AI analysis failed.");}finally{setAiLoading(false);}
 }
 const escapeRegex=(v:string)=>v.replace(/[.*+?^()|[\]\\]/g,"\\$&");
 const highlight=(text:string)=>{const q=query.trim().toLowerCase();if(!q)return text;return text.split(new RegExp(`(${escapeRegex(q)})`,"gi")).map((p,i)=>p.toLowerCase()===q?<mark key={i}>{p}</mark>:p);};

 if(loading)return <main className="reader-page"><div className="status">प्रवेश तपासला जात आहे…</div></main>;
 if(!sections.length)return <main className="reader-page"><div className="status"><h1>{title}</h1><p>या विषयाची अभ्याससामग्री अद्याप उपलब्ध नाही.</p><button onClick={()=>router.push("/study-material")}>सर्व विषय</button></div></main>;

 return <main className={`reader-page ${nightMode?"night":""}`}>
  <header className="reader-header"><div className="header-inner">
   <button className="back" onClick={()=>router.push("/study-material")}>←</button>
   <div className="header-title"><span>MPSC / UPSC • STUDY MATERIAL</span><strong>{title}</strong></div>
   <div className="header-actions">
    <button onClick={()=>setSearchOpen(v=>!v)} className={searchOpen?"selected":""}>⌕</button>
    <button onClick={()=>setNightMode(v=>!v)}>{nightMode?"☀":"☾"}</button>
    <div className="language"><button className={language==="Marathi"?"selected":""} onClick={()=>changeLanguage("Marathi")}>मराठी</button><button className={language==="English"?"selected":""} onClick={()=>changeLanguage("English")} disabled={translationLoading}>English</button></div>
   </div>
  </div>
  {searchOpen&&<div className="search-row"><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="अभ्याससामग्रीमध्ये शोधा…" />{query&&<button onClick={()=>setQuery("")}>×</button>}{query&&<span>{filtered.length} विषय सापडले</span>}</div>}
  </header>

  <div className="reader">
   <div className="chapter-row">
    <div className="chapter-picker"><button className="chapter-button" onClick={()=>{setChapterOpen(v=>!v);setTopicsOpen(false)}}><small>अध्याय</small><strong>{currentChapter}</strong><b>⌄</b></button>
     {chapterOpen&&<div className="chapter-menu">{chapters.map(ch=><button key={ch} className={ch===currentChapter?"selected":""} onClick={()=>chooseChapter(ch)}>{ch}</button>)}</div>}
    </div>
    <span className="progress">{completedCount}/{sections.length} विषय</span>
   </div>

   <div className="topics-row"><button onClick={()=>{setTopicsOpen(v=>!v);setChapterOpen(false)}}>☰ विषयसूची</button><span>{chapterSections.length} विषय</span><i><b style={{width:progress+"%"}}/></i></div>

   {topicsOpen&&<div className="topic-menu"><div className="topic-menu-head"><strong>{currentChapter}</strong><button onClick={()=>setTopicsOpen(false)}>×</button></div>{chapterSections.map((s,i)=><button key={s.id} className={s.id===active?"active":""} onClick={()=>openTopic(s.id)}><span>{String(i+1).padStart(2,"0")}</span><b>{s.title}</b></button>)}</div>}

   <article className="notes">
    <div id={`topic-${current.id}`} className="note-title"><span>STUDY NOTE • MPSC / UPSC</span><h1>{current.title}</h1><p>{current.subtitle}</p><div className="note-meta"><span>📖 Focused Reading</span><span>•</span><span>{language}</span><span>•</span><span>{current.chapter}</span></div></div>
    {translationLoading&&<div className="notice">इंग्रजी भाषांतर तयार केले जात आहे…</div>}{translationError&&<div className="notice error">{translationError}</div>}
    <div className="reading-toolbar">
      <span className="page-badge">PDF PAGE {String(current.id.match(/pdf-page-(\\d+)/)?.[1]||"—").padStart(3,"0")}</span>
      <span className="reading-mode">READING MODE</span>
    </div>
    <section className="keyword-strip">
      <div className="keyword-head"><div><span>IMPORTANT KEYWORDS</span><h2>महत्त्वाचे Keywords</h2></div><small>या पूर्ण note मधील महत्त्वाचे शब्द • टॅप करा → AI Knowledge</small></div>
      {keywordsLoading?<div className="keyword-loading">या note मधील महत्त्वाचे keywords शोधले जात आहेत…</div>:keywords.length>0?<div className="keyword-chips">{keywords.map((k,i)=><button key={i} onClick={()=>openAi(k)}>✦ {k}</button>)}</div>:<div className="keyword-empty">{keywordsError||"या note साठी keywords उपलब्ध नाहीत."}</div>}
    </section>
    {current.body.map((p,i)=><p className="paragraph" key={i}>{highlight(p)}</p>)}
    {current.subtopics?.map((st,si)=><section id={`subtopic-${current.id}-${si}`} className="subtopic" key={si}><h2>{highlight(st.title)}</h2>{st.points.map((pt,pi)=><p className="paragraph" key={pi}>{highlight(pt)}</p>)}</section>)}
    {current.facts&&current.facts.length>0&&<section className="exam-points"><h2>परीक्षेच्या दृष्टीने महत्त्वाचे</h2>{current.facts.map((f,i)=><div className="exam-point" key={i}><span>•</span><p>{highlight(f)}</p></div>)}</section>}
    <div className="bottom-nav"><button onClick={()=>setDone(x=>x.includes(current.id)?x:[...x,current.id])}>{done.includes(current.id)?"✓ अभ्यासले":"अभ्यासले म्हणून चिन्हांकित करा"}</button>{(()=>{const n=sections.findIndex(s=>s.id===current.id);const next=sections[Math.min(n+1,sections.length-1)];return <button className="next" disabled={n===sections.length-1} onClick={()=>openTopic(next.id)}>पुढील विषय →</button>})()}</div>
   </article>
  </div>

  {aiOpen&&<div className="ai-overlay" onClick={()=>!aiLoading&&setAiOpen(false)}><div className="ai-modal" onClick={e=>e.stopPropagation()}><div className="ai-head"><div><span>AI KNOWLEDGE</span><h2>{aiPoint}</h2></div><button onClick={()=>setAiOpen(false)}>×</button></div><div className="ai-body">{aiLoading?<div className="ai-loading"><div className="spinner"/>AI Knowledge तयार केले जात आहे…</div>:aiError?<div className="ai-error"><strong>AI Knowledge उपलब्ध झाले नाही</strong><p>{aiError}</p><button onClick={()=>openAi(aiPoint)}>पुन्हा प्रयत्न करा</button></div>:<div className="ai-response">{aiAnalysis.split(/(Exam Focus:)/i).map((part,i)=>/exam focus:/i.test(part)?<h3>परीक्षेचा केंद्रबिंदू</h3>:<p key={i}>{part.trim()}</p>)}</div>}</div></div></div>}
 <style jsx>{`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}
.reader-page{min-height:100vh;background:radial-gradient(circle at top,#fbfcfa 0,#f3f4f1 55%,#eceeea 100%);color:#303d50;font-family:'Noto Sans Devanagari',sans-serif}
.reader-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.97);border-bottom:1px solid #e6e9e7;backdrop-filter:blur(10px)}
.header-inner{max-width:1050px;margin:auto;min-height:62px;padding:9px 16px;display:flex;align-items:center;gap:12px}.back{border:0;background:transparent;color:#52606d;font-size:25px;cursor:pointer}.header-title{flex:1;min-width:0}.header-title span{display:block;font:800 8px 'Plus Jakarta Sans';letter-spacing:1.5px;color:#82909a}.header-title strong{display:block;margin-top:2px;font-size:17px;color:#173f5f}.header-actions{display:flex;align-items:center;gap:5px}.header-actions>button{width:33px;height:33px;border:1px solid #dfe4e3;border-radius:8px;background:#fff;color:#455462;font-size:18px;cursor:pointer}.header-actions>button.selected{background:#eef7f5;color:#0f766e}.language{display:flex;border:1px solid #dfe4e3;border-radius:8px;padding:2px;background:#fafafa}.language button{border:0;background:transparent;border-radius:6px;padding:6px 8px;color:#66737d;font:600 10px 'Noto Sans Devanagari';cursor:pointer}.language button.selected{background:#0f766e;color:#fff}.language button:disabled{opacity:.5}
.search-row{max-width:760px;margin:auto;padding:0 16px 11px;position:relative}.search-row input{width:100%;height:39px;border:1px solid #dfe4e3;border-radius:9px;padding:0 38px 0 12px;outline:none;font:400 13px 'Noto Sans Devanagari'}.search-row>button{position:absolute;right:25px;top:6px;border:0;background:#eef5f3;border-radius:50%;width:27px;height:27px}.search-row span{display:block;font-size:10px;color:#7d8992;margin-top:4px}
.reader{max-width:900px;margin:auto;padding:28px 20px 70px}.chapter-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.chapter-picker{position:relative}.chapter-button{width:min(560px,76vw);display:flex;align-items:center;gap:9px;text-align:left;background:#fff;border:1px solid #dfe5e3;border-radius:9px;padding:9px 11px;cursor:pointer}.chapter-button small{font-size:8px;color:#87939b}.chapter-button strong{flex:1;color:#24475e;font-size:13px}.chapter-button b{color:#0f766e}.chapter-menu{position:absolute;top:calc(100% + 5px);left:0;width:min(560px,86vw);max-height:55vh;overflow:auto;background:#fff;border:1px solid #dfe5e3;border-radius:10px;box-shadow:0 12px 30px rgba(30,50,60,.12);padding:5px;z-index:40}.chapter-menu button{width:100%;text-align:left;border:0;background:transparent;border-radius:7px;padding:9px;font:500 11px 'Noto Sans Devanagari';color:#465562;cursor:pointer}.chapter-menu button:hover,.chapter-menu button.selected{background:#eef7f5;color:#0f766e}.progress{font:600 10px 'Plus Jakarta Sans';color:#87939b;white-space:nowrap}
.topics-row{display:flex;align-items:center;gap:9px;border-bottom:1px solid #e3e7e5;padding:9px 0;margin-bottom:25px}.topics-row button{border:1px solid #d8e3e0;background:#fff;border-radius:8px;padding:7px 11px;color:#245b57;font:700 10px 'Noto Sans Devanagari';cursor:pointer}.topics-row span{font-size:10px;color:#8a969e}.topics-row i{margin-left:auto;width:80px;height:3px;background:#e8eceb;border-radius:5px;overflow:hidden}.topics-row i b{display:block;height:100%;background:#0f766e}
.topic-menu{margin:-16px 0 20px;background:#fff;border:1px solid #dfe5e3;border-radius:11px;box-shadow:0 12px 30px rgba(30,50,60,.10);padding:7px;max-height:58vh;overflow:auto}.topic-menu-head{display:flex;justify-content:space-between;align-items:center;padding:5px 7px 9px;border-bottom:1px solid #edf0ef;margin-bottom:3px}.topic-menu-head strong{font-size:12px;color:#24475e}.topic-menu-head button{border:0;background:transparent;font-size:20px;color:#66737d;cursor:pointer}.topic-menu>button{width:100%;display:flex;gap:10px;text-align:left;border:0;background:transparent;border-radius:7px;padding:8px;color:#435166;cursor:pointer;font:500 11px/1.55 'Noto Sans Devanagari'}.topic-menu>button span{min-width:22px;color:#0f766e;font:800 9px 'Plus Jakarta Sans'}.topic-menu>button:hover,.topic-menu>button.active{background:#eef7f5;color:#0b625c}
.notes{background:#fffdf9;padding:58px 72px 70px;box-shadow:0 8px 35px rgba(35,45,48,.10),0 1px 3px rgba(20,35,45,.06);border:1px solid #ebe9e1;border-radius:4px;position:relative}.notes:before{content:'';position:absolute;left:22px;top:0;bottom:0;width:1px;background:#eef0eb}.note-title{scroll-margin-top:82px;border-bottom:1px solid #e8eceb;padding-bottom:23px;margin-bottom:25px}.note-title span{font:800 8px 'Plus Jakarta Sans';letter-spacing:1.5px;color:#0f766e}.note-title h1{margin:10px 0 8px;color:#183e5a;font-size:clamp(28px,4vw,40px);line-height:1.28;font-weight:700;letter-spacing:-.3px}.note-meta{display:flex;gap:8px;align-items:center;margin-top:15px;color:#8a918e;font:600 9px 'Plus Jakarta Sans';letter-spacing:.3px}.note-title p{margin:0;color:#72808a;font-size:13px;line-height:1.7}.paragraph{font-family:'Noto Serif Devanagari','Noto Sans Devanagari',serif;font-size:17px;line-height:2.08;letter-spacing:.05px;color:#303b46;margin:0 0 25px;text-align:left}.paragraph mark{background:#fff0a8;padding:1px 2px}.reading-toolbar{display:flex;align-items:center;gap:9px;margin:-2px 0 25px;padding:9px 11px;border:1px solid #e7e8e2;background:#f7f8f5;border-radius:8px}.page-badge{font:800 8px 'Plus Jakarta Sans';letter-spacing:1px;color:#64736f}.reading-mode{font:700 8px 'Plus Jakarta Sans';letter-spacing:1px;color:#a0a8a5}.reading-toolbar button{margin-left:auto;border:1px solid #b9ddd7;background:#edf8f5;color:#08766e;border-radius:7px;padding:7px 10px;font:700 10px 'Noto Sans Devanagari';cursor:pointer}.keyword-strip{margin:46px 0 0;padding:15px 16px;border:1px solid #dfe9e6;border-radius:12px;background:linear-gradient(135deg,#f5faf8,#fbfcfa);box-shadow:0 2px 8px rgba(25,55,55,.04)}.keyword-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}.keyword-head span{font:800 8px 'Plus Jakarta Sans';letter-spacing:1.2px;color:#0f766e}.keyword-head h2{margin:3px 0 0;font-size:16px;color:#204b55}.keyword-head small{font-size:9px;color:#72807f}.keyword-chips{display:flex;flex-wrap:wrap;gap:7px}.keyword-chips button{border:1px solid #b9ddd7;background:#fff;color:#176b63;border-radius:999px;padding:8px 11px;font:600 10px 'Noto Sans Devanagari';cursor:pointer;transition:.15s}.keyword-chips button:hover{background:#eaf7f4;transform:translateY(-1px)}.keyword-loading,.keyword-empty{font-size:10px;color:#71807e;padding:5px 0}.subtopic{scroll-margin-top:82px;margin:34px 0 0}.subtopic h2{margin:0 0 13px;color:#173f5f;font-size:21px;line-height:1.5}.exam-points{margin-top:36px;padding-top:18px;border-top:2px solid #e5ecea}.exam-points h2{margin:0 0 12px;color:#245b57;font-size:17px}.exam-point{display:grid;grid-template-columns:17px 1fr auto;gap:8px;align-items:start;margin:9px 0}.exam-point>span{color:#0f766e}.exam-point p{margin:0;color:#3f4c5b;font-size:14px;line-height:1.8}.exam-point button{border:0;background:none;color:#0f766e;font:600 10px 'Noto Sans Devanagari';cursor:pointer}.bottom-nav{display:flex;justify-content:space-between;gap:10px;margin-top:42px;padding-top:18px;border-top:1px solid #e8eceb}.bottom-nav button{border:1px solid #d5e1df;background:#eef7f5;color:#0b625c;border-radius:8px;padding:9px 12px;font:600 10px 'Noto Sans Devanagari';cursor:pointer}.bottom-nav .next{background:#0f766e;color:#fff;border-color:#0f766e}.bottom-nav .next:disabled{opacity:.4}.live-updates{margin:38px 0 18px;padding:22px 0;border-top:2px solid #e5ecea}.live-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:15px}.live-head span{font:800 8px 'Plus Jakarta Sans';letter-spacing:1.4px;color:#0f766e}.live-head h2{margin:6px 0 3px;color:#173f5f;font-size:21px}.live-head p{margin:0;color:#72808a;font-size:11px}.live-head>b{font:800 11px 'Plus Jakarta Sans';color:#0f766e;white-space:nowrap}.live-item{border:1px solid #e1e7e5;border-radius:10px;padding:15px;margin:10px 0;background:#fbfcfb}.live-meta{display:flex;justify-content:space-between;gap:10px;font-size:9px;color:#7a8992}.live-item h3{margin:6px 0 9px;color:#173f5f;font-size:16px;line-height:1.5}.live-item p{margin:6px 0;color:#3f4c5b;font-size:13px;line-height:1.75}.live-item a{font-size:10px;color:#0f766e}.night .live-updates{border-color:#2d4147}.night .live-head h2,.night .live-item h3{color:#b8e5df}.night .live-head p,.night .live-item p,.night .live-meta{color:#c7d2d8}.night .live-item{background:#172127;border-color:#34444d}@media(max-width:700px){.live-head{display:block}.live-head>b{display:block;margin-top:7px}.live-item{padding:13px}.live-item p{font-size:12px}}.notice{margin-bottom:18px;padding:9px 11px;border-left:3px solid #0f766e;background:#f2f8f7;color:#49635f;font-size:10px}.notice.error{border-color:#b45353;background:#fff6f6;color:#8b3d3d}
.status{max-width:700px;margin:100px auto;text-align:center;padding:30px}.status button{border:0;background:#0f766e;color:#fff;padding:9px 15px;border-radius:8px}
.night{background:#10161b;color:#dbe4e9}.night .reader-header{background:rgba(16,22,27,.97);border-color:#29363e}.night .header-title strong{color:#dce8ed}.night .header-title span,.night .progress{color:#91a1ab}.night .header-actions>button,.night .language{background:#172127;border-color:#34444d;color:#dbe4e9}.night .language button{color:#aebbc2}.night .language button.selected{background:#176b63;color:#fff}.night .search-row input,.night .chapter-button,.night .chapter-menu,.night .topic-menu,.night .notes{background:#172127;border-color:#34444d;color:#dbe4e9}.night .chapter-button strong,.night .chapter-menu button,.night .topic-menu>button,.night .topic-menu-head strong{color:#dbe4e9}.night .chapter-menu button:hover,.night .chapter-menu button.selected,.night .topic-menu>button:hover,.night .topic-menu>button.active{background:#183b3a;color:#9ce9df}.night .topics-row{border-color:#2a383f}.night .topics-row button{background:#172127;border-color:#34444d;color:#9ce9df}.night .note-title{border-color:#2a383f}.night .note-title h1,.night .subtopic h2{color:#b8e5df}.night .keyword-strip{background:#172127;border-color:#34444d}.night .keyword-head h2{color:#b8e5df}.night .keyword-head small,.night .keyword-loading,.night .keyword-empty{color:#aebbc2}.night .keyword-chips button{background:#183b3a;border-color:#315653;color:#9ce9df}.night .note-title p,.night .paragraph,.night .exam-point p{color:#c7d2d8}.night .exam-points,.night .bottom-nav{border-color:#2d4147}.night .exam-points h2{color:#9ce9df}.night .bottom-nav button{background:#183b3a;color:#9ce9df;border-color:#315653}.night .bottom-nav .next{background:#176b63;color:#fff}
.ai-overlay{position:fixed;inset:0;z-index:1000;background:rgba(10,25,38,.55);display:flex;align-items:center;justify-content:center;padding:18px}.ai-modal{width:min(620px,100%);max-height:82vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.22)}.ai-head{display:flex;justify-content:space-between;gap:12px;padding:19px 20px;background:#173f5f;color:#fff}.ai-head span{font-size:9px;color:#c9f7ed}.ai-head h2{margin:6px 0 0;font-size:19px;line-height:1.4}.ai-head button{width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:21px}.ai-body{padding:20px}.ai-response p{font-size:14px;line-height:1.8;color:#344455;white-space:pre-line;margin:0 0 13px}.ai-response h3{font-size:13px;color:#0f766e;margin:18px 0 8px}.ai-loading{min-height:160px;display:flex;align-items:center;justify-content:center;gap:10px;color:#53616c}.spinner{width:24px;height:24px;border:3px solid #dceeea;border-top-color:#0f766e;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.ai-error{padding:15px;background:#fff6f6;border:1px solid #f0d1d1;color:#7f1d1d;border-radius:9px}.ai-error p{font-size:12px}.ai-error button{border:0;background:#0f766e;color:#fff;padding:8px 12px;border-radius:7px}
@media(max-width:700px){.notes:before{left:8px}.notes{padding:34px 22px 45px}.note-meta{flex-wrap:wrap}.reading-toolbar{position:sticky;top:61px;z-index:20;background:rgba(247,248,245,.96);backdrop-filter:blur(8px)}.paragraph{font-size:16px;line-height:2.02}.header-inner{min-height:56px;padding:8px 11px}.header-title strong{font-size:14px}.header-actions>button{width:31px;height:31px}.language button{padding:6px;font-size:9px}.reader{padding:15px 12px 40px}.chapter-row{display:block}.chapter-button{width:100%}.progress{display:block;margin-top:5px}.chapter-menu{width:100%}.topics-row{margin-bottom:18px}.topics-row i{width:55px}.topic-menu{margin:-9px 0 18px}.notes{padding:28px 18px 35px}.note-title h1{font-size:24px}.paragraph{font-size:15px;line-height:1.95;margin-bottom:18px}.subtopic h2{font-size:19px}.exam-point{grid-template-columns:15px 1fr}.exam-point button{grid-column:2;text-align:left}.bottom-nav{margin-top:32px}.ai-overlay{align-items:flex-end;padding:0}.ai-modal{width:100%;max-height:88vh;border-radius:16px 16px 0 0}}
`}</style>
 </main>;
}
