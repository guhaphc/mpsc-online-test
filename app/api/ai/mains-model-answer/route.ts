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

const answerSchema = {
  type: "OBJECT",
  properties: {
    model_answer: {
      type: "STRING",
    },
    answer_framework: {
      type: "STRING",
    },
    key_points: {
      type: "ARRAY",
      items: {
        type: "STRING",
      },
    },
  },
  required: [
    "model_answer",
    "answer_framework",
    "key_points",
  ],
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
function buildAnswerPrompt(input: {
  question: string;
  marks: number;
  wordLimit: number;
  stage: string;
  paper: string;
  subject: string;
  topic: string;
  language: string;
  difficulty: string;
  instructions: string;
  referenceText: string;
  referenceName: string;
}) {
  return `
You are an expert UPSC and MPSC Civil Services Main Examination
answer-writing evaluator and model-answer writer.

Prepare a high-quality model answer for the following descriptive
Main Examination question.

EXAMINATION STAGE:
${input.stage}

PAPER:
${input.paper}

SUBJECT:
${input.subject}

SYLLABUS TOPIC:
${input.topic}

QUESTION:
${input.question}

MARKS:
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

MODEL ANSWER REQUIREMENTS:

1. Write an exam-ready answer appropriate for UPSC/MPSC Main
   Examination.

2. Respect the requested word limit of approximately ${
    input.wordLimit
  } words.

3. Directly answer the question and address the directive word.
   For example, "Discuss", "Examine", "Analyse", "Evaluate",
   "Critically examine" and similar directives require different
   levels of analysis.

4. Use a clear structure where appropriate:
   - Introduction
   - Body
   - Way Forward / Suggestions
   - Conclusion

5. The introduction should directly establish the context of
   the question.

6. The body should contain multiple relevant dimensions when
   appropriate, such as:
   - Historical
   - Constitutional
   - Political
   - Social
   - Economic
   - Administrative
   - Ethical
   - Environmental
   - Technological
   - Institutional

7. Use relevant examples wherever they genuinely strengthen
   the answer.

8. Include Maharashtra-specific examples or relevance when
   naturally connected to the question.

9. Do not add irrelevant information merely to increase length.

10. Maintain factual accuracy.

11. Do not invent statistics, constitutional provisions,
    committees, court judgments, quotations or historical facts.

12. Do not fabricate references.

13. If the supplied reference material contains useful information,
    incorporate it accurately.

14. Do not reproduce long copyrighted passages from the reference
    material. Summarize them in your own words.

15. The answer should demonstrate:
    - conceptual clarity
    - analytical thinking
    - balanced arguments
    - cause-effect relationships
    - examples
    - practical solutions where appropriate

16. The conclusion should be concise and directly connected to
    the question.

17. Generate the answer in the requested language.

Also provide:
- an answer framework explaining how a candidate should structure
  the answer
- important key points that should ideally appear in a good answer

Return ONLY valid JSON matching the requested schema.

The JSON must have exactly this conceptual structure:

{
  "model_answer": "...",
  "answer_framework": "...",
  "key_points": [
    "...",
    "...",
    "..."
  ]
}

The model_answer must be the actual answer that a candidate could
write in the examination.
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
        temperature: 0.6,
        responseMimeType:
          "application/json",
        responseSchema:
          answerSchema,
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
      model_answer?: unknown;
      answer_framework?: unknown;
      key_points?: unknown;
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
      question?: string;
      marks?: number;
      wordLimit?: number;
      stage?: string;
      paper?: string;
      subject?: string;
      topic?: string;
      language?: string;
      difficulty?: string;
      instructions?: string;
      referenceText?: string;
      referenceName?: string;
    };

    const question =
      String(body.question || "").trim();

    const marks = Number(body.marks);

    const wordLimit =
      Number(body.wordLimit);

    const stage =
      String(body.stage || "").trim();

    const paper =
      String(body.paper || "").trim();

    const subject =
      String(body.subject || "").trim();

    const topic =
      String(body.topic || "").trim();

    const language =
      String(
        body.language || "English"
      ).trim();

    const difficulty =
      String(
        body.difficulty || "Mixed"
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

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Question text is required.",
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

    const prompt =
      buildAnswerPrompt({
        question,
        marks,
        wordLimit,
        stage,
        paper,
        subject,
        topic,
        language,
        difficulty,
        instructions,
        referenceText:
          referenceText.slice(0, 30000),
        referenceName,
      });

    const generated =
      await generateWithGemini(prompt);

    const modelAnswer =
      String(
        generated.model_answer || ""
      ).trim();

    const answerFramework =
      String(
        generated.answer_framework || ""
      ).trim();

    const keyPoints =
      Array.isArray(
        generated.key_points
      )
        ? generated.key_points
            .map((point) =>
              String(point).trim()
            )
            .filter(Boolean)
        : [];

    if (!modelAnswer) {
      return NextResponse.json(
        {
          error:
            "Gemini did not return a model answer.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      model_answer: modelAnswer,
      answer_framework: answerFramework,
      key_points: keyPoints,
    });
  } catch (error) {
    console.error(
      "Mains model answer generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Model answer generation failed.",
      },
      { status: 500 }
    );
  }
}

