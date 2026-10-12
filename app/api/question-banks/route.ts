import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const maxDuration = 300;
type Difficulty = "Easy" | "Moderate" | "Tough" | "Extra Tough";
const levels: Difficulty[] = ["Easy", "Moderate", "Tough", "Extra Tough"];
const fileTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxBytes = 4 * 1024 * 1024;
const maxChars = 60000;
const model = "gemini-3.1-flash-lite";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function getContext(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!url || !anon || !service) return { ok: false as const, response: fail("Server authentication is not configured.", 500) };
  if (!token) return { ok: false as const, response: fail("Sign in to continue.", 401) };
  const auth = createClient(url, anon);
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return { ok: false as const, response: fail("Your session is invalid. Please sign in again.", 401) };
  const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile } = await db.from("mpsc_profiles").select("role,access_status").eq("id", user.id).maybeSingle();
  if (!profile || profile.access_status !== "approved" || !["admin", "teacher", "user", "student"].includes(String(profile.role))) {
    return { ok: false as const, response: fail("An approved account is required.", 403) };
  }
  return { ok: true as const, db, user, role: String(profile.role) };
}
const admin = (role: string) => role === "admin";
const creator = (role: string) => role === "admin" || role === "teacher";

function privateIPv4(host: string) {
  const p = host.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] >= 224;
}
async function readWebpage(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid public webpage URL."); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || host === "localhost" ||
    host.endsWith(".localhost") || host.endsWith(".local") || host === "::1" || host.startsWith("fc") ||
    host.startsWith("fd") || host.startsWith("fe80:") || privateIPv4(host) || host === "0.0.0.0" || host === "::") {
    throw new Error("Only public HTTP/HTTPS webpage URLs are allowed.");
  }
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => privateIPv4(entry.address) || entry.address === "::1" ||
      entry.address.startsWith("fc") || entry.address.startsWith("fd") || entry.address.startsWith("fe80:") ||
      entry.address.startsWith("::ffff:127.") || entry.address === "::")) {
      throw new Error("Only public webpage hosts are allowed.");
    }
  } catch {
    throw new Error("The webpage host could not be verified as public.");
  }
  const response = await fetch(url.toString(), { redirect: "manual", signal: AbortSignal.timeout(12000), headers: { "user-agent": "MPSC-QuestionBank/1.0", accept: "text/html,text/plain" } });
  if (response.status >= 300 && response.status < 400) throw new Error("This webpage redirects. Use its final public URL directly.");
  if (!response.ok) throw new Error("Could not read that webpage. Confirm it is public and try again.");
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") && !type.includes("text/plain")) throw new Error("The URL must point to readable HTML or plain text.");
  const html = await response.text();
  if (html.length > 1000000) throw new Error("The webpage is too large. Paste the relevant section instead.");
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ").replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
  if (text.length < 100) throw new Error("Not enough readable text was found on that webpage.");
  return { text: text.slice(0, maxChars), name: url.hostname };
}
async function generate(prompt: string, attachment?: { mimeType: string; data: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI generation is not configured on the server.");
  const schema = { type: "OBJECT", properties: { questions: { type: "ARRAY", items: { type: "OBJECT", properties: {
    question_text: { type: "STRING" }, option_a: { type: "STRING" }, option_b: { type: "STRING" }, option_c: { type: "STRING" },
    option_d: { type: "STRING" }, correct_answer: { type: "STRING", enum: ["A","B","C","D"] }, explanation: { type: "STRING" },
    difficulty: { type: "STRING", enum: levels }, source_reference: { type: "STRING" }
  }, required: ["question_text","option_a","option_b","option_c","option_d","correct_answer","explanation","difficulty","source_reference"] } } }, required: ["questions"] };
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (attachment) parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let status = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema } }),
      signal: AbortSignal.timeout(60000) });
    if (response.ok) {
      const payload = await response.json();
      const raw = payload?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p.text === "string")?.text;
      if (!raw) throw new Error("AI returned an empty response. Try again.");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.questions)) throw new Error("AI returned an invalid question set.");
      return parsed.questions as Array<Record<string, unknown>>;
    }
    status = response.status;
    console.error("Question bank Gemini error", { status, detail: (await response.text()).slice(0, 250) });
    if (![429,500,502,503,504].includes(status) || attempt === 2) break;
    await new Promise(resolve => setTimeout(resolve, 700 * (2 ** attempt)));
  }
  if ([429,500,502,503,504].includes(status)) throw new Error("AI service is busy. Any saved draft is safe; retry generation in a few minutes.");
  throw new Error("AI could not process this source. Check the source and try again.");
}
function cleanQuestion(raw: Record<string, unknown>) {
  const val = (k: string) => String(raw[k] ?? "").trim();
  const q = { question_text: val("question_text").slice(0,5000), option_a: val("option_a").slice(0,2000),
    option_b: val("option_b").slice(0,2000), option_c: val("option_c").slice(0,2000), option_d: val("option_d").slice(0,2000),
    correct_answer: val("correct_answer").toUpperCase(), explanation: val("explanation").slice(0,5000),
    difficulty: val("difficulty"), source_reference: val("source_reference").slice(0,500) };
  const opts = [q.option_a,q.option_b,q.option_c,q.option_d].map(v => v.toLocaleLowerCase());
  if (!q.question_text || opts.some(v => !v) || new Set(opts).size !== 4 || !["A","B","C","D"].includes(q.correct_answer) ||
      !q.explanation || !levels.includes(q.difficulty as Difficulty)) return null;
  return q;
}

export async function GET(req: NextRequest) {
  const ctx = await getContext(req);
  if (!ctx.ok) return ctx.response;
  const student = ["user","student"].includes(ctx.role);
  const bankId = req.nextUrl.searchParams.get("bank_id");
  if (bankId) {
    const { data: bank, error } = await ctx.db.from("mpsc_ai_question_banks").select("*").eq("id", bankId).maybeSingle();
    if (error || !bank) return fail("Question bank not found.", 404);
    if (student && bank.status !== "published") return fail("Question bank not found.", 404);
    if (!student && !admin(ctx.role) && bank.created_by !== ctx.user.id) return fail("You cannot view this question bank.", 403);
    const { data: questions, error: qError } = await ctx.db.from("mpsc_ai_question_bank_items").select("*").eq("bank_id", bankId).order("question_order");
    if (qError) return fail("Could not load questions.", 500);
    const safeQuestions = student ? (questions || []).map((q) => ({ id: q.id, question_order: q.question_order, question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, difficulty: q.difficulty, source_reference: q.source_reference })) : (questions || []);
    return NextResponse.json({ bank: { id: bank.id, title: bank.title, exam: bank.exam, subject: bank.subject, topic: bank.topic, language: bank.language, status: bank.status }, questions: safeQuestions });
  }
  let query = ctx.db.from("mpsc_ai_question_banks").select("id,title,exam,subject,topic,language,source_type,source_name,source_mode,created_by,status,created_at,updated_at,published_at").order("created_at", { ascending: false }).limit(100);
  if (student) query = query.eq("status", "published");
  else if (!admin(ctx.role)) query = query.eq("created_by", ctx.user.id);
  const { data, error } = await query;
  if (error) return fail("Could not load question banks. Apply the Question Bank Studio migration first.", 500);
  return NextResponse.json({ banks: data || [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext(req);
  if (!ctx.ok) return ctx.response;
  if (!creator(ctx.role)) return fail("Only teachers and administrators can create question banks.", 403);
  let bankId: string | null = null;
  try {
    const form = await req.formData();
    const title = String(form.get("title") || "").trim().slice(0,180);
    const exam = String(form.get("exam") || "MPSC");
    const subject = String(form.get("subject") || "").trim().slice(0,160);
    const topic = String(form.get("topic") || "").trim().slice(0,180);
    const language = String(form.get("language") || "English");
    const sourceMode = String(form.get("source_mode") || "source_only");
    const count = Number(form.get("count") || 10);
    const distribution = [Number(form.get("easy") || 0),Number(form.get("moderate") || 0),Number(form.get("tough") || 0),Number(form.get("extra_tough") || 0)];
    const webpageUrl = String(form.get("webpage_url") || "").trim();
    const pasted = String(form.get("source_text") || "").trim();
    const f = form.get("source_file");
    const file = f instanceof File && f.size ? f : null;
    if (!title || !subject) return fail("Question bank title and subject are required.");
    if (!["MPSC","UPSC","Other"].includes(exam) || !["English","Marathi"].includes(language) || !["source_only","source_plus_ai"].includes(sourceMode)) return fail("Choose valid exam, language and source mode.");
    if (![10,25,50,100].includes(count)) return fail("Choose 10, 25, 50 or 100 questions.");
    if (distribution.some(n => !Number.isInteger(n) || n < 0) || distribution.reduce((a,b)=>a+b,0) !== count) return fail("Difficulty quantities must be whole numbers adding up to the total.");
    if (Number(Boolean(file)) + Number(Boolean(webpageUrl)) + Number(Boolean(pasted)) !== 1) return fail("Provide exactly one source: a PDF/image, webpage URL or pasted text.");
    let sourceType: "pdf"|"image"|"webpage"|"text"; let sourceName = ""; let sourceText = "";
    let attachment: { mimeType: string; data: string } | undefined;
    if (file) {
      if (!fileTypes.has(file.type) || file.size > maxBytes) return fail("Upload a PDF, JPG, PNG or WebP file up to 4 MB.");
      sourceType = file.type === "application/pdf" ? "pdf" : "image"; sourceName = file.name.slice(0,200);
      attachment = { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") };
    } else if (webpageUrl) {
      const page = await readWebpage(webpageUrl); sourceType = "webpage"; sourceName = page.name; sourceText = page.text;
    } else {
      if (pasted.length < 100) return fail("Paste at least 100 characters of source material.");
      if (pasted.length > maxChars) return fail("Source text is too long; maximum is 60,000 characters.");
      sourceType = "text"; sourceName = "Pasted text"; sourceText = pasted;
    }
    const { data: bank, error: bankError } = await ctx.db.from("mpsc_ai_question_banks").insert({
      title, exam, subject, topic, language, source_type: sourceType, source_name: sourceName,
      source_mode: sourceMode, created_by: ctx.user.id, status: "draft"
    }).select("id").single();
    if (bankError || !bank) return fail("Could not save a draft. Confirm the Question Bank Studio migration is applied.", 500);
    bankId = String(bank.id);
    const targets: Record<Difficulty,number> = { Easy: distribution[0], Moderate: distribution[1], Tough: distribution[2], "Extra Tough": distribution[3] };
    const allSlots: Difficulty[] = [];
    const remaining = { ...targets };
    while (allSlots.length < count) {
      for (const level of levels) {
        if (remaining[level] > 0) { allSlots.push(level); remaining[level] -= 1; }
      }
    }
    let order = 0;
    for (let start = 0; start < count; start += 10) {
      const size = Math.min(10,count-start);
      const slots = allSlots.slice(start,start+size);
      const prompt = `Generate exactly ${size} unique, high-quality single-correct MPSC/UPSC prelims MCQs in ${language}. Bank: ${title}; Exam: ${exam}; Subject: ${subject}; Topic: ${topic || "as supported by source"}.\nDifficulty for each question in order: ${slots.map((x,i)=>`${i+1}. ${x}`).join("\n")}\n${sourceMode === "source_only" ? "STRICT SOURCE MODE: questions, answers and explanations must be supported by the supplied source; cite page/heading in source_reference when possible." : "SOURCE + AI KNOWLEDGE MODE: use the source as foundation and supplement with established knowledge relevant to MPSC/UPSC. Never invent citations or disputed facts."}\nSource text:\n${sourceText || "Read the attached PDF/image as the source."}\nRules: four distinct options; exactly one defensible answer; plausible distractors; explanation supports the answer; avoid duplicates, ambiguity and unsupported claims. Extra Tough means integrated reasoning, not obscure trivia. Return JSON only.`;
      const raw = await generate(prompt,attachment);
      const clean = raw.map((value,index) => { const question = cleanQuestion(value); return question ? { ...question, difficulty: slots[index] } : null; }).filter(Boolean) as Array<NonNullable<ReturnType<typeof cleanQuestion>>>;
      if (clean.length !== size) throw new Error(`AI returned ${clean.length} valid questions for a batch of ${size}. A partial draft has been saved; try again with a clearer source.`);
      const rows = clean.map(q=>({bank_id:bankId,question_order:++order,...q}));
      const { error } = await ctx.db.from("mpsc_ai_question_bank_items").insert(rows);
      if (error) throw new Error("A question batch could not be saved. The partial draft has been preserved.");
    }
    return NextResponse.json({ bank_id: bankId, generated_count: order, requested_count: count, status:"draft", message:"Draft saved. Review every question before submitting it for approval." },{status:201});
  } catch (e) {
    console.error("Question bank generation failed",{bankId,error:e instanceof Error?e.message:String(e)});
    return NextResponse.json({ bank_id:bankId, error:e instanceof Error?e.message:"Question generation failed.", partial_draft_saved:Boolean(bankId) },{status:500});
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await getContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const body = await req.json();
    const bankId = String(body.bank_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(bankId)) return fail("A valid question bank ID is required.");
    const { data: bank } = await ctx.db.from("mpsc_ai_question_banks").select("*").eq("id",bankId).maybeSingle();
    if (!bank) return fail("Question bank not found.",404);
    if (!admin(ctx.role) && (!creator(ctx.role) || bank.created_by !== ctx.user.id)) return fail("You cannot manage this question bank.",403);
    const action = String(body.action || "save");
    if (action === "publish" || action === "reject") {
      if (!admin(ctx.role)) return fail("Only an administrator can approve and publish question banks.",403);
      if (bank.status !== "pending_review") return fail("Only submitted question banks can be approved or rejected.",409);
      const status = action === "publish" ? "published" : "rejected";
      const { error } = await ctx.db.from("mpsc_ai_question_banks").update({status,published_at:status==="published"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",bankId);
      if (error) return fail("Could not update publication status.",500);
      return NextResponse.json({success:true,status});
    }
    if (bank.status === "published" || bank.status === "rejected") return fail("Published or rejected banks cannot be edited.",409);
    if (action === "submit") {
      const {count,error} = await ctx.db.from("mpsc_ai_question_bank_items").select("id",{count:"exact",head:true}).eq("bank_id",bankId);
      if (error || !count) return fail("The bank must contain questions before submission.");
      const {error:updateError} = await ctx.db.from("mpsc_ai_question_banks").update({status:"pending_review",updated_at:new Date().toISOString()}).eq("id",bankId);
      if (updateError) return fail("Could not submit this bank for approval.",500);
      return NextResponse.json({success:true,status:"pending_review"});
    }
    if (action !== "save" || !Array.isArray(body.questions) || body.questions.length > 100) return fail("Invalid question edit request.");
    for (const q of body.questions) {
      if (!q || !/^[0-9a-f-]{36}$/i.test(String(q.id||""))) return fail("A question ID is invalid.");
      const difficulty = String(q.difficulty||""); const question_text=String(q.question_text||"").trim();
      const options=["option_a","option_b","option_c","option_d"].map(k=>String(q[k]||"").trim());
      const correct_answer=String(q.correct_answer||"").toUpperCase(); const explanation=String(q.explanation||"").trim();
      if (!levels.includes(difficulty as Difficulty) || !question_text || options.some(x=>!x) || new Set(options.map(x=>x.toLowerCase())).size!==4 || !["A","B","C","D"].includes(correct_answer) || !explanation) return fail("Each question needs a prompt, four distinct options, correct answer and explanation.");
      const {error} = await ctx.db.from("mpsc_ai_question_bank_items").update({question_text,option_a:options[0],option_b:options[1],option_c:options[2],option_d:options[3],correct_answer,explanation,difficulty,source_reference:String(q.source_reference||"").slice(0,500)}).eq("id",q.id).eq("bank_id",bankId);
      if (error) return fail("Could not save an edited question.",500);
    }
    return NextResponse.json({success:true});
  } catch(e) { console.error("Question bank update failed",e); return fail("Could not update this question bank.",500); }
}
