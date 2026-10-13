import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
async function context(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!url||!anon||!service)return {error:fail("Server authentication is not configured.",500)};
 if(!token)return {error:fail("Sign in to continue.",401)};
 const auth=createClient(url,anon);const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user)return {error:fail("Your session is invalid.",401)};
 const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:p}=await db.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
 if(!p||p.access_status!=="approved"||!["teacher","admin"].includes(String(p.role)))return {error:fail("Approved teacher or administrator access is required.",403)};
 return {db,user};
}
export async function POST(req:NextRequest){
 const ctx=await context(req);if("error" in ctx)return ctx.error;
 const key=process.env.GEMINI_API_KEY;if(!key)return fail("AI import is not configured.",503);
 let bankId:string|null=null;
 try{
  const body=await req.json();const title=String(body.title||"").trim().slice(0,180),exam=String(body.exam||"MPSC"),subject=String(body.subject||"").trim().slice(0,160),topic=String(body.topic||"").trim().slice(0,180),language=String(body.language||"English"),text=String(body.text||"").trim();
  if(!title||!subject)return fail("Question bank title and subject are required.");
  if(text.length<80||text.length>60000)return fail("Paste between 80 and 60,000 characters of question text.");
  if(!["MPSC","UPSC","Other"].includes(exam)||!["English","Marathi"].includes(language))return fail("Choose a valid exam and language.");
  const {data:bank,error}=await ctx.db.from("mpsc_ai_question_banks").insert({title,exam,subject,topic,language,source_type:"text",source_name:"Pasted existing question bank",source_mode:"source_only",created_by:ctx.user.id,status:"draft"}).select("id").single();
  if(error||!bank)return fail("Could not create question bank draft.",500);bankId=bank.id;
  const schema={type:"OBJECT",properties:{questions:{type:"ARRAY",items:{type:"OBJECT",properties:{question_text:{type:"STRING"},option_a:{type:"STRING"},option_b:{type:"STRING"},option_c:{type:"STRING"},option_d:{type:"STRING"},correct_answer:{type:"STRING",enum:["A","B","C","D"]},explanation:{type:"STRING"},difficulty:{type:"STRING",enum:["Easy","Moderate","Tough","Extra Tough"]},source_reference:{type:"STRING"}},required:["question_text","option_a","option_b","option_c","option_d","correct_answer","explanation","difficulty","source_reference"]}}},required:["questions"]};
  const prompt=`Convert the pasted existing MCQ bank into structured draft MCQs in ${language}. Extract only questions supported by the pasted text. Never invent missing answers or explanations: if the correct answer cannot be confidently identified, set correct_answer to the best-supported answer only if explicit; otherwise skip that item and mention in an import_warnings field if schema permits. Keep wording and options faithful. Exactly four options A-D; preserve explanations/source references where present. For missing explanations, write "Teacher review required: explanation was not supplied in source." Keep difficulty as supplied or Moderate if absent. Return JSON only.\nPASTED QUESTION BANK:\n${text}`;
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.1,responseMimeType:"application/json",responseSchema:schema}}),signal:AbortSignal.timeout(75000)});
  if(!response.ok){console.error("MCQ import Gemini error",response.status,(await response.text()).slice(0,300));throw new Error("AI could not parse the pasted question bank. Your draft bank was created; please retry or edit it.");}
  const payload=await response.json();const raw=payload?.candidates?.[0]?.content?.parts?.find((p:{text?:string})=>typeof p.text==="string")?.text;if(!raw)throw new Error("AI returned an empty response.");
  const parsed=JSON.parse(raw);if(!Array.isArray(parsed.questions)||!parsed.questions.length)throw new Error("No valid questions were found. Check the pasted text.");
  if(parsed.questions.length>100)throw new Error("Import supports up to 100 questions at a time.");
  const rows=parsed.questions.map((q:any,i:number)=>({bank_id:bankId,question_order:i+1,question_text:String(q.question_text||"").trim(),option_a:String(q.option_a||"").trim(),option_b:String(q.option_b||"").trim(),option_c:String(q.option_c||"").trim(),option_d:String(q.option_d||"").trim(),correct_answer:String(q.correct_answer||"").toUpperCase(),explanation:String(q.explanation||"Teacher review required: explanation was not supplied in source.").trim(),difficulty:["Easy","Moderate","Tough","Extra Tough"].includes(q.difficulty)?q.difficulty:"Moderate",source_reference:String(q.source_reference||"Imported text").slice(0,500)}));
  if(rows.some(q=>!q.question_text||![q.option_a,q.option_b,q.option_c,q.option_d].every(Boolean)||new Set([q.option_a,q.option_b,q.option_c,q.option_d].map(x=>x.toLowerCase())).size!==4||!["A","B","C","D"].includes(q.correct_answer)))throw new Error("Some imported questions have missing/ambiguous options or answer keys. Draft retained; review and retry with clearer text.");
  const {error:saveError}=await ctx.db.from("mpsc_ai_question_bank_items").insert(rows);if(saveError)throw new Error("Could not save imported questions. The empty draft bank was preserved.");
  return NextResponse.json({bank_id:bankId,generated_count:rows.length,status:"draft",message:`${rows.length} questions imported as a draft. Review every answer before submission.`},{status:201});
 }catch(e){console.error("Question bank text import failed",{bankId,error:e instanceof Error?e.message:String(e)});return NextResponse.json({bank_id:bankId,error:e instanceof Error?e.message:"Could not import questions.",partial_draft_saved:Boolean(bankId)},{status:500});}
}
