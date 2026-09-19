import { NextRequest, NextResponse } from "next/server";
const MODEL=process.env.GEMINI_MODEL||"gemini-3.1-flash-lite";
const KEY=process.env.GEMINI_API_KEY!;
export async function POST(req:NextRequest){
 try{
  if(!KEY)return NextResponse.json({error:"AI service is not configured."},{status:503});
  const body=await req.json();
  const target=body.targetLanguage==="English"?"English":"Marathi";
  const sections=Array.isArray(body.sections)?body.sections:[];
  if(!sections.length)return NextResponse.json({error:"No notes supplied."},{status:400});
  const prompt=`Translate the supplied study notes into ${target}. Preserve the exact structure, topic order, meaning, facts, tables, bullet points and exam terminology. Do not add, remove, correct, or expand information. For technical UPSC/MPSC terms, preserve the standard English term in parentheses where useful. Return JSON only: {"sections":[{"id":"same id","title":"translated","subtitle":"translated","body":["translated"],"facts":["translated"]}]}.`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},{text:JSON.stringify(sections)}]}],generationConfig:{temperature:.15,responseMimeType:"application/json"}})});
  const data=await res.json(); if(!res.ok)throw new Error(data?.error?.message||`AI request failed (${res.status}).`);
  const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;if(!raw)throw new Error("AI returned an empty response.");
  return NextResponse.json(JSON.parse(raw));
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Translation failed."},{status:500});}
}