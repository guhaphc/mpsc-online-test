import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nijhvrddhkokfesyjzoq.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_1UIsEp5bqw4Rpvo59EdDNQ_pHAZcRZL";
const GEMINI_KEY = process.env.GEMINI_API_KEY!;

function sb(token:string){
  return createClient(SUPABASE_URL,SUPABASE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}}});
}
async function admin(request:NextRequest){
  const h=request.headers.get("authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("Authentication required.");
  const client=sb(h.slice(7));
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user) throw new Error("Invalid authentication session.");
  const {data:p,error:pe}=await client.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(pe) throw new Error(pe.message);
  if(p?.role!=="admin"||p.access_status!=="approved") throw new Error("Admin access required.");
  return client;
}
function monthRange(){
  const now=new Date(); return {year:now.getUTCFullYear(),month:now.getUTCMonth()+1};
}
function cleanHtml(s:string){
  return s.replace(/<script[\\s\\S]*?<\\/script>/gi," ").replace(/<style[\\s\\S]*?<\\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/\\s+/g," ").trim();
}
async function rss(query:string){
  const url=`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const r=await fetch(url,{headers:{"User-Agent":"MPSC-Current-Affairs/1.0"},cache:"no-store"});
  if(!r.ok) throw new Error(`News feed unavailable (${r.status}).`);
  const xml=await r.text();
  const items=[...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/g)].map(m=>m[1]).slice(0,25).map(x=>({
    title:cleanHtml((x.match(/<title>([\\s\\S]*?)<\\/title>/i)?.[1]||"")),
    url:(x.match(/<link>([\\s\\S]*?)<\\/link>/i)?.[1]||"").trim(),
    pubDate:(x.match(/<pubDate>([\\s\\S]*?)<\\/pubDate>/i)?.[1]||"").trim(),
    description:cleanHtml(x.match(/<description>([\\s\\S]*?)<\\/description>/i)?.[1]||"")
  }));
  return items.filter(x=>x.title&&x.url);
}
async function gemini(prompt:string){
  if(!GEMINI_KEY) throw new Error("GEMINI_API_KEY is not configured.");
  const schema={type:"OBJECT",properties:{
    items:{type:"ARRAY",items:{type:"OBJECT",properties:{
      headline:{type:"STRING"},category:{type:"STRING"},what_happened:{type:"STRING"},
      polity_relevance:{type:"STRING"},prelims_fact:{type:"STRING"},mains_angle:{type:"STRING"},
      source_index:{type:"INTEGER"},published_date:{type:"STRING"},include:{type:"BOOLEAN"}
    },required:["headline","category","what_happened","polity_relevance","prelims_fact","mains_angle","source_index","published_date","include"]}}
  },required:["items"]};
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI_KEY},
    body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.2,responseMimeType:"application/json",responseSchema:schema}})
  });
  const d=await r.json(); if(!r.ok) throw new Error(d?.error?.message||`Gemini request failed (${r.status}).`);
  const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text; if(!raw) throw new Error("Gemini returned no current-affairs result.");
  return JSON.parse(raw);
}
function fingerprint(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim().slice(0,300);}
export async function POST(request:NextRequest){
  try{
    const client=await admin(request); const body=await request.json().catch(()=>({}));
    const kind=body.kind==="judgments"?"judgments":"current_affairs"; const {year,month}=monthRange();
    const since=new Date(Date.UTC(year,month-1,1)).toISOString();
    const query=kind==="judgments"
      ?"India Supreme Court constitutional judgment Article 2026 Supreme Court India"
      :"India polity constitutional Parliament election ECI government appointment Supreme Court governance 2026";
    const sources=await rss(query);
    const recent=sources.filter(x=>{const d=Date.parse(x.pubDate);return !Number.isFinite(d)||d>=Date.parse(since);}).slice(0,18);
    if(!recent.length) return NextResponse.json({created:0,message:"No recent source items were found."});
    const sourceText=recent.map((x,i)=>`SOURCE ${i+1}\nTitle: ${x.title}\nDate: ${x.pubDate}\nURL: ${x.url}\nDescription: ${x.description.slice(0,1500)}`).join("\n\n");
    const prompt=kind==="judgments"
      ?`You are preparing administrator-reviewable UPSC/MPSC Indian Polity current-affairs notes for the current month. Select only genuinely important recent Indian Supreme Court constitutional/public-law judgments. Do not invent cases or holdings. Use only the supplied source records. Exclude ordinary political news. Return at most 10 items. For each include: case name/headline, issue, constitutional provision, accurate ruling summary, exam importance, prelims point, mains angle. Put the source record number in source_index. If a source is insufficient, set include=false.\n\n${sourceText}`
      :`You are preparing administrator-reviewable UPSC/MPSC Indian Polity current-affairs notes for the current month. Select only important recent developments useful for Indian Polity/general studies: constitutional bodies, Parliament, elections/ECI, appointments to constitutional/statutory institutions, Supreme Court, federalism, important Acts/rules, governance and constitutional developments. Exclude routine party statements, personalities without institutional relevance, crime, entertainment and general news. Return at most 15 short items. Do not invent facts. Use only supplied source records. Put source record number in source_index and include=false when the source is insufficient.\n\n${sourceText}`;
    const generated=await gemini(prompt); let created=0;
    for(const item of (generated.items||[])){
      if(!item.include) continue; const src=recent[(Number(item.source_index)||1)-1]; if(!src) continue;
      const fp=fingerprint(kind==="judgments"?item.headline:src.title);
      if(kind==="current_affairs"){
        const {error}=await client.from("polity_current_affairs").upsert({
          month,year,category:String(item.category||"Polity"),headline:String(item.headline||src.title),
          what_happened:String(item.what_happened||""),polity_relevance:String(item.polity_relevance||""),
          prelims_fact:String(item.prelims_fact||""),mains_angle:String(item.mains_angle||""),
          source_name:"News source",source_url:src.url,published_date:Number.isFinite(Date.parse(src.pubDate))?new Date(src.pubDate).toISOString():null,
          fingerprint:fp,status:"draft",updated_at:new Date().toISOString()
        },{onConflict:"fingerprint"});
        if(!error) created++;
      }else{
        const {error}=await client.from("polity_court_judgments").upsert({
          month,year,case_name:String(item.headline||"Important Supreme Court judgment"),issue:String(item.what_happened||""),
          constitutional_provision:String(item.polity_relevance||""),judgment_summary:String(item.what_happened||""),
          importance:String(item.mains_angle||""),prelims_point:String(item.prelims_fact||""),mains_angle:String(item.mains_angle||""),
          source_name:"News source",source_url:src.url,published_date:Number.isFinite(Date.parse(src.pubDate))?new Date(src.pubDate).toISOString():null,
          fingerprint:fp,status:"draft",updated_at:new Date().toISOString()
        },{onConflict:"fingerprint"});
        if(!error) created++;
      }
    }
    return NextResponse.json({created,year,month,kind,message:`${created} new draft items prepared for administrator review.`});
  }catch(e){console.error("Polity refresh error",e);return NextResponse.json({error:e instanceof Error?e.message:"Refresh failed."},{status:400});}
}
export async function GET(request:NextRequest){
  try{
    const client=await admin(request); const {year,month}=monthRange();
    const [a,b]=await Promise.all([
      client.from("polity_current_affairs").select("*").eq("year",year).eq("month",month).order("published_date",{ascending:false}),
      client.from("polity_court_judgments").select("*").eq("year",year).eq("month",month).order("published_date",{ascending:false})
    ]);
    if(a.error)throw new Error(a.error.message); if(b.error)throw new Error(b.error.message);
    return NextResponse.json({current_affairs:a.data||[],judgments:b.data||[],year,month});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load updates."},{status:400});}
}
export async function PATCH(request:NextRequest){
  try{
    const client=await admin(request); const b=await request.json(); const kind=b.kind==="judgments"?"judgments":"current_affairs";
    const table=kind==="judgments"?"polity_court_judgments":"polity_current_affairs";
    const allowed=["approved","rejected","draft","archived"]; if(!allowed.includes(b.status)) throw new Error("Invalid status.");
    const {error}=await client.from(table).update({status:b.status,updated_at:new Date().toISOString()}).eq("id",b.id);
    if(error)throw new Error(error.message); return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Update failed."},{status:400});}
}
