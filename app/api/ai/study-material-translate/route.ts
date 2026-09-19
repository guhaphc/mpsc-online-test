import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL=process.env.GEMINI_MODEL||"gemini-3.1-flash-lite";
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://nijhvrddhkokfesyjzoq.supabase.co";
const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_1UIsEp5bqw4Rpvo59EdDNQ_pHAZcRZL";
const KEY=process.env.GEMINI_API_KEY!;

export async function POST(req:NextRequest){
 try{
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return NextResponse.json({error:"Authentication required."},{status:401});
  const sb=createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:`Bearer ${auth.slice(7)}`}}});
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user)return NextResponse.json({error:"Invalid authentication session."},{status:401});
  const {data:profile}=await sb.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(profile?.access_status!=="approved"||profile?.role==="admin")return NextResponse.json({error:"Approved student access required."},{status:403});
  if(!KEY)return NextResponse.json({error:"AI service is not configured."},{status:503});
  const body=await req.json();
  const target=body.targetLanguage==="English"?"English":"Marathi";
  const section=body.section;
  if(!section||typeof section!=="object")return NextResponse.json({error:"No study section supplied."},{status:400});
  const serialized=JSON.stringify(section);
  if(serialized.length>12000)return NextResponse.json({error:"Translation section is too large."},{status:400});
  const prompt=target==="Marathi"?`Translate the supplied study notes into academically correct, natural Marathi. This is MPSC/UPSC study material. Use established Marathi constitutional, legal, historical and academic terminology wherever a proper Marathi equivalent exists. Avoid unnecessary English-Marathi mixing. Do not retain an English word merely for convenience when a standard Marathi term exists. Retain the original English term in parentheses only when there is no clear/common Marathi equivalent or when the English term is essential for examination recognition. Preserve the exact structure, topic order, meaning, facts, tables, bullet points and examination terminology. Do not add, remove, correct, infer, or expand information. Return JSON only: {"section":{"id":"same id","chapter":"translated","title":"translated","subtitle":"translated","body":["translated"],"facts":["translated"],"subtopics":[{"title":"translated","points":["translated"]}]}}.`:`Translate the supplied study notes into academically correct English. Preserve the exact structure, topic order, meaning, facts, tables, bullet points and MPSC/UPSC examination terminology. Do not add, remove, correct, infer, or expand information. Use standard constitutional, legal, historical and academic English. Return JSON only: {"section":{"id":"same id","chapter":"translated","title":"translated","subtitle":"translated","body":["translated"],"facts":["translated"],"subtopics":[{"title":"translated","points":["translated"]}]}}.`;
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},{text:serialized}]}],generationConfig:{temperature:.15,responseMimeType:"application/json"}})});
  const data=await res.json();
  if(!res.ok)throw new Error(data?.error?.message||`AI request failed (${res.status}).`);
  const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(!raw)throw new Error("AI returned an empty response.");
  const parsed=JSON.parse(raw);
  return NextResponse.json(parsed);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Translation failed."},{status:500});}
}