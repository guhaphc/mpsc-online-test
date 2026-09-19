"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjects:Record<string,string>={
 "polity":"Indian Polity & Governance","ancient-history":"Ancient History","medieval-history":"Medieval History",
 "modern-history":"Modern Indian History","world-history":"World History","indian-culture":"Indian Culture",
 "physical-geography":"Physical Geography","indian-geography":"Indian Geography","indian-society":"Indian Society",
 "agriculture":"Agriculture","economy":"Indian Economy","industry-infrastructure":"Industry & Infrastructure",
 "science-technology":"Science & Technology","defence-security":"Defence & Security","nuclear-energy":"Nuclear Energy & Technology",
 "nanotechnology":"Nano Technology","ipr":"Intellectual Property Rights","environment-ecology":"Environment & Ecology",
 "climate-change":"Climate Change","internal-security":"Internal Security","disaster-management":"Disaster Management",
 "ethics":"Ethics, Integrity & Aptitude","applied-ethics":"Applied Ethics","essay":"Essay"
};

type Section={id:string;title:string;subtitle:string;body:string[];facts?:string[]};

const sections:Section[]=[
{id:"history",title:"इतिहास : संकल्पना व कालविभाग",subtitle:"इतिहास, पूर्व-इतिहास, आद्य-इतिहास आणि इतिहास",body:[
"इतिहास म्हणजे भूतकाळाचा अभ्यास. 'हिस्टोरिया' या ग्रीक शब्दाचा अर्थ चौकशी/तपासाद्वारे मिळवलेले ज्ञान असा दिला आहे.",
"पूर्व-इतिहास : लेखनाचा शोध लागण्यापूर्वीचा काळ. या काळाची माहिती प्रामुख्याने पुरातत्त्वीय साधनांवर आधारित असते.",
"आद्य-इतिहास : पूर्व-इतिहास आणि इतिहास यांच्यातील कालखंड. संस्कृती/संस्था विकसित झालेल्या असू शकतात; मात्र स्थानिक लिखित नोंदी अस्पष्ट किंवा अनुपलब्ध असू शकतात.",
"इतिहास : लेखनाचा शोध लागल्यानंतरचा भूतकाळाचा अभ्यास, लिखित नोंदी व पुरातत्त्वीय स्रोतांच्या आधारे केला जातो."
],facts:["प्राचीन भारतीय इतिहासाची पुनर्रचना — गैर-साहित्यिक स्रोत + साहित्यिक स्रोत"]},
{id:"sources",title:"प्राचीन भारतीय इतिहासाचे स्रोत",subtitle:"गैर-साहित्यिक आणि साहित्यिक साधने",body:[
"नाणी : प्राचीन भारतातील चलनाचा अभ्यास नाण्यांवरून करता येतो. नाण्यांवरील चिन्हे, राजे, देवता, तारीख इत्यादी माहिती राजवंश, आर्थिक इतिहास, लिपी, कला व धर्म समजण्यास मदत करते. नाण्यांच्या अभ्यासाला अंकशास्त्र (Numismatics) म्हटले आहे.",
"पुरातत्त्वीय/साहित्यिक अवशेष : उत्खनन व अन्वेषणातून मिळालेल्या अवशेषांचा अभ्यास करून भौतिक जीवनाची कल्पना करता येते. तारखा निश्चित करण्यासाठी रेडिओकार्बन डेटिंगचा उल्लेख आहे.",
"वनस्पती अवशेष व परागकण विश्लेषणातून हवामान व वनस्पतींच्या इतिहासाचा अभ्यास करता येतो.",
"शिलालेख/प्रशस्ति : दगड, तांबे यांसारख्या कठीण पृष्ठभागावरील लेखनातून राजकीय धोरणे, आदेश, निर्णय व प्रशासनाची माहिती मिळते. प्राचीन शिलालेखांच्या अभ्यासाला एपिग्राफी म्हणतात.",
"परदेशी प्रवासी/खाती : ग्रीक, चिनी व रोमन प्रवाशांच्या नोंदी भारतीय इतिहासाला पूरक माहिती देतात."
],facts:["मेगास्थेनिस — 'इंडिका'","फाहियान — गुप्तकालीन भारताची माहिती","ह्युएनसांग — हर्षवर्धनकालीन भारत व नालंदेची माहिती","Periplus of the Erythraean Sea आणि Ptolemy's Geography — भारत-रोमन व्यापाराची माहिती"]},
{id:"literary",title:"साहित्यिक स्रोत",subtitle:"धार्मिक आणि धर्मनिरपेक्ष साहित्य",body:[
"चार वेद : ऋग्वेद, सामवेद, यजुर्वेद आणि अथर्ववेद. दिलेल्या स्रोतामध्ये वेदांचा काल साधारण इ.स.पू. 1500–500 असा नमूद आहे.",
"उपनिषदे : आत्मा आणि परमात्मा यांवरील तात्त्विक चर्चेचे ग्रंथ.",
"महाभारत व रामायण : प्राचीन भारतीय सामाजिक, सांस्कृतिक व उपदेशात्मक साहित्याचे महत्त्वाचे स्रोत. स्रोतामध्ये महाभारताच्या मूळ व अंतिम श्लोकसंख्येचे आणि रामायणाच्या श्लोकसंख्येचे उल्लेख आहेत.",
"सूत्र साहित्य : श्रौतसूत्रांमध्ये यज्ञ व राजकीय अभिषेक यांसारख्या विधींचा, तर गृह्यसूत्रांमध्ये जन्म, नामकरण, विवाह व अंत्यविधी यांसारख्या घरगुती विधींचा उल्लेख आहे.",
"बौद्ध ग्रंथ : त्रिपिटक — सुत्तपिटक, विनयपिटक आणि अभिधम्मपिटक. सामाजिक, आर्थिक व राजकीय परिस्थिती समजण्यासाठी उपयुक्त.",
"जैन ग्रंथ : 'अंग' म्हणून ओळखले जाणारे ग्रंथ प्राकृत भाषेत असून महावीरकालीन उत्तर प्रदेश व बिहारच्या राजकीय इतिहासासह व्यापार व व्यापाऱ्यांविषयी माहिती देतात.",
"धर्मशास्त्र/कायद्याची पुस्तके, कौटिल्याचे अर्थशास्त्र, कालिदासाचे साहित्य, राजतरंगिणी, चरित/चरित्र आणि संगम साहित्य हे धर्मनिरपेक्ष साहित्याचे स्रोत म्हणून दिले आहेत."
],facts:["अर्थशास्त्र — कौटिल्य; मौर्ययुगीन समाज व अर्थव्यवस्थेची माहिती","राजतरंगिणी — कल्हण; 12व्या शतकातील काश्मीर","हर्षचरित — बाणभट्ट; हर्षवर्धनाच्या चरित्रासाठी","संगम साहित्य — प्राचीन दक्षिण भारतीय सामाजिक, आर्थिक व राजकीय जीवन"]},
{id:"periods",title:"भारतातील प्रागैतिहासिक कालखंड",subtitle:"साधनांनुसार कालविभाग",body:[
"पॅलेओलिथिक कालखंड (जुना पाषाण युग) : 500,000 BCE – 10,000 BCE.",
"मेसोलिथिक कालखंड (मध्य/उशिरा पाषाण युग) : 10,000 BCE – 6000 BCE.",
"निओलिथिक कालखंड (नवीन पाषाण युग) : 6000 BCE – 1000 BCE.",
"चाल्कोलिथिक कालावधी (पाषाण-तांबे युग) : 3000 BCE – 500 BCE.",
"लोहयुग : 1500 BCE – 200 BCE."
]},
{id:"palaeo",title:"पुरापाषाण युग (जुना पाषाण युग)",subtitle:"शिकारी व अन्न गोळा करणारे",body:[
"पुरापाषाण युग प्रागैतिहासिक काळातील असून माहितीचा मुख्य स्रोत पुरातत्त्वीय उत्खनन आहे. रॉबर्ट ब्रूस फूट यांनी भारतातील पहिले पुरातत्त्वकालीन साधन — पल्लवरम हँडॅक्स — शोधल्याचा स्रोतामध्ये उल्लेख आहे.",
"लोक नदीखोऱ्या, गुहा व रॉक-आश्रयस्थानांमध्ये राहत होते. उपजीविकेचा आधार शिकार, जंगली फळे व भाज्या गोळा करणे हा होता.",
"घर, मातीची भांडी व शेतीचे ज्ञान नव्हते, असे स्रोतामध्ये नमूद आहे. उच्च पुरापाषाण युगात चित्रकलेचे पुरावे आढळतात.",
"हाताची कुऱ्हाड, हेलिकॉप्टर, ब्लेड, बुरिन आणि स्क्रॅपर यांसारखी न पॉलिश केलेली दगडी साधने वापरली जात.",
"पाषाणयुगातील लोकांना क्वार्टझाइट पुरुष असेही संबोधले आहे, कारण क्वार्टझाइट या कठीण खडकाचा साधनांसाठी वापर केला जात असे.",
"भारतीय पुरापाषाण युगाचे तीन टप्पे : लोअर — 100,000 BCE पर्यंत; मध्य — 100,000–40,000 BCE; अप्पर — 40,000–10,000 BCE."
],facts:["लोअर पॅलेओलिथिक — जड व उग्र साधने; handaxe, handaxe-related tools, cleaver","मध्य पॅलेओलिथिक — फ्लेक्स, ब्लेड, पॉइंट्स, स्क्रॅपर्स व बोर्सर","अप्पर पॅलेओलिथिक — होमो सेपियन्सचा उदय; हाडांची साधने, सुई, हार्पून व fishing tools"]},
{id:"sites",title:"पुरापाषाण युगातील प्रमुख स्थळे",subtitle:"प्रदेश व पुरावे",body:[
"स्रोतामध्ये सोन व्हॅली, थार वाळवंटातील ठिकाणे, काश्मीर, मेवाड मैदान, सौराष्ट्र, गुजरात, मध्य भारत, दख्खनचे पठार, छोटानागपूर पठार, कावेरी नदीच्या उत्तरेस आणि उत्तर प्रदेशातील बेलन खोरे अशी ठिकाणे दिली आहेत.",
"गुहा व रॉक-आश्रयस्थानांसह वस्तीची ठिकाणे आढळतात. मध्य प्रदेशातील भीमबेटका हे महत्त्वाचे ठिकाण म्हणून नमूद आहे.",
"अप्पर पॅलेओलिथिक स्थळांमध्ये भीमबेटका, बेलन, मुलगाव, छोटानागपूर पठार, महाराष्ट्र, ओरिसा आणि आंध्र प्रदेशातील पूर्व घाट यांचा उल्लेख आहे.",
"आंध्र प्रदेशातील कुर्नूल व मुच्छटला चिंतामणी गुहा येथे हाडांची साधने सापडल्याचे स्रोतामध्ये नमूद आहे."
]},
{id:"mesolithic",title:"मेसोलिथिक कालावधी (मध्य पाषाण युग)",subtitle:"सूक्ष्म दगडी साधने आणि संक्रमण",body:[
"‘मेसो’ म्हणजे मध्यम आणि ‘लिथिक’ म्हणजे दगड. म्हणून मेसोलिथिक अवस्थेला मध्य पाषाण युग म्हटले जाते.",
"मेसोलिथिक व निओलिथिक अवस्था होलोसीन युगातील असल्याचे स्रोतामध्ये नमूद आहे. तापमान वाढल्याने बर्फ वितळला आणि वनस्पती व प्राणिजीवनात बदल झाले.",
"सुरुवातीला लोक शिकार, मासेमारी व अन्न गोळा करण्यावर जगत; नंतर पाळीव प्राणी व वनस्पतींची लागवड सुरू झाली.",
"कुत्र्याचा जंगली पूर्वज हा पहिला पाळीव प्राणी असल्याचे, तर मेंढ्या व शेळ्या सामान्य पाळीव प्राणी असल्याचे स्रोतामध्ये दिले आहे.",
"गुहा व मोकळ्या मैदानांसह अर्ध-स्थायी वसाहती तयार झाल्या. मृतांना अन्नपदार्थ व इतर वस्तूंसह पुरण्याची प्रथा दिसते.",
"मायक्रोलिथ्स ही वैशिष्ट्यपूर्ण साधने होती. ती लहान, सूक्ष्म दगडी साधने असून लाकडी किंवा हाडांच्या हँडलला जोडून भाला, बाण व विळा यांसारखी संयुक्त साधने तयार करण्यासाठी वापरली जात.",
"प्राण्यांच्या कातडीचे कपडे, रॉक आर्ट आणि शिकारीची दृश्ये, नृत्य व अन्नसंकलनाची चित्रे या काळाच्या वैशिष्ट्यांमध्ये दिली आहेत. गंगा मैदानावर प्रथम मानवी वसाहत या काळात झाल्याचे स्रोतामध्ये नमूद आहे."
],facts:["मायक्रोलिथ्स — क्रिप्टो-क्रिस्टलाइन सिलिका, चाल्सेडनी किंवा चर्ट","रॉक आर्ट — धार्मिक पद्धतींच्या विकासाची व लिंगाधारित श्रमविभाजनाची कल्पना देणारे म्हणून स्रोतामध्ये वर्णन"]},
{id:"mesosites",title:"महत्त्वपूर्ण मेसोलिथिक साइट्स",subtitle:"स्थळे व विशेष पुरावे",body:[
"राजस्थानातील बागोर — कोठारी नदीवरील महत्त्वाचे मेसोलिथिक स्थळ; प्राण्यांची हाडे व शंखांसह मायक्रोलिथ्स उत्खननात मिळाले.",
"मध्य प्रदेशातील आदमगड — प्राणी पाळल्याचा सर्वात जुना पुरावा देणारे स्थळ म्हणून स्रोतामध्ये नमूद.",
"संपूर्ण भारतात सुमारे 150 मेसोलिथिक रॉक आर्ट साइट्स असल्याचा स्रोतामध्ये उल्लेख आहे. भीमबेटका, खैरवार, जाओरा, कथोटिया, सुंदरगड, संबलपूर व एझुत्तुगुहा यांसारख्या ठिकाणांचा उल्लेख आहे.",
"तापी, साबरमती, नर्मदा आणि माही नदीच्या काही खोऱ्यांमध्ये मायक्रोलिथ्स सापडले आहेत.",
"गुजरातमधील लंघनाज व पश्चिम बंगालमधील बिरहानपूर ही महत्त्वाची मेसोलिथिक स्थळे दिली आहेत. लंघनाज येथे गेंडा व काळवीट यांसारख्या वन्य प्राण्यांची हाडे, मानवी सांगाडे व मोठ्या प्रमाणात मायक्रोलिथ्स सापडल्याचे नमूद आहे.",
"मातीची भांडी बहुतेक मेसोलिथिक स्थळांवर अनुपस्थित असली तरी लंघनाज आणि मिर्झापूरमधील कैथूर प्रदेशात ती सापडल्याचे स्रोतामध्ये नमूद आहे."
],facts:["Exam Focus: कालखंड → साधने → उपजीविका → स्थळे → विशेष पुरावे हा क्रम लक्षात ठेवा."]}
];

export default function StudyMaterialSubjectPage(){
 const router=useRouter(); const params=useParams<{subject:string}>();
 const [loading,setLoading]=useState(true); const [active,setActive]=useState("history"); const [query,setQuery]=useState(""); const [done,setDone]=useState<string[]>([]); const [language,setLanguage]=useState<"Marathi"|"English">("Marathi"); const [translated,setTranslated]=useState<Section[]|null>(null); const [translationLoading,setTranslationLoading]=useState(false); const [translationError,setTranslationError]=useState(""); const [aiOpen,setAiOpen]=useState(false); const [aiLoading,setAiLoading]=useState(false); const [aiError,setAiError]=useState(""); const [aiAnalysis,setAiAnalysis]=useState(""); const [aiPoint,setAiPoint]=useState("");
 const title=subjects[params?.subject||""]||"Study Material";
 const normalizedQuery=query.trim().toLowerCase();
 const filtered=useMemo(()=>displaySections.filter(s=>!normalizedQuery||(s.title+" "+s.subtitle+" "+s.body.join(" ")+" "+(s.facts||[]).join(" ")).toLowerCase().includes(normalizedQuery)),[normalizedQuery,displaySections]);
 useEffect(()=>{if(normalizedQuery&&filtered.length&&!filtered.some(s=>s.id===active))setActive(filtered[0].id);},[normalizedQuery,filtered,active]);
 const progress=Math.round(done.length/sections.length*100);
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();if(profile?.role==="admin"&&profile?.access_status==="approved"){router.replace("/admin");return;}if(profile?.access_status!=="approved"){router.replace("/pending");return;}setLoading(false);})();},[router]);
 if(loading)return <main className="page"><section className="card"><p>Checking your access...</p></section></main>;
 const displaySections=language==="Marathi"?sections:(translated||sections); const current=displaySections.find(s=>s.id===active)||displaySections[0];
 async function changeLanguage(next:"Marathi"|"English"){
  setLanguage(next);
  if(next==="Marathi"||translated)return;
  setTranslationLoading(true);setTranslationError("");
  try{
   const response=await fetch("/api/ai/study-material-translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetLanguage:"English",sections})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Translation failed.");
   setTranslated(Array.isArray(data.sections)?data.sections:[]);
  }catch(e){setTranslationError(e instanceof Error?e.message:"Translation failed.");setLanguage("Marathi");}
  finally{setTranslationLoading(false);}
 }
 async function openAi(point:string){setAiPoint(point);setAiOpen(true);setAiLoading(true);setAiError("");setAiAnalysis("");try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error("Your session has expired. Please sign in again.");const response=await fetch("/api/ai/keypoint-analysis",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({subject:title,topic:current.title,keyPoint:point,noteContext:current.body.join("\n")})});const data=await response.json();if(!response.ok)throw new Error(data.error||"AI analysis failed.");setAiAnalysis(String(data.analysis||""));}catch(e){setAiError(e instanceof Error?e.message:"AI analysis failed.");}finally{setAiLoading(false);}}
 const escapeRegex=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const highlight=(text:string)=>{
  if(!normalizedQuery)return text;
  const parts=text.split(new RegExp(`(${escapeRegex(normalizedQuery)})`,"gi"));
  return parts.map((part,i)=>part.toLowerCase()===normalizedQuery?<mark key={i}>{part}</mark>:part);
 };
 return <main className="page"><section className="card study-shell">
  <div className="study-hero"><div><div className="brand">MPSC / UPSC • STUDY MATERIAL</div><h1>{title}</h1><p>प्राचीन इतिहास — PDF आधारित इंटरॅक्टिव्ह नोट्स</p></div><button className="secondary" onClick={()=>router.push("/study-material")}>All Subjects</button></div>
  <div className="study-tools"><div className="language-switch" role="group" aria-label="Notes language"><button type="button" className={language==="Marathi"?"selected":""} onClick={()=>changeLanguage("Marathi")}>मराठी</button><button type="button" className={language==="English"?"selected":""} onClick={()=>changeLanguage("English")} disabled={translationLoading}>English</button></div><div className="search-box"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="नोट्समध्ये शोधा — उदा. भीमबेटका, मायक्रोलिथ्स, पुरापाषाण..." aria-label="Search notes" />{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Clear search">×</button>}</div><div className="progress-card"><strong>{progress}%</strong><span>Completed</span><i><b style={{width:progress+"%"}}/></i></div></div>
  <div className="study-layout">
   <aside><div className="toc-title">TOPICS</div>{filtered.map(s=><button className={active===s.id?"toc active":"toc"} key={s.id} onClick={()=>setActive(s.id)}><span>{done.includes(s.id)?"✓":"○"}</span>{s.title}</button>)}</aside>
   <article>
    <div className="note-head"><span>LECTURE 01 • SOURCE PDF</span><h2>{current.title}</h2><p>{current.subtitle}</p></div>
    <div className="source-chip">📘 Source: Ancient History 01 — Daily Class Notes (Marathi), 8 pages</div>
    {translationLoading&&<div className="search-result">✨ Translating notes into English…</div>}{translationError&&<div className="search-result">{translationError}</div>}{normalizedQuery&&<div className="search-result"><strong>{filtered.length}</strong> topic{filtered.length===1?"":"s"} found for “{query}”</div>}
    {current.body.map((p,i)=><p className="note-para" key={i}>{highlight(p)}</p>)}
    {current.facts&&<div className="fact-grid">{current.facts.map((f,i)=><button type="button" className="fact fact-button" key={i} onClick={()=>openAi(f)}><strong>KEY POINT <em>✨ Explain</em></strong><span>{highlight(f)}</span></button>)}</div>}
    <div className="note-actions"><button onClick={()=>setDone(x=>x.includes(current.id)?x:x.concat(current.id))}>{done.includes(current.id)?"✓ Topic Completed":"Mark Topic Complete"}</button><button className="secondary" onClick={()=>{const n=sections.findIndex(s=>s.id===current.id);setActive(sections[Math.min(n+1,sections.length-1)].id)}}>Next Topic →</button></div>
   </article>
  </div>
  <div className="source-note">Source-based note: content above is constructed from the uploaded PDF and its page content; outside facts have not been silently added. fileciteturn79file0L121-L149</div>
 </section>
 <style jsx>{`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.study-shell{max-width:1220px!important;background:#f8fafc!important;border:1px solid #e7eaf0!important;padding:0!important;overflow:hidden;font-family:'Noto Sans Devanagari','Plus Jakarta Sans',system-ui,sans-serif;color:#172033}
.study-hero{position:relative;display:flex;justify-content:space-between;gap:24px;align-items:center;padding:34px 36px 30px;background:linear-gradient(135deg,#102a43 0%,#173f5f 58%,#0f766e 100%);color:#fff;overflow:hidden}
.study-hero:after{content:"";position:absolute;width:260px;height:260px;border-radius:50%;right:-90px;top:-120px;background:rgba(255,255,255,.08);box-shadow:-80px 170px 0 20px rgba(255,255,255,.035)}
.study-hero>div,.study-hero button{position:relative;z-index:1}
.study-hero .brand{font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:800;letter-spacing:1.8px;color:#c9f7ed}
.study-hero h1{margin:7px 0 5px;font-size:clamp(28px,5vw,44px);line-height:1.12;letter-spacing:-.7px;color:#fff}
.study-hero p{margin:0;color:#d8e8f2;font-size:14px}
.study-hero .secondary{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#fff;backdrop-filter:blur(8px);border-radius:12px;padding:11px 16px}
.study-tools{display:flex;gap:14px;align-items:center;padding:20px 30px;background:#fff;border-bottom:1px solid #e8ebf0}
.language-switch{display:flex;flex:0 0 auto;border:1px solid #d9e0e8;border-radius:12px;padding:3px;background:#f8fafc}.language-switch button{border:0;background:transparent;border-radius:9px;padding:9px 12px;font:700 12px "Noto Sans Devanagari",sans-serif;color:#64748b;cursor:pointer}.language-switch button.selected{background:#0f766e;color:#fff;box-shadow:0 2px 7px rgba(15,118,110,.16)}.language-switch button:disabled{opacity:.6;cursor:wait}.search-box{position:relative;flex:1;display:flex;align-items:center}.search-box>span{position:absolute;left:15px;font-size:23px;color:#64748b;line-height:1;pointer-events:none}.search-box input{width:100%;padding-right:42px!important}.search-box button{position:absolute;right:8px;border:0;background:transparent;color:#64748b;font-size:22px;cursor:pointer;padding:5px 8px}.study-tools input{flex:1;border:1px solid #d9e0e8;border-radius:13px;padding:14px 16px;font:500 14px 'Noto Sans Devanagari',sans-serif;background:#fbfcfe;color:#172033;outline:none;transition:.2s}
.study-tools input:focus{border-color:#0f766e;box-shadow:0 0 0 4px rgba(15,118,110,.09);background:#fff}
.search-box input{padding-left:44px!important}.search-result{margin:12px 0 4px;padding:10px 13px;border-radius:10px;background:#f0f7f6;border:1px solid #d5ebe7;color:#355c58;font-size:12px}.progress-card{width:190px;border:1px solid #e5e9ef;border-radius:13px;padding:9px 12px;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;background:#fff}
.progress-card strong{font:800 19px 'Plus Jakarta Sans',sans-serif;color:#0f766e}.progress-card span{font-size:10px;color:#64748b;align-self:end}
.progress-card i{grid-column:1/-1;height:5px;background:#edf1f4;border-radius:10px;overflow:hidden;margin-top:5px}.progress-card b{display:block;height:100%;background:linear-gradient(90deg,#0f766e,#2c9c8d);border-radius:10px}
.study-layout{display:grid;grid-template-columns:285px 1fr;gap:0;min-height:700px}
.study-layout aside{border-right:1px solid #e7eaf0;padding:20px 14px;background:#fbfcfd;height:100%;position:sticky;top:0;align-self:start;max-height:calc(100vh - 24px);overflow:auto}
.toc-title{font:800 10px 'Plus Jakarta Sans',sans-serif;letter-spacing:1.5px;color:#8a95a5;padding:6px 10px 12px}
.toc{display:flex;width:100%;text-align:left;border:1px solid transparent;background:transparent;padding:11px 10px;border-radius:11px;gap:9px;font-size:13px;line-height:1.45;color:#435166;cursor:pointer;transition:.18s;margin-bottom:3px}
.toc:hover{background:#f0f7f6;color:#0f766e}.toc.active{background:#e7f5f2;color:#0b625c;border-color:#cce9e4;box-shadow:0 2px 8px rgba(15,118,110,.07);font-weight:700}.toc span{width:17px;flex:0 0 17px;color:#0f766e}
.study-layout article{background:#fff;padding:30px 36px 38px;min-width:0}
.note-head{padding:25px 27px;border-radius:18px;background:linear-gradient(145deg,#f8fbfc,#eef8f6);border:1px solid #dcece9;box-shadow:0 8px 24px rgba(25,55,70,.05)}
.note-head span{font:800 9px 'Plus Jakarta Sans',sans-serif;letter-spacing:1.5px;color:#0f766e}
.note-head h2{font-size:clamp(23px,4vw,33px);line-height:1.25;margin:8px 0 5px;color:#172033;letter-spacing:-.4px}.note-head p{margin:0;color:#657386;font-size:13px}
.source-chip{display:inline-flex;margin:17px 0 7px;padding:7px 11px;border-radius:9px;background:#f7f3ea;color:#765f32;font-size:11px;border:1px solid #eee3ca}
.note-para mark,.fact mark{background:#ffe58a;color:#172033;padding:1px 3px;border-radius:4px;box-shadow:0 0 0 1px rgba(180,130,0,.12)}.note-para{font-size:16px;line-height:2;color:#303d50;margin:18px 5px;max-width:850px;letter-spacing:.05px}
.note-para:first-of-type{margin-top:12px}
.fact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:13px;margin:24px 0}
.fact{padding:16px 17px;border:1px solid #e2e9ee;border-left:4px solid #d39b38;border-radius:12px;background:#fffdf8;box-shadow:0 5px 16px rgba(38,48,60,.035)}
.fact strong{display:block;font:800 9px 'Plus Jakarta Sans',sans-serif;letter-spacing:1px;color:#a36f18;margin-bottom:7px}.fact span{font-size:13px;line-height:1.7;color:#3b4656}
.note-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:30px;padding-top:20px;border-top:1px solid #e8ebef}.note-actions button{border:0;border-radius:11px;padding:11px 16px;cursor:pointer;background:#0f766e;color:#fff;font-weight:700;box-shadow:0 4px 12px rgba(15,118,110,.15)}.note-actions button:hover{background:#0b625c}.note-actions .secondary{background:#fff;color:#334155;border:1px solid #d9e0e8;box-shadow:none}
.source-note{margin:0;padding:15px 30px;background:#f5f7f9;border-top:1px solid #e7eaf0;color:#788493;font-size:11px;line-height:1.7}
@media(max-width:800px){.language-switch{margin-bottom:10px;width:max-content}.search-box{margin-bottom:10px}.study-hero{padding:25px 20px 23px}.study-hero h1{font-size:29px}.study-tools{display:block;padding:14px 16px}.progress-card{width:auto;margin-top:10px}.study-layout{grid-template-columns:1fr;min-height:0}.study-layout aside{position:relative;top:auto;max-height:none;border-right:0;border-bottom:1px solid #e7eaf0;padding:11px 12px;display:flex;overflow-x:auto;gap:5px}.toc-title{display:none}.toc{min-width:190px;width:auto;margin:0}.study-layout article{padding:20px 17px 28px}.note-head{padding:20px}.note-para{font-size:15px;line-height:1.9;margin:15px 2px}.fact-grid{grid-template-columns:1fr}.source-note{padding:13px 16px}.study-hero .secondary{padding:9px 12px;font-size:12px}}

.ai-overlay{position:fixed;inset:0;z-index:1000;background:rgba(10,25,38,.56);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px}.ai-modal{width:min(650px,100%);max-height:min(82vh,700px);overflow:auto;background:#fff;border-radius:22px;box-shadow:0 25px 80px rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.7)}.ai-modal-head{display:flex;justify-content:space-between;gap:15px;padding:22px 23px 18px;background:linear-gradient(135deg,#102a43,#0f766e);color:#fff}.ai-modal-head span{font:800 9px "Plus Jakarta Sans",sans-serif;letter-spacing:1.5px;color:#c9f7ed}.ai-modal-head h2{margin:7px 0 0;font-size:22px;line-height:1.35;color:#fff}.ai-modal-head button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font-size:24px;cursor:pointer}.ai-modal-body{padding:24px}.ai-response p{font-size:15px;line-height:1.85;color:#29384b;margin:0 0 15px;white-space:pre-line}.ai-response h3{font-size:13px;color:#0f766e;margin:20px 0 9px}.ai-loading{min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;color:#334155}.ai-loading small{color:#7b8794}.ai-spinner{width:30px;height:30px;border:3px solid #dceeea;border-top-color:#0f766e;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:6px}@keyframes spin{to{transform:rotate(360deg)}}.ai-error{padding:18px;border-radius:13px;background:#fff6f6;border:1px solid #f0d1d1;color:#7f1d1d}.ai-error p{font-size:13px;line-height:1.6}.ai-error button{border:0;border-radius:9px;padding:9px 13px;background:#0f766e;color:#fff;font-weight:700}.ai-modal-foot{padding:12px 23px;border-top:1px solid #e7ebef;background:#f8fafb;color:#7b8794;font-size:10px;line-height:1.6}@media(max-width:800px){.ai-overlay{align-items:flex-end;padding:0}.ai-modal{width:100%;max-height:88vh;border-radius:22px 22px 0 0}.ai-modal-head{padding:19px 18px 16px}.ai-modal-body{padding:20px 18px}.ai-response p{font-size:14px;line-height:1.8}.ai-modal-foot{padding:11px 18px}}
`}</style>

 {aiOpen&&<div className="ai-overlay" role="dialog" aria-modal="true" aria-label="AI Key Point Analysis" onClick={()=>!aiLoading&&setAiOpen(false)}><div className="ai-modal" onClick={e=>e.stopPropagation()}><div className="ai-modal-head"><div><span>✨ AI ANALYSIS</span><h2>{aiPoint}</h2></div><button type="button" onClick={()=>setAiOpen(false)} aria-label="Close">×</button></div><div className="ai-modal-body">{aiLoading?<div className="ai-loading"><div className="ai-spinner"/><strong>Preparing a concise analysis...</strong><small>Analyzing the key point in its topic context</small></div>:aiError?<div className="ai-error"><strong>Could not generate the analysis</strong><p>{aiError}</p><button type="button" onClick={()=>openAi(aiPoint)}>Try Again</button></div>:<div className="ai-response">{aiAnalysis.split(/(Exam Focus:)/i).map((part,i)=>/exam focus:/i.test(part)?<h3 key={i}>🎯 Exam Focus</h3>:<p key={i}>{part.trim()}</p>)}</div>}</div>{!aiLoading&&!aiError&&<div className="ai-modal-foot">🤖 Generated by AI • General knowledge analysis • Verify critical facts with standard sources.</div>}</div></div>}
 </main>;
}
