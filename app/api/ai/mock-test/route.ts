import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = { stage: string; paper: string; subject: string; topic?: string; count: number; difficulty: string; language: string; instructions?: string; referenceText?: string; marks: number; singleQuestion?: boolean };

async function requireAdmin(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !key || !token) return false;
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  if (!userResponse.ok) return false;
  const user = await userResponse.json() as { id: string };
  const profile = await fetch(`${url}/rest/v1/mpsc_profiles?id=eq.${encodeURIComponent(user.id)}&select=role,access_status`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  if (!profile.ok) return false;
  const data = await profile.json() as Array<{ role: string; access_status: string }>;
  return data[0]?.role === "admin" && data[0]?.access_status === "approved";
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin authorization is required." }, { status: 403 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI generation is not configured. Set OPENAI_API_KEY on the server; no key is exposed to the browser." }, { status: 503 });
  const body = await request.json() as RequestBody;
  if (!body.stage || !body.paper || !body.subject || ![10, 25, 50, 100, 150].includes(body.count) || !Number.isFinite(body.marks) || body.marks <= 0) return NextResponse.json({ error: "Invalid mock-test request." }, { status: 400 });
  const reference = body.referenceText?.trim();
  const sourceRule = reference ? `REFERENCE DOCUMENT (primary source; preserve terminology and do not contradict it):\n${reference.slice(0, 60000)}\nIf it is insufficient, use broader established syllabus knowledge and say so in the explanation where material is broader.` : "No reference was supplied; use established MPSC/UPSC-style knowledge only.";
  const prompt = `Create ${body.singleQuestion ? 1 : body.count} high-quality competitive-exam MCQs. Scope is strictly Stage: ${body.stage}; Paper: ${body.paper}; Subject: ${body.subject}; Topic: ${body.topic || "entire subject"}. Difficulty: ${body.difficulty}. Write in ${body.language}. ${sourceRule}\n${body.instructions ? `Additional instructions: ${body.instructions}` : ""}\nReturn ONLY a JSON object {"questions":[...]}. Each question must have question_text, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation. Exactly four non-empty options and exactly one unambiguous correct answer. Avoid duplicates, unsupported claims, and material outside scope. Include a concise explanation.`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.OPENAI_MOCK_TEST_MODEL || "gpt-4o-mini", temperature: 0.35, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You generate reliable examination questions as strict JSON." }, { role: "user", content: prompt }] }) });
  if (!response.ok) return NextResponse.json({ error: "The AI provider could not generate this draft. Please try again." }, { status: 502 });
  try {
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}") as { questions?: unknown[] };
    return NextResponse.json({ questions: parsed.questions ?? [] });
  } catch { return NextResponse.json({ error: "The AI provider returned an unreadable response." }, { status: 502 }); }
}
