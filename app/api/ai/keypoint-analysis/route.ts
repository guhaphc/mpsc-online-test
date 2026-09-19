import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nijhvrddhkokfesyjzoq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_1UIsEp5bqw4Rpvo59EdDNQ_pHAZcRZL";
const geminiApiKey = process.env.GEMINI_API_KEY!;

export async function POST(request:NextRequest){
 try{
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return NextResponse.json({error:"Authentication required."},{status:401});
  const sb=createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:`Bearer ${auth.slice(7)}`}}});
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user) return NextResponse.json({error:"Invalid authentication session."},{status:401});
  const {data:profile}=await sb.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(profile?.access_status!=="approved" || profile?.role==="admin") return NextResponse.json({error:"Approved student access required."},{status:403});

  const body=await request.json();
  const subject=String(body.subject||"").trim();
  const topic=String(body.topic||"").trim();
  const keyPoint=String(body.keyPoint||"").trim();
  const noteContext=String(body.noteContext||"").trim();
  if(!subject||!topic||!keyPoint) return NextResponse.json({error:"Subject, topic and key point are required."},{status:400});
  if(keyPoint.length>1200||noteContext.length>6000) return NextResponse.json({error:"Request is too large."},{status:400});
  if(!geminiApiKey) return NextResponse.json({error:"AI service is not configured."},{status:503});

  const prompt=`You are an expert UPSC/MPSC civil-services teacher. Generate a SHORT but DETAILED analytical explanation of the following key point.

Subject: ${subject}
Topic: ${topic}
Key point: ${keyPoint}

Relevant note context:
${noteContext}

Requirements:
- 70-120 words maximum.
- Explain what it is, its essential characteristics/significance, and why it matters in this topic.
- Go beyond a dictionary definition: provide concise analytical context.
- End with exactly 2-4 concise "Exam Focus" bullets.
- Use the same language as the key point/context (Marathi when the notes are Marathi; English when English).
- You may use your general AI knowledge. Do not mention that you used AI or that you lack sources.
- Do not invent precise statistics, dates or citations unless highly established.
- No long introduction, no generic conclusion, no follow-up question.
Return plain text with the explanation followed by "Exam Focus:" and bullets.`;

  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
   method:"POST",
   headers:{"Content-Type":"application/json","x-goog-api-key":geminiApiKey},
   body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:350}})
  });
  const data=await res.json();
  if(!res.ok) return NextResponse.json({error:data?.error?.message||`AI request failed (${res.status}).`},{status:502});
  const text=data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if(!text) return NextResponse.json({error:"AI returned an empty response."},{status:502});
  return NextResponse.json({analysis:text,model:MODEL});
 }catch(e){
  console.error("Key point AI error",e);
  return NextResponse.json({error:e instanceof Error?e.message:"AI analysis failed."},{status:500});
 }
}
