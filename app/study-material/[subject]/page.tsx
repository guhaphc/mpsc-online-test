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
 const [loading,setLoading]=useState(true); const [active,setActive]=useState("history"); const [query,setQuery]=useState(""); const [done,setDone]=useState<string[]>([]);
 const title=subjects[params?.subject||""]||"Study Material";
 const filtered=useMemo(()=>sections.filter(s=>(s.title+" "+s.subtitle+" "+s.body.join(" ")).toLowerCase().includes(query.toLowerCase())),[query]);
 const progress=Math.round(done.length/sections.length*100);
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();if(profile?.role==="admin"&&profile?.access_status==="approved"){router.replace("/admin");return;}if(profile?.access_status!=="approved"){router.replace("/pending");return;}setLoading(false);})();},[router]);
 if(loading)return <main className="page"><section className="card"><p>Checking your access...</p></section></main>;
 const current=sections.find(s=>s.id===active)||sections[0];
 return <main className="page"><section className="card study-shell">
  <div className="study-hero"><div><div className="brand">MPSC / UPSC • STUDY MATERIAL</div><h1>{title}</h1><p>प्राचीन इतिहास — PDF आधारित इंटरॅक्टिव्ह नोट्स</p></div><button className="secondary" onClick={()=>router.push("/study-material")}>All Subjects</button></div>
  <div className="study-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔎 नोट्समध्ये शोधा..." /><div className="progress-card"><strong>{progress}%</strong><span>Completed</span><i><b style={{width:progress+"%"}}/></i></div></div>
  <div className="study-layout">
   <aside><div className="toc-title">TOPICS</div>{filtered.map(s=><button className={active===s.id?"toc active":"toc"} key={s.id} onClick={()=>setActive(s.id)}><span>{done.includes(s.id)?"✓":"○"}</span>{s.title}</button>)}</aside>
   <article>
    <div className="note-head"><span>LECTURE 01 • SOURCE PDF</span><h2>{current.title}</h2><p>{current.subtitle}</p></div>
    <div className="source-chip">📘 Source: Ancient History 01 — Daily Class Notes (Marathi), 8 pages</div>
    {current.body.map((p,i)=><p className="note-para" key={i}>{p}</p>)}
    {current.facts&&<div className="fact-grid">{current.facts.map((f,i)=><div className="fact" key={i}><strong>KEY POINT</strong><span>{f}</span></div>)}</div>}
    <div className="note-actions"><button onClick={()=>setDone(x=>x.includes(current.id)?x:x.concat(current.id))}>{done.includes(current.id)?"✓ Topic Completed":"Mark Topic Complete"}</button><button className="secondary" onClick={()=>{const n=sections.findIndex(s=>s.id===current.id);setActive(sections[Math.min(n+1,sections.length-1)].id)}}>Next Topic →</button></div>
   </article>
  </div>
  <div className="source-note">Source-based note: content above is constructed from the uploaded PDF and its page content; outside facts have not been silently added. fileciteturn79file0L121-L149</div>
 </section>
 <style jsx>{`
.study-shell{max-width:1180px!important}.study-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:8px 0 22px}.study-hero h1{margin:5px 0;font-size:clamp(28px,5vw,44px)}.study-hero p{margin:0;color:#64748b}.study-tools{display:flex;gap:14px;align-items:center;margin-bottom:18px}.study-tools input{flex:1;border:1px solid #d8dee8;border-radius:14px;padding:14px 16px;font-size:15px;background:#fbfcfe}.progress-card{width:190px;border:1px solid #e5e7eb;border-radius:14px;padding:10px 13px;display:grid;grid-template-columns:auto 1fr;gap:2px 8px}.progress-card strong{font-size:20px}.progress-card span{font-size:11px;color:#64748b;align-self:end}.progress-card i{grid-column:1/-1;height:6px;background:#e5e7eb;border-radius:10px;overflow:hidden;margin-top:5px}.progress-card b{display:block;height:100%;background:#2563eb;border-radius:10px}.study-layout{display:grid;grid-template-columns:280px 1fr;gap:20px}.study-layout aside{border:1px solid #e5e7eb;border-radius:16px;padding:10px;height:max-content;position:sticky;top:12px;background:#fff}.toc-title{font-size:11px;font-weight:800;letter-spacing:1px;color:#64748b;padding:8px}.toc{display:flex;width:100%;text-align:left;border:0;background:transparent;padding:11px 10px;border-radius:10px;gap:8px;font-size:13px;color:#334155;cursor:pointer}.toc:hover,.toc.active{background:#eff6ff;color:#1d4ed8}.toc span{width:16px}.note-head{padding:22px;border-radius:18px;background:linear-gradient(135deg,#f8fafc,#eef6ff);border:1px solid #e2e8f0}.note-head span{font-size:10px;font-weight:800;letter-spacing:1px;color:#2563eb}.note-head h2{font-size:clamp(23px,4vw,32px);margin:8px 0}.note-head p{margin:0;color:#64748b}.source-chip{display:inline-block;margin:15px 0;padding:8px 12px;border-radius:20px;background:#f8fafc;color:#475569;font-size:12px}.note-para{font-size:16px;line-height:1.9;color:#273449;margin:16px 4px}.fact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:20px 0}.fact{padding:15px;border:1px solid #dbeafe;border-radius:14px;background:#f8fbff}.fact strong{display:block;font-size:10px;color:#2563eb;letter-spacing:.8px;margin-bottom:7px}.fact span{font-size:14px;line-height:1.6;color:#334155}.note-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:25px;padding-top:18px;border-top:1px solid #e5e7eb}.note-actions button{border:0;border-radius:10px;padding:11px 15px;cursor:pointer;background:#2563eb;color:white}.note-actions .secondary{background:white;color:#334155;border:1px solid #d8dee8}.source-note{margin-top:20px;padding:13px;border-radius:12px;background:#f8fafc;color:#64748b;font-size:12px}@media(max-width:760px){.study-hero,.study-tools{display:block}.study-hero button{margin-top:12px}.progress-card{width:auto;margin-top:10px}.study-layout{grid-template-columns:1fr}.study-layout aside{position:relative;top:auto;display:flex;overflow-x:auto;gap:4px}.toc-title{display:none}.toc{min-width:190px}.note-para{font-size:15px;line-height:1.8}}`}</style>
 </main>;
}
