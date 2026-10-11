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

const auditSchema = {
  type: "OBJECT",
  properties: {
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
    audit_summary: { type: "STRING" },
  },
  required: ["criteria_scores", "audit_summary"],
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
    const wordCount = countWords(answerText);
    const wordLimit = Number(question.word_limit) > 0 ? Number(question.word_limit) : null;
    const wordLimitExceededBy = wordLimit ? Math.max(0, wordCount - wordLimit) : 0;
    const wordLimitOveragePercent = wordLimit && wordLimitExceededBy
      ? Math.round((wordLimitExceededBy / wordLimit) * 100)
      : 0;
    const wordLimitWarningLevel = !wordLimit || wordLimitExceededBy === 0
      ? "none"
      : wordLimitOveragePercent >= 20
        ? "strict"
        : "notice";
    const wordLimitWarning = wordLimitWarningLevel === "none"
      ? null
      : wordLimitWarningLevel === "strict"
        ? `Strict warning: your answer is ${wordCount} words against a ${wordLimit}-word limit (${wordLimitOveragePercent}% over). No marks have been deducted solely for exceeding the word limit. Practise writing a concise, focused answer within the prescribed limit.`
        : `Word-limit warning: your answer is ${wordCount} words against a ${wordLimit}-word limit (${wordLimitOveragePercent}% over). No marks have been deducted solely for exceeding the word limit. Aim to be more concise.`;

    const prompt = `You are a rigorous, fair UPSC/MPSC Civil Services Mains examiner. Award marks conservatively based on demonstrated answer quality, not answer length, confidence, or writing style alone.
Evaluate the student's answer against the exact question and the PRE-EXISTING marking rubric below. The rubric and model answer were generated and saved BEFORE the student submitted this answer. Do not invent a new rubric, change the criteria, or reward points outside the saved rubric.

STRICT CALIBRATION RULES:
- Award marks only for relevant, accurate points the student actually explains. Do not infer missing reasoning or give credit merely because a keyword appears.
- Full marks on a criterion are exceptional: the answer must satisfy nearly all of that criterion's expectations with accuracy, specificity, and depth.
- Give partial credit proportionately. A generic assertion is not equivalent to a supported explanation, example, or analysis.
- Missing analysis, weak structure, omissions, unsupported claims, repetition, factual errors, and irrelevant content should affect the relevant rubric criteria.
- If the answer is superficial or mostly descriptive when analysis is demanded, do not award high marks for analytical criteria.
- Irrelevant or seriously misguided answers should receive very low marks for relevance and for criteria they do not address. Do not award marks simply for writing many words.
- Do not apply a blanket 50% cap. Excellent answers can earn excellent marks; weak answers must not be inflated.
- Do not penalize the same flaw twice. Do not penalize the student for using a valid alternative argument or wording.
- Do not deduct any marks solely because the word limit was exceeded. Mention the word-limit issue in the feedback/warning only. If excess length causes repetition or irrelevant material, assess that material under the relevant rubric criterion without an extra word-limit penalty.
- Be factually careful. Flag a factual error only if it is clearly wrong or materially misleading; do not invent corrections.

QUESTION:
${question.question_text}

MAXIMUM MARKS: ${question.marks}
WORD LIMIT: ${wordLimit ?? "Not specified"}

SAVED MARKING RUBRIC (follow exactly):
${rubricText}

SAVED MODEL ANSWER (private reference; do not reproduce it verbatim):
${question.model_answer}

STUDENT ANSWER:
${answerText}

For each saved rubric criterion, return exactly one criteria_scores entry with the exact criterion name and awarded_points from 0 through that criterion's maximum. Add specific feedback explaining why the score was earned and what is missing. Do not add criteria not in the saved rubric. Avoid double counting. Provide strengths, missing points, factual errors, practical overall feedback, an answer framework, and an original improved answer within the word limit where practical. Be candid and specific, not artificially encouraging. The server calculates final marks from the criterion points. Return only JSON.`;

    const generated = await geminiJson(prompt, [], evaluationSchema) as Record<string, unknown>;
    const rawScores = Array.isArray(generated.criteria_scores) ? generated.criteria_scores as Array<Record<string, unknown>> : [];

    const initialScores = rubric.map((criterion) => {
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

    // Independent calibration pass: checks for unsupported generosity and scoring inconsistencies.
    const auditPrompt = `You are an independent senior UPSC/MPSC Mains examiner conducting a calibration audit of a first examiner's scores. Independently compare the question, saved rubric, student's actual answer, and initial scores below.
Do not automatically lower marks. Keep a score if it is justified. Correct scores only where the initial score is clearly too generous, too harsh, inconsistent with the rubric, or based on credit the student did not earn. No blanket 50% cap. Full marks should be rare and supported by a strong answer. Do not deduct marks solely for exceeding the word limit, and do not penalize a single flaw twice. Accept valid alternative arguments. Return exactly one score for each rubric criterion, using the exact criterion names, within each criterion's maximum. Feedback must briefly justify the final score.

QUESTION:
${question.question_text}
MAXIMUM MARKS: ${question.marks}
WORD LIMIT: ${wordLimit ?? "Not specified"}

SAVED RUBRIC:
${rubricText}

STUDENT ANSWER:
${answerText}

INITIAL SCORES:
${JSON.stringify(initialScores.map(({ criterion, awarded_points, max_points, feedback }) => ({ criterion, awarded_points, max_points, feedback })))}

Return only JSON with criteria_scores and audit_summary.`;
    let finalScores = initialScores;
    let auditSummary = "A second calibration pass was not available; the initial rubric-based scores are shown.";
    try {
      const audited = await geminiJson(auditPrompt, [], auditSchema) as Record<string, unknown>;
      const auditScores = Array.isArray(audited.criteria_scores) ? audited.criteria_scores as Array<Record<string, unknown>> : [];
      const completeAudit = rubric.every((criterion) =>
        auditScores.some((item) => String(item.criterion || "").trim().toLocaleLowerCase() === criterion.criterion.trim().toLocaleLowerCase()),
      );
      if (completeAudit) {
        finalScores = rubric.map((criterion) => {
          const matched = auditScores.find((item) => String(item.criterion || "").trim().toLocaleLowerCase() === criterion.criterion.trim().toLocaleLowerCase());
          const rawPoints = Number(matched?.awarded_points);
          const awarded = Number.isFinite(rawPoints) ? Math.max(0, Math.min(Number(criterion.max_points), rawPoints)) : 0;
          return {
            criterion: criterion.criterion,
            awarded_points: Math.round(awarded * 100) / 100,
            max_points: Number(criterion.max_points),
            feedback: String(matched?.feedback || "No audit feedback was returned."),
          };
        });
        auditSummary = String(audited.audit_summary || "Scores were checked in a second calibration pass.");
      }
    } catch (auditError) {
      // Keep the first complete evaluation if the optional independent audit fails.
      console.error("Custom Mains calibration audit failed:", auditError instanceof Error ? auditError.message : "Unknown audit error");
    }

    const totalMarks = Math.round(finalScores.reduce((sum, item) => sum + item.awarded_points, 0) * 100) / 100;
    const confidence = Math.max(0, Math.min(1, Number(generated.evaluation_confidence) || 0));
    const feedback = String(generated.feedback || "");
    const feedbackWithAudit = auditSummary ? `${feedback}\n\nScoring consistency check: ${auditSummary}` : feedback;
    const evaluation = {
      awarded_marks: Math.min(Number(question.marks), totalMarks),
      max_marks: Number(question.marks),
      evaluation_confidence: confidence,
      word_count: wordCount,
      word_limit: wordLimit,
      word_limit_exceeded_by: wordLimitExceededBy,
      word_limit_overage_percent: wordLimitOveragePercent,
      word_limit_warning_level: wordLimitWarningLevel,
      word_limit_warning: wordLimitWarning,
      criteria_scores: finalScores,
      strengths: Array.isArray(generated.strengths) ? generated.strengths.map(String).slice(0, 12) : [],
      missing_points: Array.isArray(generated.missing_points) ? generated.missing_points.map(String).slice(0, 15) : [],
      factual_errors: Array.isArray(generated.factual_errors) ? generated.factual_errors.map(String).slice(0, 15) : [],
      feedback: feedbackWithAudit,
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
