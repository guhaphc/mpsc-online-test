import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL=process.env.GEMINI_MODEL||"gemini-3.1-flash-lite";
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://nijhvrddhkokfesyjzoq.supabase.co";
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_1UIsEp5bqw4Rpvo59EdDNQ_pHAZcRZL";
const GEMINI=process.env.GEMINI_API_KEY!;

export async function POST(req:NextRequest){
 try{
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return NextResponse.json({error:"Authentication required."},{status:401});
  const sb=createClient(URL,KEY,{global:{headers:{Authorization:"Bearer "+auth.slice(7)}}});
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user)return NextResponse.json({error:"Invalid authentication session."},{status:401});
  const {data:profile}=await sb.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(profile?.access_status!=="approved"||profile?.role==="admin")return NextResponse.json({error:"Approved student access required."},{status:403});
  if(!GEMINI)return NextResponse.json({error:"AI service is not configured."},{status:503});
  const b=await req.json(), title=String(b.title||""), subtitle=String(b.subtitle||""), content=String(b.content||"");
  if(!title||!content)return NextResponse.json({error:"Page content is required."},{status:400});
  const prompt=`From the supplied MPSC/UPSC study page, identify a comprehensive set of 10-20 IMPORTANT KEYWORDS or named concepts that a student would reasonably want to tap for related AI knowledge. Prefer people, rulers, dynasties, battles, places, institutions, concepts, texts, movements, monuments and technical historical terms. Use the source wording where possible. Do not create facts or keywords not supported by the supplied page. Return JSON only: {"keywords":["..."]}. Order them by importance for understanding the opened note. Include all major people, rulers, dynasties, battles, places, institutions, concepts, texts, movements, monuments and technical historical terms actually present in the note.
Title: ${title}
Subtitle: ${subtitle}
Page:
${content.slice(0,18000)}`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.15,responseMimeType:"application/json"}})});
  const data=await res.json(); if(!res.ok)throw new Error(data?.error?.message||`AI request failed (${res.status}).`);
  const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text||"{}";
  const parsed=JSON.parse(raw.replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/,"").trim());
  return NextResponse.json({keywords:Array.isArray(parsed.keywords)?parsed.keywords:[]});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Keyword extraction failed."},{status:500});}
}
