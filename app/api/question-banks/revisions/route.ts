import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
async function context(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!url||!anon||!service)return {error:fail("Server authentication is not configured.",500)};if(!token)return {error:fail("Sign in to continue.",401)};
 const auth=createClient(url,anon);const {data:{user},error}=await auth.auth.getUser(token);if(error||!user)return {error:fail("Your session is invalid.",401)};
 const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});const {data:p}=await db.from("mpsc_profiles").select("role,access_status").eq("id",user.id).maybeSingle();
 if(!p||p.access_status!=="approved"||!["teacher","admin"].includes(String(p.role)))return {error:fail("Approved teacher or administrator access is required.",403)};
 return {db,user,role:String(p.role)};
}
export async function GET(req:NextRequest){
 const ctx=await context(req);if("error" in ctx)return ctx.error;const bankId=req.nextUrl.searchParams.get("bank_id")||"";if(!/^[0-9a-f-]{36}$/i.test(bankId))return fail("A valid bank ID is required.");
 const {data:bank}=await ctx.db.from("mpsc_ai_question_banks").select("id,created_by").eq("id",bankId).maybeSingle();if(!bank)return fail("Bank not found.",404);if(ctx.role!=="admin"&&bank.created_by!==ctx.user.id)return fail("You cannot view this bank.",403);
 const {data,error}=await ctx.db.from("mpsc_ai_question_bank_revisions").select("*").eq("bank_id",bankId).order("created_at",{ascending:false});if(error)return fail("Could not load regenerated drafts.",500);return NextResponse.json({revisions:data||[]});
}
export async function POST(req:NextRequest){
 const ctx=await context(req);if("error" in ctx)return ctx.error;
 try{
  const body=await req.json();const revisionId=String(body.revision_id||""),action=String(body.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(revisionId)||!["accept","discard"].includes(action))return fail("Invalid revision action.");
  const {data:rev}=await ctx.db.from("mpsc_ai_question_bank_revisions").select("*").eq("id",revisionId).maybeSingle();if(!rev)return fail("Draft revision not found.",404);
  const {data:bank}=await ctx.db.from("mpsc_ai_question_banks").select("id,created_by,status").eq("id",rev.bank_id).maybeSingle();if(!bank)return fail("Bank not found.",404);if(ctx.role!=="admin"&&bank.created_by!==ctx.user.id)return fail("You cannot edit this bank.",403);if(bank.status!=="draft")return fail("Only draft banks can be changed.",409);if(rev.status!=="draft")return fail("This revision has already been reviewed.",409);
  if(action==="discard"){const {error}=await ctx.db.from("mpsc_ai_question_bank_revisions").update({status:"discarded",reviewed_at:new Date().toISOString()}).eq("id",revisionId);if(error)return fail("Could not discard this draft.",500);return NextResponse.json({success:true,status:"discarded"});}
  const q=rev.candidate as Record<string,unknown>;const opts=["option_a","option_b","option_c","option_d"].map(k=>String(q[k]||"").trim());const correct=String(q.correct_answer||"").toUpperCase();
  if(!String(q.question_text||"").trim()||opts.some(x=>!x)||new Set(opts.map(x=>x.toLowerCase())).size!==4||!["A","B","C","D"].includes(correct)||!String(q.explanation||"").trim())return fail("This regenerated question is incomplete.",400);
  const {error:updateQ}=await ctx.db.from("mpsc_ai_question_bank_items").update({question_text:String(q.question_text),option_a:opts[0],option_b:opts[1],option_c:opts[2],option_d:opts[3],correct_answer:correct,explanation:String(q.explanation),difficulty:String(q.difficulty||"Moderate"),source_reference:String(q.source_reference||"")}).eq("id",rev.question_id).eq("bank_id",rev.bank_id);if(updateQ)return fail("Could not apply regenerated question.",500);
  const {error:updateR}=await ctx.db.from("mpsc_ai_question_bank_revisions").update({status:"accepted",reviewed_at:new Date().toISOString()}).eq("id",revisionId);if(updateR)return fail("Question was updated but draft status could not be saved.",500);
  return NextResponse.json({success:true,status:"accepted"});
 }catch(e){console.error("Question revision action failed",e);return fail("Could not update regenerated question.",500);}
}
