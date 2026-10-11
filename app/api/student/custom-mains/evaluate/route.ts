import { NextRequest, NextResponse } from "next/server";
import { countWords, geminiJson, getStudentContext } from "../_lib";

export const runtime = "nodejs";
export const maxDuration = 60;

const evaluationSchema = {
  type: "OBJECT",
  properties: {
    evaluation_confidence: { type: "NUMBER" },
    criteria_scores: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          criterion: { type: "STRING" },
          awarded_points: { type: "NUMBER" },
          feedback: { type: "STRING" },
        },
        required: ["criterion", "awarded_points", "feedback"],
      },
    },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    missing_points: { type: "ARRAY", items: { type: "STRING" } },
    factual_errors: { type: "ARRAY", items: { type: "STRING" } },
    feedback: { type: "STRING" },
    answer_framework: { type: "STRING" },
    improved_answer: { type: "STRING" },
  },
  required: ["evaluation_confidence", "criteria_scores", "strengths", "missing_points", "factual_errors", "feedback", "answer_framework", "improved_answer"],
};

export async function POST(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  try {
    const body = await request.json();
    const submissionId = String(body.submission_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
      return NextResponse.json({ error: "A valid submission ID is required." }, { status: 400 });
    }

    const { data: submission, error: submissionError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .select("id,user_id,custom_question_id,answer_text,word_count,status")
      .eq("id", submissionId)
      .eq("user_id", context.user.id)
      .single();

    if (submissionError || !submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (submission.status === "evaluated") {
      const { data: existing } = await context.adminClient
        .from("mpsc_student_custom_mains_submissions")
        .select("evaluation")
        .eq("id", submissionId)
        .eq("user_id", context.user.id)
        .single();
      if (existing?.evaluation) return NextResponse.json({ evaluation: existing.evaluation, already_evaluated: true });
    }

    const answerText = String(submission.answer_text || "").trim();
    if (!answerText) return NextResponse.json({ error: "Submit a readable answer before evaluation." }, { status: 400 });

    const { data: question, error: questionError } = await context.adminClient
      .from("mpsc_student_custom_mains_questions")
      .select("id,question_text,marks,word_limit,model_answer,evaluation_rubric")
      .eq("id", submission.custom_question_id)
      .eq("user_id", context.user.id)
      .single();

    if (questionError || !question) return NextResponse.json({ error: "Question or saved marking guide not found." }, { status: 404 });

    const rubric = Array.isArray(question.evaluation_rubric) ? question.evaluation_rubric as Array<{ criterion: string; max_points: number; what_to_look_for: string }> : [];
    if (!rubric.length || !question.model_answer) {
      return NextResponse.json({ error: "The saved marking guide is incomplete. Please contact support." }, { status: 500 });
    }

    const rubricText = rubric.map((item, index) =>
      `${index + 1}. ${item.criterion} (maximum ${item.max_points} marks): ${item.what_to_look_for}`,
    ).join("\n");

    const prompt = `You are a strict but constructive UPSC/MPSC Mains examiner.
Evaluate the student's answer against the exact question and the PRE-EXISTING marking rubric below. The rubric and model answer were generated and saved BEFORE the student submitted this answer. Do not invent a new rubric, change the criteria, or reward points outside the saved rubric.

QUESTION:
${question.question_text}

MAXIMUM MARKS: ${question.marks}
WORD LIMIT: ${question.word_limit || "Not specified"}

SAVED MARKING RUBRIC (follow exactly):
${rubricText}

SAVED MODEL ANSWER (private reference for evaluation; do not reproduce it verbatim):
${question.model_answer}

STUDENT ANSWER:
${answerText}

For each saved rubric criterion, return exactly one criteria_scores entry with the exact criterion name and awarded_points from 0 through that criterion's maximum. Add criterion-specific feedback explaining the score. Do not add criteria not in the saved rubric. Award marks only for points the student actually makes. Avoid double counting. Flag factual errors only if clearly incorrect or materially misleading. Provide strengths, missing points, factual errors, practical overall feedback, an answer framework, and an original improved answer within the word limit where practical. The server calculates final marks from the criterion points, so do not try to set a desired total. Return only JSON.`;

    const generated = await geminiJson(prompt, [], evaluationSchema) as Record<string, unknown>;
    const rawScores = Array.isArray(generated.criteria_scores) ? generated.criteria_scores as Array<Record<string, unknown>> : [];

    const scores = rubric.map((criterion) => {
      const matched = rawScores.find((item) => String(item.criterion || "").trim().toLocaleLowerCase() === criterion.criterion.trim().toLocaleLowerCase());
      const rawPoints = Number(matched?.awarded_points);
      const awarded = Number.isFinite(rawPoints) ? Math.max(0, Math.min(Number(criterion.max_points), rawPoints)) : 0;
      return {
        criterion: criterion.criterion,
        awarded_points: Math.round(awarded * 100) / 100,
        max_points: Number(criterion.max_points),
        feedback: String(matched?.feedback || "No criterion-specific feedback was returned."),
      };
    });

    const totalMarks = Math.round(scores.reduce((sum, item) => sum + item.awarded_points, 0) * 100) / 100;
    const confidence = Math.max(0, Math.min(1, Number(generated.evaluation_confidence) || 0));
    const evaluation = {
      awarded_marks: Math.min(Number(question.marks), totalMarks),
      max_marks: Number(question.marks),
      evaluation_confidence: confidence,
      word_count: countWords(answerText),
      word_limit: question.word_limit || null,
      criteria_scores: scores,
      strengths: Array.isArray(generated.strengths) ? generated.strengths.map(String).slice(0, 12) : [],
      missing_points: Array.isArray(generated.missing_points) ? generated.missing_points.map(String).slice(0, 15) : [],
      factual_errors: Array.isArray(generated.factual_errors) ? generated.factual_errors.map(String).slice(0, 15) : [],
      feedback: String(generated.feedback || ""),
      answer_framework: String(generated.answer_framework || ""),
      improved_answer: String(generated.improved_answer || ""),
      evaluated_at: new Date().toISOString(),
    };

    const { error: saveError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .update({ status: "evaluated", evaluation, updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .eq("user_id", context.user.id);

    if (saveError) {
      console.error("Custom Mains evaluation save failed:", saveError.message);
      return NextResponse.json({ error: "Evaluation was generated but could not be saved." }, { status: 500 });
    }

    // Only the student-facing evaluation is returned. Saved model_answer and evaluation_rubric are never sent to the browser.
    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("Custom Mains evaluation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not evaluate this answer." }, { status: 500 });
  }
}
