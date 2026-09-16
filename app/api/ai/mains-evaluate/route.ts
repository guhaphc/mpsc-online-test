import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.1-flash-lite";

const evaluationSchema = {
  type: "object",
  properties: {
    awarded_marks: { type: "number" },
    evaluation_confidence: { type: "number" },
    criteria_scores: {
      type: "object",
      properties: {
        relevance: { type: "number" },
        content: { type: "number" },
        analysis: { type: "number" },
        structure: { type: "number" },
        examples: { type: "number" },
        conclusion: { type: "number" }
      },
      required: [
        "relevance",
        "content",
        "analysis",
        "structure",
        "examples",
        "conclusion"
      ]
    },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
    missing_points: {
      type: "array",
      items: { type: "string" }
    },
    factual_errors: {
      type: "array",
      items: { type: "string" }
    },
    feedback: { type: "string" },
    answer_framework: { type: "string" },
    improved_answer: { type: "string" }
  },
  required: [
    "awarded_marks",
    "evaluation_confidence",
    "criteria_scores",
    "strengths",
    "missing_points",
    "factual_errors",
    "feedback",
    "answer_framework",
    "improved_answer"
  ]
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      submissionId,
      questionId,
      questionText,
      answerText,
      marks,
      wordLimit,
      modelAnswer
    } = body;

    if (!submissionId || !questionId) {
      return NextResponse.json(
        { error: "submissionId and questionId are required." },
        { status: 400 }
      );
    }

    if (!questionText || !answerText) {
      return NextResponse.json(
        { error: "Question and answer text are required." },
        { status: 400 }
      );
    }

    const maxMarks = Number(marks);

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      return NextResponse.json(
        { error: "Invalid marks value." },
        { status: 400 }
      );
    }

    const wordCount = answerText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const prompt = `
You are an expert UPSC/MPSC Mains answer evaluator.

Evaluate the student's answer strictly against the question.
QUESTION:
${questionText}

MAXIMUM MARKS:
${maxMarks}

WORD LIMIT:
${wordLimit || "Not specified"}

STUDENT ANSWER:
${answerText}

MODEL ANSWER / REFERENCE ANSWER:
${modelAnswer || "No model answer supplied."}

Evaluate the answer as a real descriptive civil-services examination answer.

Consider:
1. Relevance to the exact question
2. Factual accuracy
3. Depth and quality of content
4. Analysis and multiple dimensions
5. Structure and logical flow
6. Examples, facts and constitutional/institutional references where relevant
7. Introduction
8. Body
9. Conclusion
10. Adherence to the word limit

The awarded marks MUST NOT exceed the maximum marks.

Do not award marks merely because the answer is lengthy.

Do not invent factual errors. Mention an error only when the student's statement is clearly incorrect or materially misleading.

Give practical feedback that helps the student improve.

The improved answer should be an original exam-ready answer, not a copy of any supplied reference.

Return ONLY the requested JSON structure.
`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
     https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: evaluationSchema
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "Gemini evaluation request failed.",
          details: errorText
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    const generatedText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: "Gemini returned no evaluation." },
        { status: 502 }
      );
    }

    const evaluation = JSON.parse(generatedText);

    const awardedMarks = Math.max(
      0,
      Math.min(maxMarks, Number(evaluation.awarded_marks) || 0)
    );

    const confidence = Math.max(
      0,
      Math.min(1, Number(evaluation.evaluation_confidence) || 0)
    );

    const { data: submission, error: submissionError } =
      await supabase
        .from("mpsc_mains_answer_submissions")
        .select("id,user_id,mains_question_id")
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Answer submission not found." },
        { status: 404 }
      );
    }

    if (Number(submission.mains_question_id) !== Number(questionId)) {
      return NextResponse.json(
        { error: "Question does not match the submission." },
        { status: 400 }
      );
    }

    const { error: saveError } = await supabase
      .from("mpsc_mains_answer_submissions")
      .update({
        status: "evaluated",
        updated_at: new Date().toISOString()
      })
      .eq("id", submissionId)
      .eq("user_id", user.id);

    if (saveError) {
      return NextResponse.json(
        { error: saveError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      evaluation: {
        awarded_marks: awardedMarks,
        max_marks: maxMarks,
        evaluation_confidence: confidence,
        word_count: wordCount,
        word_limit: wordLimit || null,
        criteria_scores: evaluation.criteria_scores || {},
        strengths: evaluation.strengths || [],
        missing_points: evaluation.missing_points || [],
        factual_errors: evaluation.factual_errors || [],
        feedback: evaluation.feedback || "",
        answer_framework: evaluation.answer_framework || "",
        improved_answer: evaluation.improved_answer || ""
      }
    });
  } catch (error) {
    console.error("Mains evaluation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected evaluation error."
      },
      { status: 500 }
    );
  }
}
