import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.1-flash-lite";

const CRITERION_NAMES = [
  "relevance",
  "content",
  "analysis",
  "structure",
  "examples",
  "conclusion"
] as const;

type CriterionName = (typeof CRITERION_NAMES)[number];

type CriteriaScores = Record<CriterionName, number>;

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
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
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

    if (
      typeof questionText !== "string" ||
      !questionText.trim() ||
      typeof answerText !== "string" ||
      !answerText.trim()
    ) {
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
You are an expert UPSC/MPSC Mains descriptive-answer evaluator.

Evaluate the student's answer strictly against the question and the
standards expected in a competitive civil-services examination.

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

EVALUATION CRITERIA:

Evaluate these six criteria separately:

1. relevance
   How directly and accurately the answer addresses the question.

2. content
   Factual accuracy, conceptual understanding, and completeness.

3. analysis
   Depth of reasoning, explanation, critical analysis, and coverage
   of relevant dimensions.

4. structure
   Organization, logical flow, introduction, body, and conclusion.

5. examples
   Relevant examples, facts, data, constitutional provisions,
   case laws, schemes, and institutional references where applicable.

6. conclusion
   Quality, relevance, balance, and completeness of the conclusion.

CRITERION SCORING RULES:

- Score each of the six criteria on a scale from 0 to 10.
- Use whole numbers or decimal values.
- 0 means the criterion is completely absent or incorrect.
- 5 means an average or partially satisfactory performance.
- 10 means excellent performance for that criterion.
- Use intermediate scores when appropriate.
- Do not award high marks merely because the answer is lengthy.
- Evaluate the actual answer, not what the student might have intended.
- Apply the same standards consistently across all six criteria.

FINAL MARKS CALCULATION:

The server will calculate the final awarded marks from the six criterion
scores. Therefore, your awarded_marks field is informational only and
will not override the server-calculated result.

The server calculation is:

1. Add the six criterion scores.
2. Divide the sum by 60 to obtain the proportion of marks earned.
3. Multiply that proportion by the maximum marks for the question.
4. Round the final result to two decimal places.

For example, if the six criterion scores are:
relevance = 8
content = 7
analysis = 6
structure = 8
examples = 7
conclusion = 8

Their total is 44 out of 60.

For a question worth 10 marks, the final awarded marks will be:
(44 / 60) * 10 = 7.33 marks.

Do not manipulate criterion scores to produce a desired total.
Score every criterion honestly and independently.

ADDITIONAL EVALUATION RULES:

- Consider factual accuracy, depth, analysis, structure, examples,
  introduction, body, conclusion, and adherence to the word limit.
- Do not invent factual errors.
- Report an error only when a statement is clearly incorrect or
  materially misleading.
- Do not award marks merely because the answer is lengthy.
- Give specific, practical feedback that helps the student improve.
- Identify important missing points that are relevant to the question.
- The improved answer must be an original, exam-ready answer, not a
  copy of the supplied reference answer.
- Keep feedback relevant to UPSC/MPSC descriptive-answer standards.

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
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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

    /*
     * SCORING FIX
     *
     * Normalize all six criterion scores to the 0–10 scale.
     * Invalid, missing, or non-numeric criterion values become zero.
     * Calculate final marks from these normalized scores rather than
     * trusting the independent awarded_marks value generated by AI.
     */

    const rawCriteria = evaluation.criteria_scores || {};

    const criteriaScores = Object.fromEntries(
      CRITERION_NAMES.map((name) => {
        const rawScore = Number(rawCriteria[name]);

        const score = Number.isFinite(rawScore)
          ? Math.max(0, Math.min(10, rawScore))
          : 0;

        return [name, Math.round(score * 10) / 10];
      })
    ) as CriteriaScores;

    const totalCriteriaScore = CRITERION_NAMES.reduce(
      (total, name) => total + criteriaScores[name],
      0
    );

    const awardedMarks = Math.round(
      (totalCriteriaScore / 60) * maxMarks * 100
    ) / 100;

    const confidence = Math.max(
      0,
      Math.min(
        1,
        Number(evaluation.evaluation_confidence) || 0
      )
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

    if (
      Number(submission.mains_question_id) !== Number(questionId)
    ) {
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
        criteria_scores: criteriaScores,
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
