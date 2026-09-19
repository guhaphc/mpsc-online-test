import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

function client(token:string){
  return createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:`Bearer ${token}`}}});
}

async function requireAdmin(request:NextRequest){
  const h=request.headers.get("authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("Authentication required.");
  const sb=client(h.slice(7));
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user) throw new Error("Invalid authentication session.");
  const {data:p,error:pe}=await sb.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(pe) throw new Error(pe.message);
  if(p?.role!=="admin"||p?.access_status!=="approved") throw new Error("Admin access required.");
  return sb;
}

const schema={type:"OBJECT",properties:{
  title:{type:"STRING"},
  summary:{type:"STRING"},
  content:{type:"STRING"},
  sections:{type:"ARRAY",items:{type:"OBJECT",properties:{section_type:{type:"STRING"},title:{type:"STRING"},content:{type:"STRING"}},required:["section_type","title","content"]}}
},required:["title","summary","content","sections"]};

async function gemini(parts:any[]){
  if(!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":geminiApiKey},
    body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{temperature:.35,responseMimeType:"application/json",responseSchema:schema}})
  });
  const data=await res.json();
  if(!res.ok) throw new Error(data?.error?.message||`Gemini request failed (${res.status}).`);
  const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(!raw) throw new Error("Gemini returned an empty response.");
  try{return JSON.parse(raw);}catch{throw new Error("Gemini returned invalid JSON.");}
}

export async function POST(request:NextRequest){
  try{
    const sb=await requireAdmin(request);
    const body=await request.json();
    const stage=String(body.stage||"").trim(), paper=String(body.paper||"").trim();
    const subject=String(body.subject||"").trim(), topic=String(body.topic||"").trim();
    const title=String(body.title||"").trim(), language=String(body.language||"English").trim();
    const sources=Array.isArray(body.sources)?body.sources:[];
    if(!stage||!paper||!subject||!topic||!title) return NextResponse.json({error:"Complete syllabus path and title are required."},{status:400});
    if(sources.length>10) return NextResponse.json({error:"Maximum 10 reference sources per generation."},{status:400});

    const parts:any[]=[{text:`You are an expert MPSC/UPSC civil-services study-note editor.

Create accurate, syllabus-linked, exam-oriented study notes.

STAGE: ${stage}
PAPER: ${paper}
SUBJECT: ${subject}
TOPIC: ${topic}
TITLE: ${title}
LANGUAGE: ${language}

RULES:
1. Stay tightly within the selected syllabus topic.
2. Prefer supplied reference material when relevant; synthesize rather than copy.
3. Do not invent facts, dates, statistics, Articles, judgments, committees, quotations or references.
4. Clearly flag uncertainty or conflicting source claims for administrator review.
5. Include Maharashtra-specific relevance only when genuinely relevant.
6. Make the notes useful for both Prelims and Mains where applicable.
7. Use concise headings, bullet-friendly paragraphs, tables/comparisons, timelines and revision points where useful.
8. Do not reproduce long copyrighted passages.
9. Return structured JSON with a short summary, full note content in Markdown/plain text, and sections.
10. Section types should be simple values such as overview, concept, timeline, facts, comparison, example, mains, prelims, revision, caution, source_note.
11. ${language==="Both"?"Provide the main content in both English and Marathi where practical.":"Write the notes in the requested language."}

Return an administrator-reviewable draft, not an automatically published note.`}];

    for(const s of sources){
      if(!s?.storage_path) {
        parts.push({text:`REFERENCE METADATA:
Title: ${String(s?.title||"")}
Type: ${String(s?.source_type||"")}
Description: ${String(s?.description||"")}
URL: ${String(s?.url||"")}`});
        continue;
      }
      const path=String(s.storage_path);
      const {data:file,error}=await sb.storage.from("ai-note-sources").download(path);
      if(error||!file) throw new Error(`Could not read reference "${String(s.title||path)}": ${error?.message||"file unavailable"}`);
      if(file.size>8*1024*1024) throw new Error(`Reference "${String(s.title||path)}" exceeds the 8 MB limit.`);
      const mime=file.type|| (s.source_type==="pdf"?"application/pdf":"image/jpeg");
      const buf=Buffer.from(await file.arrayBuffer());
      parts.push({text:`REFERENCE FILE: ${String(s.title||path)}. Use it as source material. Extract and synthesize relevant information only.`});
      parts.push({inlineData:{mimeType:mime,data:buf.toString("base64")}});
    }

    const generated=await gemini(parts);
    const content=String(generated.content||"").trim();
    if(!content) throw new Error("AI did not return note content.");
    const sections=Array.isArray(generated.sections)?generated.sections.map((x:any)=>({section_type:String(x?.section_type||"text"),title:String(x?.title||"").trim(),content:String(x?.content||"").trim()})).filter((x:any)=>x.title&&x.content):[];
    return NextResponse.json({title:String(generated.title||title).trim()||title,summary:String(generated.summary||"").trim(),content,sections,model:MODEL});
  }catch(e){
    console.error("Study notes generation error",e);
    return NextResponse.json({error:e instanceof Error?e.message:"Study notes generation failed."},{status:500});
  }
}
