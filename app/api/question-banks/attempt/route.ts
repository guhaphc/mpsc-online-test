import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

async function getStudent(request: NextRequest) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!url||!anon||!service)return {error:NextResponse.json({error:"Server authentication is not configured."},{status:500})};
  if(!token)return {error:NextResponse.json({error:"Sign in to continue."},{status:401})};
  const auth=createClient(url,anon);
  const {data:{user},error}=await auth.auth.getUser(token);
  if(error||!user)return {error:NextResponse.json({error:"Your session is invalid."},{status:401})};
  const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:profile}=await db.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
  if(!profile||profile.access_status!=="approved"||!["user","student"].includes(String(profile.role)))return {error:NextResponse.json({error:"Approved student access is required."},{status:403})};
  return {db,user};
}

export async function POST(request:NextRequest) {
  const ctx=await getStudent(request);
  if("error" in ctx)return ctx.error;
  try {
    const body=await request.json();
    const bankId=String(body.bank_id||"");
    const answers=body.answers;
    if(!/^[0-9a-f-]{36}$/i.test(bankId)||!Array.isArray(answers)||answers.length>100)return NextResponse.json({error:"Invalid attempt."},{status:400});
    const {data:bank}=await ctx.db.from("mpsc_ai_question_banks").select("id,status,title").eq("id",bankId).eq("status","published").maybeSingle();
    if(!bank)return NextResponse.json({error:"Published question bank not found."},{status:404});
    const submitted=new Map<string,string>();
    for(const row of answers) {
      const id=String(row?.question_id||""); const value=String(row?.answer||"").toUpperCase();
      if(!/^[0-9a-f-]{36}$/i.test(id)||!["A","B","C","D",""].includes(value))return NextResponse.json({error:"An answer is invalid."},{status:400});
      submitted.set(id,value);
    }
    const {data:questions,error}=await ctx.db.from("mpsc_ai_question_bank_items").select("id,question_order,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,source_reference").eq("bank_id",bankId).order("question_order");
    if(error||!questions?.length)return NextResponse.json({error:"Questions could not be loaded."},{status:500});
    if(submitted.size!==questions.length||questions.some(q=>!submitted.get(String(q.id))))return NextResponse.json({error:"Answer every question before submitting your attempt."},{status:400});
    const reviewed=questions.map(q=>({question_id:q.id,question_order:q.question_order,question_text:q.question_text,options:{A:q.option_a,B:q.option_b,C:q.option_c,D:q.option_d},selected_answer:submitted.get(String(q.id))||"",correct_answer:q.correct_answer,correct:submitted.get(String(q.id))===q.correct_answer,explanation:q.explanation,difficulty:q.difficulty,source_reference:q.source_reference}));
    const correct=reviewed.filter(q=>q.correct).length;
    const {data:prior,error:priorError}=await ctx.db.from("mpsc_ai_question_bank_attempts").select("attempt_number").eq("student_id",ctx.user.id).eq("bank_id",bankId).order("attempt_number",{ascending:false}).limit(1);
    if(priorError)throw priorError;
    const attemptNumber=(prior?.[0]?.attempt_number||0)+1;
    const submittedAt=new Date().toISOString();
    const scorePercent=Math.round(correct/Math.max(1,reviewed.length)*100);
    const {data:saved,error:saveError}=await ctx.db.from("mpsc_ai_question_bank_attempts").insert({
      student_id:ctx.user.id,bank_id:bankId,attempt_number:attemptNumber,total_questions:reviewed.length,
      answered_count:reviewed.filter(q=>q.selected_answer).length,correct_count:correct,score_percent:scorePercent,
      answers:reviewed.map(q=>({question_id:q.question_id,selected_answer:q.selected_answer,correct_answer:q.correct_answer,correct:q.correct})),submitted_at:submittedAt
    }).select("id,attempt_number,submitted_at,total_questions,answered_count,correct_count,score_percent").single();
    if(saveError||!saved)throw saveError||new Error("Could not save attempt");
    return NextResponse.json({attempt:saved,bank_title:bank.title,total:reviewed.length,answered:reviewed.filter(q=>q.selected_answer).length,correct,score_percent:scorePercent,results:reviewed});
  }catch(e){console.error("Question bank attempt failed",e);return NextResponse.json({error:"Could not grade and save this attempt."},{status:500});}
}

export async function GET(request:NextRequest) {
  const ctx=await getStudent(request);
  if("error" in ctx)return ctx.error;
  const bankId=request.nextUrl.searchParams.get("bank_id");
  let query=ctx.db.from("mpsc_ai_question_bank_attempts").select("id,bank_id,attempt_number,total_questions,answered_count,correct_count,score_percent,submitted_at").eq("student_id",ctx.user.id).order("submitted_at",{ascending:false}).limit(500);
  if(bankId){if(!/^[0-9a-f-]{36}$/i.test(bankId))return NextResponse.json({error:"Invalid question bank."},{status:400});query=query.eq("bank_id",bankId);}
  const {data,error}=await query;
  if(error){console.error("Attempt history query failed",error);return NextResponse.json({error:"Could not load practice history."},{status:500});}
  const latestByBank=new Map<string,typeof data>();
  for(const row of data||[]){if(!latestByBank.has(row.bank_id))latestByBank.set(row.bank_id,[row]);}
  return NextResponse.json({attempts:data||[],latest_by_bank:Object.fromEntries([...latestByBank.entries()].map(([id,rows])=>[id,rows[0]]))});
}
