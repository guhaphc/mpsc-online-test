import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-5.4-mini";
const GENERATION_UNAVAILABLE = "Question generation is temporarily unavailable. Please try again in a few minutes.";

type RequestBody = { stage: string; paper: string; subject: string; topic?: string; count: number; difficulty: string; language: string; instructions?: string; referenceText?: string; marks: number; singleQuestion?: boolean };
type OpenAIResponse = { output_text?: string; status?: string; incomplete_details?: { reason?: string }; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
type OpenAIErrorResponse = { error?: { type?: string; code?: string } };

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

function outputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
}

function openAIDiagnostics(response: Response, providerError?: OpenAIErrorResponse) {
  return {
    status: response.status,
    errorType: providerError?.error?.type ?? null,
    errorCode: providerError?.error?.code ?? null,
    providerRequestId: response.headers.get("x-request-id"),
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin authorization is required." }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("AI mock-test generation is not configured", { requestId, hasOpenAIKey: false });
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
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MOCK_TEST_MODEL || DEFAULT_MODEL,
        store: false,
        // A structured MCQ and explanation commonly needs more than the API's
        // small default output budget, even for the smallest ten-question test.
        max_output_tokens: Math.min(questionCount * 500, 75_000),
        input: [
          { role: "developer", content: "You generate reliable examination questions. Follow the supplied JSON schema exactly." },
          { role: "user", content: prompt },
        ],
        text: { format: { type: "json_schema", name: "mock_test_questions", strict: true, schema: questionSchema } },
      }),
    });
  } catch (error) {
    console.error("OpenAI mock-test request failed before receiving a response", {
      requestId,
      status: null,
      errorType: error instanceof Error ? error.name : "unknown",
      errorCode: null,
      providerRequestId: null,
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
  }

  if (!response.ok) {
    const providerError = await response.json().catch(() => null) as OpenAIErrorResponse | null;
    console.error("OpenAI mock-test request was rejected", {
      requestId,
      ...openAIDiagnostics(response, providerError ?? undefined),
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
  }

  try {
    const data = await response.json() as OpenAIResponse;
    const text = outputText(data);
    if (data.status === "incomplete") {
      console.error("OpenAI mock-test response was incomplete", {
        requestId,
        ...openAIDiagnostics(response),
        incompleteReason: data.incomplete_details?.reason ?? null,
      });
      return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 503 });
    }
    const parsed = JSON.parse(text || "{}") as { questions?: unknown[] };
    if (!Array.isArray(parsed.questions)) throw new Error("OpenAI response did not include a questions array.");
    return NextResponse.json({ questions: parsed.questions });
  } catch (error) {
    console.error("OpenAI mock-test response could not be parsed", {
      requestId,
      ...openAIDiagnostics(response),
      errorType: error instanceof Error ? error.name : "unknown",
      errorCode: null,
    });
    return NextResponse.json({ error: GENERATION_UNAVAILABLE }, { status: 502 });
  }
}
