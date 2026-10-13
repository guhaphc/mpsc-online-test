import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
export const maxDuration=90;
const types=["statement_based","pairing","assertion_reason","single_liner","conceptual"] as const;
const labels:Record<string,string>={statement_based:"Statement-Based (Multiple Statements)",pairing:"Pairing / Strict Elimination",assertion_reason:"Assertion and Reason",single_liner:"Single-Liner / Factual",conceptual:"Definitional / Conceptual"};
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
async function context(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!url||!anon||!service)return {error:fail("Server authentication is not configured.",500)};if(!token)return {error:fail("Sign in to continue.",401)};
 const auth=createClient(url,anon);const {data:{user},error}=await auth.auth.getUser(token);if(error||!user)return {error:fail("Your session is invalid.",401)};
 const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});const {data:p}=await db.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
 if(!p||p.access_status!=="approved"||!["teacher","admin"].includes(String(p.role)))return {error:fail("Approved teacher or administrator access is required.",403)};
 return {db,user,role:String(p.role)};
}
export async function POST(req:NextRequest){
 const ctx=await context(req);if("error" in ctx)return ctx.error;const key=process.env.GEMINI_API_KEY;if(!key)return fail("AI regeneration is not configured.",503);
 try{
  const body=await req.json();const bankId=String(body.bank_id||""),questionId=String(body.question_id||""),type=String(body.question_type||"");
  if(!/^[0-9a-f-]{36}$/i.test(bankId)||!/^[0-9a-f-]{36}$/i.test(questionId)||!types.includes(type as any))return fail("Choose a valid question and regeneration format.");
  const {data:bank}=await ctx.db.from("mpsc_ai_question_banks").select("id,title,exam,subject,topic,language,status,created_by").eq("id",bankId).maybeSingle();
  if(!bank)return fail("Question bank not found.",404);if(ctx.role!=="admin"&&bank.created_by!==ctx.user.id)return fail("You cannot edit this question bank.",403);if(bank.status!=="draft")return fail("Only draft question banks can be regenerated.",409);
  const {data:q}=await ctx.db.from("mpsc_ai_question_bank_items").select("id,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,source_reference").eq("id",questionId).eq("bank_id",bankId).maybeSingle();if(!q)return fail("Question not found.",404);
  const schema={type:"OBJECT",properties:{question_text:{type:"STRING"},option_a:{type:"STRING"},option_b:{type:"STRING"},option_c:{type:"STRING"},option_d:{type:"STRING"},correct_answer:{type:"STRING",enum:["A","B","C","D"]},explanation:{type:"STRING"},difficulty:{type:"STRING",enum:["Easy","Moderate","Tough","Extra Tough"]},source_reference:{type:"STRING"}},required:["question_text","option_a","option_b","option_c","option_d","correct_answer","explanation","difficulty","source_reference"]};
  const formatInstructions:Record<string,string>={
   statement_based:"Create a multiple-statement question with 2-4 numbered statements and options representing logically possible combinations (e.g. 1 only, 2 only, both, neither; or 1 and 2 only). The answer key must match the truth of each statement.",
   pairing:"Create a strict pair-matching question with a list of 3-4 pairs and options representing how many/all pairs are correctly matched. Ensure every pair is intentionally true or false and the correct pair count matches the key.",
   assertion_reason:"Create an Assertion (A) and Reason (R) question. Use the standard four options: both true and R correctly explains A; both true but R does not explain A; A true/R false; A false/R true. Ensure the selected key logically follows.",
   single_liner:"Create a concise, direct factual question with four plausible but distinct options, preserving the core learning objective.",
   conceptual:"Create a definitional or conceptual question testing understanding rather than rote recall, with four distinct plausible options."
  };
  const prompt=`Regenerate ONE MCQ using ONLY this required format: ${labels[type]}. Instructions: ${formatInstructions[type]}. Exam ${bank.exam}, subject ${bank.subject}, topic ${bank.topic||"same as original"}, language ${bank.language}, target difficulty ${q.difficulty}. Preserve the original learning objective and relevant scope. Use supplied content as the grounding source; do not invent unsupported dates, articles, cases or facts. Exactly four distinct options and one defensible answer. Explanation must explain the correct answer and why distractors are wrong. For pair/statement/Assertion-Reason formats explicitly verify the key against the statements/pairs/logic. If the original lacks enough facts to make a sound new question, return a cautious, simpler question rather than guess.\nORIGINAL QUESTION: ${q.question_text}\nA: ${q.option_a}\nB: ${q.option_b}\nC: ${q.option_c}\nD: ${q.option_d}\nCorrect answer: ${q.correct_answer}\nExisting explanation: ${q.explanation}\nSource reference: ${q.source_reference}\nReturn JSON only.`;
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.15,responseMimeType:"application/json",responseSchema:schema}}),signal:AbortSignal.timeout(75000)});
  if(!response.ok){console.error("MCQ regenerate Gemini error",response.status,(await response.text()).slice(0,300));return fail("AI could not regenerate this question right now.",502);}
  const payload=await response.json();const raw=payload?.candidates?.[0]?.content?.parts?.find((p:{text?:string})=>typeof p.text==="string")?.text;if(!raw)throw new Error("Empty AI response");const candidate=JSON.parse(raw);
  const opts=[candidate.option_a,candidate.option_b,candidate.option_c,candidate.option_d].map((v:any)=>String(v||"").trim());
  if(!String(candidate.question_text||"").trim()||opts.some(x=>!x)||new Set(opts.map(x=>x.toLowerCase())).size!==4||!["A","B","C","D"].includes(candidate.correct_answer)||!String(candidate.explanation||"").trim())return fail("AI output failed question validation. Original question remains unchanged.",502);
  const {data:revision,error}=await ctx.db.from("mpsc_ai_question_bank_revisions").insert({bank_id:bankId,question_id:questionId,created_by:ctx.user.id,question_type:type,candidate:{...candidate,difficulty:q.difficulty,source_reference:q.source_reference||candidate.source_reference||""},status:"draft"}).select("id,question_id,question_type,candidate,status,created_at").single();
  if(error||!revision)return fail("Could not save regenerated question draft.",500);
  return NextResponse.json({revision,label:labels[type],message:"Regenerated question saved as a separate draft. The original remains unchanged."},{status:201});
 }catch(e){console.error("Question regeneration failed",e);return fail("Could not regenerate this question.",502);}
}
