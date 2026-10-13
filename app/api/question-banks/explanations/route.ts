import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 120;

async function getStudent(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\\s+/i, "").trim();
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
  if (!key) return NextResponse.json({ error: "AI explanations are not configured on the server." }, { status: 503 });
  try {
    const body = await request.json();
    const bankId = String(body.bank_id || "");
    const answers = body.answers;
    if (!/^[0-9a-f-]{36}$/i.test(bankId) || !Array.isArray(answers) || answers.length > 100) {
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
        return NextResponse.json({ error: "A submitted answer is invalid." }, { status: 400 });
      }
      submitted.set(id, answer);
    }
    const { data: questions, error } = await ctx.db.from("mpsc_ai_question_bank_items")
      .select("id,question_order,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,source_reference")
      .eq("bank_id", bankId).order("question_order");
    if (error || !questions?.length || submitted.size !== questions.length || questions.some(q => !submitted.has(String(q.id)))) {
      return NextResponse.json({ error: "Submit the complete test before generating explanations." }, { status: 400 });
    }
    const items = questions.map(q => ({
      question_id: q.id, number: q.question_order, question: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      correct_answer: q.correct_answer, selected_answer: submitted.get(String(q.id)),
      original_explanation: q.explanation, source_reference: q.source_reference, difficulty: q.difficulty
    }));
    const schema = {
      type: "OBJECT",
      properties: {
        explanations: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question_id: { type: "STRING" },
              concept: { type: "STRING" },
              detailed_explanation: { type: "STRING" },
              option_analysis: { type: "OBJECT", properties: { A: { type: "STRING" }, B: { type: "STRING" }, C: { type: "STRING" }, D: { type: "STRING" } }, required: ["A", "B", "C", "D"] },
              example: { type: "STRING" },
              exam_takeaways: { type: "ARRAY", items: { type: "STRING" } },
              memory_aid: { type: "STRING" },
              caution: { type: "STRING" }
            },
            required: ["question_id", "concept", "detailed_explanation", "option_analysis", "example", "exam_takeaways", "memory_aid", "caution"]
          }
        }
      },
      required: ["explanations"]
    };
    const prompt = `You are an expert Indian Constitution, history, geography, economy, science and MPSC/UPSC exam educator. Generate accurate, genuinely in-depth post-test learning explanations for every MCQ below. Respond in ${bank.language}; use clear, student-friendly language and explain technical terms. Exam: ${bank.exam}; subject: ${bank.subject}; topic: ${bank.topic || "as relevant"}.
For EACH question: explain the tested concept, explain why the correct answer is correct, analyse EVERY option A-D individually (including why distractors are wrong, and when an option is partly true explain the distinction), give a realistic example, provide 3-6 concise exam takeaways and a memory aid. Respect constitutional/legal wording and dates. Never invent article numbers, cases, citations or facts. Use supplied question and original explanation as context, but correct mistakes if clearly necessary. If uncertain or if wording is ambiguous, explicitly state the limitation in caution rather than guessing. Keep each explanation useful but not needlessly repetitive. question_id must exactly match input.
Question bank: ${bank.title}
MCQs JSON:
${JSON.stringify(items)}`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema } }),
      signal: AbortSignal.timeout(90000)
    });
    if (!response.ok) {
      console.error("MCQ explanation Gemini error", response.status, (await response.text()).slice(0, 300));
      return NextResponse.json({ error: response.status === 429 ? "AI is busy. Please try again shortly." : "AI could not generate explanations right now." }, { status: 502 });
    }
    const payload = await response.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text;
    if (!raw) throw new Error("Empty AI response");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.explanations)) throw new Error("Invalid AI response");
    const byId = new Map<string, unknown>(parsed.explanations.map((item: { question_id?: string }) => [String(item.question_id || ""), item]));
    const ordered = questions.map(q => byId.get(String(q.id)));
    if (ordered.some(item => !item)) throw new Error("AI did not explain every question");
    return NextResponse.json({ explanations: ordered });
  } catch (error) {
    console.error("Question bank in-depth explanation failed", error);
    return NextResponse.json({ error: "Could not generate complete explanations. Please try again." }, { status: 502 });
  }
}
