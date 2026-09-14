import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Gemini 2.5 Flash supports JSON schemas and is available on the Gemini API free tier.
const DEFAULT_MODEL = "gemini-2.5-flash";
const GENERATION_UNAVAILABLE = "Question generation is temporarily unavailable. Please try again in a few minutes.";

type RequestBody = { stage: string; paper: string; subject: string; topic?: string; count: number; difficulty: string; language: string; instructions?: string; referenceText?: string; marks: number; singleQuestion?: boolean };
type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
};
type GeminiErrorResponse = { error?: { code?: number; status?: string } };

const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation"],
        properties: {
          question_text: { type: "string" },
          option_a: { type: "string" },
          option_b: { type: "string" },
          option_c: { type: "string" },
          option_d: { type: "string" },
          correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;

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

function responseText(data: GeminiResponse) {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
}

function geminiDiagnostics(response: Response, providerError?: GeminiErrorResponse) {
  return {
    status: response.status,
    errorStatus: providerError?.error?.status ?? null,
    errorCode: providerError?.error?.code ?? null,
    providerRequestId: response.headers.get("x-request-id"),
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin authorization is required." }, { status: 403 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini mock-test generation is not configured", { requestId, hasGeminiKey: false });
    return NextResponse.json({ error: "Question generation is not configured. Contact an administrator." }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid mock-test request." }, { status: 400 });
  }

  if (!body.stage || !body.paper || !body.subject || ![10, 25, 50, 100, 150].includes(body.count) || !Number.isFinite(body.marks) || body.marks <= 0) return NextResponse.json({ error: "Invalid mock-test request." }, { status: 400 });

  const reference = body.referenceText?.trim();
  const sourceRule = reference ? `REFERENCE DOCUMENT (primary source; preserve terminology and do not contradict it):\n${reference.slice(0, 60000)}\nIf it is insufficient, use broader established syllabus knowledge and say so in the explanation where material is broader.` : "No reference was supplied; use established MPSC/UPSC-style knowledge only.";
  const questionCount = body.singleQuestion ? 1 : body.count;
  const prompt = `Create ${questionCount} high-quality competitive-exam MCQs. Scope is strictly Stage: ${body.stage}; Paper: ${body.paper}; Subject: ${body.subject}; Topic: ${body.topic || "entire subject"}. Difficulty: ${body.difficulty}. Write in ${body.language}. ${sourceRule}\n${body.instructions ? `Additional instructions: ${body.instructions}` : ""}\nReturn exactly ${questionCount} questions. Each question must have question_text, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation. Exactly four non-empty options and exactly one unambiguous correct answer. Avoid duplicates, unsupported claims, and material outside scope. Include a concise explanation.`;

  let response: Response;
  try {
    const model = process.env.GEMINI_MOCK_TEST_MODEL || DEFAULT_MODEL;
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You generate reliable examination questions. Follow the supplied JSON schema exactly." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: questionSchema,
          maxOutputTokens: Math.min(questionCount * 500, 65_536),
        },
      }),
    });
  } catch (error) {
    console.error("Gemini mock-test request failed before receiving a response", {
      requestId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
  }

  if (!response.ok) {
    const providerError = await response.json().catch(() => null) as GeminiErrorResponse | null;
    console.error("Gemini mock-test request was rejected", {
      requestId,
      ...geminiDiagnostics(response, providerError ?? undefined),
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
  }

  try {
    const data = await response.json() as GeminiResponse;
    const text = responseText(data);
    const finishReason = data.candidates?.[0]?.finishReason;
    if (!text || (finishReason && finishReason !== "STOP")) {
      console.error("Gemini mock-test response was incomplete", {
        requestId,
        ...geminiDiagnostics(response),
        finishReason: finishReason ?? null,
      });
      return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
    }
    const parsed = JSON.parse(text) as { questions?: unknown[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== questionCount) throw new Error("Gemini response did not include the requested questions array.");
    return NextResponse.json({ questions: parsed.questions });
  } catch (error) {
    console.error("Gemini mock-test response could not be parsed", {
      requestId,
      ...geminiDiagnostics(response),
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 502 });
  }
}
