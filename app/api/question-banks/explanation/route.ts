import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 90;

async function getStudent(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!url || !anon || !service) return { error: NextResponse.json({ error: "Server authentication is not configured." }, { status: 500 }) };
  if (!token) return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const auth = createClient(url, anon);
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return { error: NextResponse.json({ error: "Your session is invalid." }, { status: 401 }) };
  const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile } = await db.from("mpsc_profiles").select("role,access_status").eq("id", user.id).maybeSingle();
  if (!profile || profile.access_status !== "approved" || !["user", "student"].includes(String(profile.role))) {
    return { error: NextResponse.json({ error: "Approved student access is required." }, { status: 403 }) };
  }
  return { db };
}

export async function POST(request: NextRequest) {
  const ctx = await getStudent(request);
  if ("error" in ctx) return ctx.error;
  const key = process.env.GEMINI_API_KEY;
  try {
    const body = await request.json();
    const bankId = String(body.bank_id || "");
    const questionId = String(body.question_id || "");
    const answers = body.answers;
    if (!/^[0-9a-f-]{36}$/i.test(bankId) || !/^[0-9a-f-]{36}$/i.test(questionId) || !Array.isArray(answers) || answers.length > 100) {
      return NextResponse.json({ error: "Invalid explanation request." }, { status: 400 });
    }
    const { data: bank } = await ctx.db.from("mpsc_ai_question_banks")
      .select("id,title,exam,subject,topic,language,status")
      .eq("id", bankId).eq("status", "published").maybeSingle();
    if (!bank) return NextResponse.json({ error: "Published question bank not found." }, { status: 404 });
    const submitted = new Map<string, string>();
    for (const row of answers) {
      const id = String(row?.question_id || "");
      const answer = String(row?.answer || "").toUpperCase();
      if (!/^[0-9a-f-]{36}$/i.test(id) || !["A", "B", "C", "D"].includes(answer)) {
        return NextResponse.json({ error: "Submit every answer before requesting an explanation." }, { status: 400 });
      }
      submitted.set(id, answer);
    }
    const { data: questions, error } = await ctx.db.from("mpsc_ai_question_bank_items")
      .select("id,question_order,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,source_reference")
      .eq("bank_id", bankId).order("question_order");
    if (error || !questions?.length || submitted.size !== questions.length || questions.some(q => !submitted.has(String(q.id)))) {
      return NextResponse.json({ error: "Submit the complete test before requesting explanations." }, { status: 400 });
    }
    const q = questions.find(item => String(item.id) === questionId);
    if (!q) return NextResponse.json({ error: "Question not found in this bank." }, { status: 404 });
    const questionPayload = {
      question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer,
      explanation: q.explanation, difficulty: q.difficulty, source_reference: q.source_reference
    };
    const fingerprint = createHash("sha256").update(JSON.stringify(questionPayload)).digest("hex");
    const language = String(bank.language || "English");
    const version = 1;
    const { data: cached } = await ctx.db.from("mpsc_ai_question_explanations")
      .select("explanation,id").eq("question_id", q.id).eq("language", language)
      .eq("question_fingerprint", fingerprint).eq("explanation_version", version).maybeSingle();
    if (cached?.explanation) return NextResponse.json({ explanation: cached.explanation, cached: true });
    if (!key) return NextResponse.json({ error: "AI explanations are not configured on the server." }, { status: 503 });
    const schema = {
      type: "OBJECT",
      properties: {
        concept: { type: "STRING" },
        detailed_explanation: { type: "STRING" },
        option_analysis: { type: "OBJECT", properties: { A: { type: "STRING" }, B: { type: "STRING" }, C: { type: "STRING" }, D: { type: "STRING" } }, required: ["A", "B", "C", "D"] },
        example: { type: "STRING" },
        exam_takeaways: { type: "ARRAY", items: { type: "STRING" } },
        memory_aid: { type: "STRING" },
        caution: { type: "STRING" }
      },
      required: ["concept", "detailed_explanation", "option_analysis", "example", "exam_takeaways", "memory_aid", "caution"]
    };
    const prompt = `You are an expert MPSC/UPSC educator. Write an accurate, in-depth educational explanation for ONE MCQ. Use language: ${language}. Exam: ${bank.exam}; subject: ${bank.subject}; topic: ${bank.topic || "as relevant"}.
Explain the tested concept and why the correct answer is correct. Analyse every option A-D individually, explaining why each distractor is wrong or what distinction makes it wrong. Give a realistic example, 3-6 concise exam takeaways and a useful memory aid. Respect constitutional/legal wording and dates. Never invent article numbers, case names, citations or facts. Use the supplied explanation and source reference as context. If uncertain or the question is ambiguous, explicitly describe the limitation in caution rather than guessing. Keep it clear and student-friendly.
Question: ${q.question_text}
Options: A. ${q.option_a}; B. ${q.option_b}; C. ${q.option_c}; D. ${q.option_d}
Correct answer: ${q.correct_answer}
Existing explanation: ${q.explanation}
Source reference: ${q.source_reference}
Difficulty: ${q.difficulty}`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema } }),
      signal: AbortSignal.timeout(75000)
    });
    if (!response.ok) {
      console.error("Single MCQ explanation Gemini error", response.status, (await response.text()).slice(0, 300));
      return NextResponse.json({ error: response.status === 429 ? "AI is busy. Please try again shortly." : "AI could not generate the explanation right now." }, { status: 502 });
    }
    const payload = await response.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text;
    if (!raw) throw new Error("Empty AI response");
    const explanation = JSON.parse(raw);
    if (!explanation.concept || !explanation.detailed_explanation || !explanation.option_analysis || !Array.isArray(explanation.exam_takeaways)) {
      throw new Error("Incomplete AI explanation");
    }
    const { error: insertError } = await ctx.db.from("mpsc_ai_question_explanations").insert({
      question_id: q.id, language, question_fingerprint: fingerprint, explanation_version: version,
      explanation, generated_model: "gemini-3.1-flash-lite"
    });
    if (insertError) {
      // A concurrent request may have won the unique insert race. Prefer the saved shared explanation.
      const { data: raced } = await ctx.db.from("mpsc_ai_question_explanations")
        .select("explanation").eq("question_id", q.id).eq("language", language)
        .eq("question_fingerprint", fingerprint).eq("explanation_version", version).maybeSingle();
      if (raced?.explanation) return NextResponse.json({ explanation: raced.explanation, cached: true });
      console.error("Could not save MCQ explanation cache", insertError.message);
      return NextResponse.json({ error: "The explanation was generated but could not be saved. Please retry." }, { status: 500 });
    }
    return NextResponse.json({ explanation, cached: false });
  } catch (error) {
    console.error("Single question AI explanation failed", error);
    return NextResponse.json({ error: "Could not generate the explanation. Please try again." }, { status: 502 });
  }
}
