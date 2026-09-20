import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nijhvrddhkokfesyjzoq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

function client(token:string){ return createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:`Bearer ${token}`}}}); }

async function requireAdmin(request:NextRequest){
 const auth=request.headers.get("authorization")||""; if(!auth.startsWith("Bearer ")) throw new Error("Authentication required.");
 const sb=client(auth.slice(7)); const {data:{user},error}=await sb.auth.getUser(); if(error||!user) throw new Error("Invalid authentication session.");
 const {data:p,error:pe}=await sb.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
 if(pe) throw new Error(pe.message); if(p?.role!=="admin"||p?.access_status!=="approved") throw new Error("Admin access required."); return sb;
}
const schema={type:"OBJECT",properties:{
 title:{type:"STRING"},topic:{type:"STRING"},summary:{type:"STRING"},content:{type:"STRING"},prelims_points:{type:"STRING"},mains_angle:{type:"STRING"},keywords:{type:"STRING"}
},required:["title","topic","summary","content","prelims_points","mains_angle","keywords"]};

async function gemini(subject:string,file:{mimeType:string,data:string}|null,sourceName:string,sourceText:string){
 if(!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured.");
 const prompt=`You are a senior UPSC/MPSC current-affairs editor and visual study-material writer.

Create a polished, exam-ready current-affairs note from the uploaded source document/image.

SUBJECT: ${subject}
SOURCE FILE: ${sourceName}

FACTUAL RULES:
1. Treat the uploaded source as the primary factual basis.
2. Do not invent facts, dates, statistics, names, judgments, Articles, schemes or claims.
3. Preserve important source terminology and numbers accurately.
4. If something is unclear in the source, mark it for admin verification rather than guessing.
5. Remove advertisements, repeated text and irrelevant material.

CONTENT RULES:
- Make it useful for both MPSC and UPSC.
- Concise but sufficiently detailed.
- Separate factual information from analysis.
- Include only relevant sections.
- End with a quick revision section.

FORMATTING RULES FOR CONTENT:
Return Markdown only inside the content field.
Use:
# for the main title only when useful
## for major sections
### for sub-sections
**bold** for important facts, names, dates, institutions and keywords
• or - for bullet points
> for important takeaway boxes
Use tasteful symbols such as 📰, 📌, 🎯, ✍️, 🧠, ⚠️ only where genuinely useful.
Use tables only when they clearly improve revision.
Do not use HTML.
Do not make every sentence bold or colorful.
The final page should feel like premium MPSC/UPSC digital study material.

Recommended structure when relevant:
📰 Why in News?
📌 Key Highlights
🔎 Background
📚 Detailed Information
🎯 Prelims Focus
✍️ Mains Perspective
⚠️ Issues/Challenges
💡 Way Forward
🧠 Quick Revision

Return:
title, topic, 2-3 sentence summary, formatted content, compact prelims_points, compact mains_angle, comma-separated keywords.`;

 const parts:any[]=[{text:prompt}]; if(file) parts.push({inlineData:{mimeType:file.mimeType,data:file.data}}); else parts[0]={text:prompt+"\n\nSOURCE TEXT:\n"+sourceText};\n const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
  method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":geminiApiKey},
  body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{temperature:0.25,responseMimeType:"application/json",responseSchema:schema}})
 });
 const data=await response.json(); if(!response.ok) throw new Error(data?.error?.message||`Gemini request failed (${response.status}).`);
 const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text; if(!raw) throw new Error("AI returned an empty response.");
 try{return JSON.parse(raw)}catch{throw new Error("AI returned invalid JSON.");}
}

export async function POST(request:NextRequest){
 try{
  const sb=await requireAdmin(request); const body=await request.json(); const subject=String(body.subject||"").trim(); const sourcePath=String(body.sourcePath||"").trim(); const sourceName=String(body.sourceName||"source").trim(); const sourceMime=String(body.sourceMime||"").trim(); const sourceText=String(body.sourceText||"").trim();
  if(!subject) return NextResponse.json({error:"Select a subject."},{status:400});
  if(!sourcePath && sourceText.length<80) return NextResponse.json({error:"Upload a PDF/image or provide source text."},{status:400});
  if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(sourceMime)) return NextResponse.json({error:"Only PDF, JPG, PNG and WEBP files are supported."},{status:400});
  const {data:file,error}=await sb.storage.from("current-affairs-sources").download(sourcePath); if(error||!file) throw new Error(error?.message||"Unable to read uploaded source.");
  const bytes=Buffer.from(await file.arrayBuffer()); if(bytes.length>15*1024*1024) throw new Error("Source file is too large. Please upload a file below 15 MB.");
  const generated=await gemini(subject,{mimeType:sourceMime,data:bytes.toString("base64")},sourceName); const clean=(v:unknown)=>String(v||"").trim();
  return NextResponse.json({...generated,title:clean(generated.title),topic:clean(generated.topic),summary:clean(generated.summary),content:clean(generated.content),prelims_points:clean(generated.prelims_points),mains_angle:clean(generated.mains_angle),keywords:clean(generated.keywords),source_path:sourcePath,source_name:sourceName,source_mime:sourceMime,model:MODEL});
 }catch(error){console.error("Current affairs generation error",error);return NextResponse.json({error:error instanceof Error?error.message:"Current affairs generation failed."},{status:500});}
}