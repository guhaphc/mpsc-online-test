import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.1-flash-lite";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const geminiApiKey =
  process.env.GEMINI_API_KEY!;

const questionSchema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question_text: {
            type: "STRING",
          },
          marks: {
            type: "NUMBER",
          },
          word_limit: {
            type: "NUMBER",
          },
          key_points: {
            type: "ARRAY",
            items: {
              type: "STRING",
            },
          },
        },
        required: [
          "question_text",
          "marks",
          "word_limit",
          "key_points",
        ],
      },
    },
  },
  required: ["questions"],
};

function getSupabaseClient(
  accessToken: string
) {
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    }
  );
}

async function requireAdmin(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const accessToken =
    authorization.slice("Bearer ".length);

  const supabase =
    getSupabaseClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "Invalid authentication session."
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("mpsc_profiles")
      .select("role, access_status")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (
    profile?.role !== "admin" ||
    profile?.access_status !== "approved"
  ) {
    throw new Error("Admin access required.");
  }

  return {
    user,
    supabase,
  };
}
function buildPrompt(input: {
  stage: string;
  paper: string;
  subject: string;
  topic: string;
  count: number;
  marks: number;
  wordLimit: number;
  difficulty: string;
  language: string;
  instructions: string;
  referenceText: string;
  referenceName: string;
}) {
  return `
You are an expert UPSC and MPSC Civil Services Main Examination question setter.

Create high-quality descriptive Main Examination questions strictly based on the supplied examination context.

EXAMINATION STAGE:
${input.stage}

PAPER:
${input.paper}

SUBJECT:
${input.subject}

SYLLABUS TOPIC:
${input.topic}

NUMBER OF QUESTIONS:
${input.count}

MARKS PER QUESTION:
${input.marks}

EXPECTED WORD LIMIT:
${input.wordLimit}

DIFFICULTY:
${input.difficulty}

LANGUAGE:
${input.language}

ADDITIONAL INSTRUCTIONS:
${input.instructions || "None"}

REFERENCE NAME:
${input.referenceName || "None"}

REFERENCE MATERIAL:
${input.referenceText || "None"}

QUESTION-SETTING REQUIREMENTS:

1. Questions must be suitable for UPSC/MPSC Main Examination descriptive writing.

2. Questions must test understanding, analysis, application,
   critical thinking and multidimensional reasoning rather than
   simple factual recall.

3. Use appropriate directive words such as:
   Discuss, Examine, Analyse, Critically examine, Evaluate,
   Explain, Elucidate, Comment, Assess or appropriate equivalents.

4. Questions must remain directly connected to the selected
   syllabus topic.

5. Avoid vague, excessively broad or trivial questions.

6. Avoid questions whose answer depends on an unsupported
   current fact.

7. Where appropriate, questions may require:
   - constitutional dimensions
   - historical context
   - social dimensions
   - economic dimensions
   - political/institutional dimensions
   - administrative dimensions
   - ethical dimensions
   - environmental dimensions
   - technological dimensions
   - Maharashtra-specific relevance
   - examples and contemporary applications

8. Do not unnecessarily combine unrelated syllabus topics.

9. Each question must be independently answerable.

10. Do not provide the model answer here.
    Only generate the question and useful key points.

11. Do not invent statistics, quotations, constitutional
    provisions or historical facts.

12. If reference material is supplied, use it as supporting
    context but do not copy long passages from it.

13. Generate questions in the requested language.

Return ONLY valid JSON matching the requested schema.

The JSON must contain:
{
  "questions": [
    {
      "question_text": "...",
      "marks": ${input.marks},
      "word_limit": ${input.wordLimit},
      "key_points": [
        "...",
        "...",
        "..."
      ]
    }
  ]
}

The key_points should contain the major dimensions or concepts
that a good answer should address. They are NOT the model answer.
`;
}

async function generateWithGemini(
  prompt: string
) {
  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType:
          "application/json",
        responseSchema:
          questionSchema,
      },
    }),
  });

  const result =
    (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
      error?: {
        message?: string;
        status?: string;
      };
    };

  if (!response.ok) {
    throw new Error(
      result.error?.message ||
        `Gemini request failed with status ${response.status}.`
    );
  }

  const text =
    result.candidates?.[0]?.content?.parts?.[0]
      ?.text;

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  try {
    return JSON.parse(text) as {
      questions?: unknown;
    };
  } catch {
    throw new Error(
      "Gemini returned invalid JSON."
    );
  }
}
export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin(request);

    const body = (await request.json()) as {
      stage?: string;
      paper?: string;
      subject?: string;
      topic?: string;
      count?: number;
      marks?: number;
      wordLimit?: number;
      difficulty?: string;
      language?: string;
      instructions?: string;
      referenceText?: string;
      referenceName?: string;
    };

    const stage =
      String(body.stage || "").trim();

    const paper =
      String(body.paper || "").trim();

    const subject =
      String(body.subject || "").trim();

    const topic =
      String(body.topic || "").trim();

    const count = Number(body.count);

    const marks = Number(body.marks);

    const wordLimit =
      Number(body.wordLimit);

    const difficulty =
      String(
        body.difficulty || "Mixed"
      ).trim();

    const language =
      String(
        body.language || "English"
      ).trim();

    const instructions =
      String(
        body.instructions || ""
      ).trim();

    const referenceText =
      String(
        body.referenceText || ""
      ).trim();

    const referenceName =
      String(
        body.referenceName || ""
      ).trim();

    if (!stage) {
      return NextResponse.json(
        {
          error:
            "Examination stage is required.",
        },
        { status: 400 }
      );
    }

    if (!paper) {
      return NextResponse.json(
        {
          error: "Paper is required.",
        },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          error: "Subject is required.",
        },
        { status: 400 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        {
          error: "Syllabus topic is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(count) ||
      count < 1 ||
      count > 20
    ) {
      return NextResponse.json(
        {
          error:
            "Question count must be between 1 and 20.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(marks) ||
      marks <= 0 ||
      marks > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Marks must be between 1 and 100.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(wordLimit) ||
      wordLimit < 50 ||
      wordLimit > 2000
    ) {
      return NextResponse.json(
        {
          error:
            "Word limit must be between 50 and 2000.",
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({
      stage,
      paper,
      subject,
      topic,
      count,
      marks,
      wordLimit,
      difficulty,
      language,
      instructions,
      referenceText:
        referenceText.slice(0, 30000),
      referenceName,
    });

    const generated =
      await generateWithGemini(prompt);

    if (
      !generated ||
      !Array.isArray(
        generated.questions
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini returned an invalid question structure.",
        },
        { status: 502 }
      );
    }

    const questions =
      generated.questions
        .map((value) => {
          const item =
            value as Record<
              string,
              unknown
            >;

          return {
            question_text:
              String(
                item.question_text || ""
              ).trim(),

            marks:
              Number(item.marks) || marks,

            word_limit:
              Number(item.word_limit) ||
              wordLimit,

            key_points:
              Array.isArray(
                item.key_points
              )
                ? item.key_points
                    .map((point) =>
                      String(point).trim()
                    )
                    .filter(Boolean)
                : [],
          };
        })
        .filter(
          (question) =>
            question.question_text.length > 0
        )
        .slice(0, count);

    if (!questions.length) {
      return NextResponse.json(
        {
          error:
            "No valid Mains questions were generated.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      questions,
    });
  } catch (error) {
    console.error(
      "Mains question generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mains question generation failed.",
      },
      { status: 500 }
    );
  }
}
