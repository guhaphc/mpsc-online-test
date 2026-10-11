import { NextRequest, NextResponse } from "next/server";
import { geminiJson, getStudentContext, safeFilename } from "../_lib";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const questionSchema = {
  type: "OBJECT",
  properties: {
    question_text: { type: "STRING" },
    model_answer: { type: "STRING" },
    evaluation_rubric: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          criterion: { type: "STRING" },
          max_points: { type: "NUMBER" },
          what_to_look_for: { type: "STRING" },
        },
        required: ["criterion", "max_points", "what_to_look_for"],
      },
    },
  },
  required: ["question_text", "model_answer", "evaluation_rubric"],
};

function safeQuestion(row: Record<string, unknown>) {
  return {
    id: row.id,
    subject: row.subject,
    question_text: row.question_text,
    marks: row.marks,
    word_limit: row.word_limit,
    source_filename: row.source_filename,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  const { data, error } = await context.adminClient
    .from("mpsc_student_custom_mains_questions")
    .select("id,subject,question_text,marks,word_limit,source_filename,status,created_at")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Could not load your questions." }, { status: 500 });
  return NextResponse.json({ questions: (data || []).map((row) => safeQuestion(row as Record<string, unknown>)) });
}

export async function POST(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  try {
    const form = await request.formData();
    const typedQuestion = String(form.get("question_text") || "").trim();
    const subject = String(form.get("subject") || "").trim().slice(0, 120) || null;
    const marks = Number(form.get("marks"));
    const wordLimitInput = String(form.get("word_limit") || "").trim();
    const wordLimit = wordLimitInput ? Number(wordLimitInput) : null;
    const file = form.get("question_file");
    const questionFile = file instanceof File && file.size > 0 ? file : null;

    if (!Number.isFinite(marks) || marks < 1 || marks > 100) {
      return NextResponse.json({ error: "Maximum marks must be between 1 and 100." }, { status: 400 });
    }
    if (wordLimit !== null && (!Number.isInteger(wordLimit) || wordLimit < 25 || wordLimit > 5000)) {
      return NextResponse.json({ error: "Word limit must be between 25 and 5000." }, { status: 400 });
    }
    if (!typedQuestion && !questionFile) {
      return NextResponse.json({ error: "Type a question or upload a PDF/image." }, { status: 400 });
    }
    if (typedQuestion.length > 15000) {
      return NextResponse.json({ error: "Question text is too long (maximum 15,000 characters)." }, { status: 400 });
    }
    if (questionFile && (!ALLOWED_TYPES.has(questionFile.type) || questionFile.size > MAX_FILE_BYTES)) {
      return NextResponse.json({ error: "Upload a PDF, JPG, PNG, or WebP file up to 8 MB." }, { status: 400 });
    }

    const attachments: Array<{ mimeType: string; data: string }> = [];
    if (questionFile) {
      attachments.push({
        mimeType: questionFile.type,
        data: Buffer.from(await questionFile.arrayBuffer()).toString("base64"),
      });
    }

    const prompt = `You are an expert UPSC/MPSC civil-services Mains question analyst, answer writer, and examiner.
The student supplied ${typedQuestion ? "typed question text" : "a question document/image"}.
${typedQuestion ? `QUESTION TEXT:\n${typedQuestion}\n` : ""}
${questionFile ? "Read the question from the attached file. If it contains multiple questions, use the first complete question only. Transcribe the selected question faithfully." : ""}
Create one exam-ready model answer and a detailed marking rubric for a question worth ${marks} marks. Subject: ${subject || "infer from question"}. Word limit: ${wordLimit || "not specified"}.
Return JSON with:
- question_text: the final clean question text
- model_answer: a balanced, factually careful answer appropriate for UPSC/MPSC Mains, respecting the word limit where specified
- evaluation_rubric: 5 to 8 distinct criteria; each criterion has criterion, max_points, and what_to_look_for. max_points must be positive and the total of all max_points must equal exactly ${marks}.
The rubric must be question-specific, avoid double-counting, and reward relevance, factual accuracy, analysis, structure and examples only where relevant. Do not include hidden answer/rubric in any other fields. If text is unreadable or no question can be found, return an empty question_text.`;

    const generated = await geminiJson(prompt, attachments, questionSchema) as {
      question_text?: unknown;
      model_answer?: unknown;
      evaluation_rubric?: unknown;
    };

    const questionText = String(generated.question_text || "").trim();
    const modelAnswer = String(generated.model_answer || "").trim();
    const rawRubric = Array.isArray(generated.evaluation_rubric) ? generated.evaluation_rubric : [];

    if (!questionText || !modelAnswer || rawRubric.length < 2) {
      return NextResponse.json({ error: "Could not read a complete question and prepare its marking guide. Try a clearer file or type the question." }, { status: 422 });
    }

    const rubric = rawRubric
      .map((item: unknown) => {
        const value = item as Record<string, unknown>;
        return {
          criterion: String(value.criterion || "").trim().slice(0, 160),
          max_points: Number(value.max_points),
          what_to_look_for: String(value.what_to_look_for || "").trim().slice(0, 1200),
        };
      })
      .filter((item: { criterion: string; max_points: number; what_to_look_for: string }) =>
        item.criterion && item.what_to_look_for && Number.isFinite(item.max_points) && item.max_points > 0,
      )
      .slice(0, 10);

    if (rubric.length < 2) {
      return NextResponse.json({ error: "The AI could not prepare a valid marking rubric. Please try again." }, { status: 422 });
    }

    // Normalize AI-proposed points to the question's maximum so the saved rubric always totals exactly max marks.
    const rawTotal = rubric.reduce((sum: number, item: { max_points: number }) => sum + item.max_points, 0);
    let assignedCents = 0;
    const targetCents = marks * 100;
    const normalizedRubric = rubric.map((item: { criterion: string; max_points: number; what_to_look_for: string }, index: number) => {
      const pointsCents = index === rubric.length - 1
        ? targetCents - assignedCents
        : Math.floor((item.max_points / rawTotal) * targetCents);
      assignedCents += pointsCents;
      return { ...item, max_points: pointsCents / 100 };
    });

    if (normalizedRubric.some((item: { max_points: number }) => item.max_points <= 0)) {
      return NextResponse.json({ error: "The AI produced an unusable marking rubric. Please try again." }, { status: 422 });
    }

    const { data: saved, error: saveError } = await context.adminClient
      .from("mpsc_student_custom_mains_questions")
      .insert({
        user_id: context.user.id,
        subject,
        question_text: questionText,
        marks,
        word_limit: wordLimit,
        source_filename: questionFile ? safeFilename(questionFile.name) : null,
        model_answer: modelAnswer,
        evaluation_rubric: normalizedRubric,
        status: "active",
      })
      .select("id,subject,question_text,marks,word_limit,source_filename,status,created_at")
      .single();

    if (saveError || !saved) {
      console.error("Custom Mains question save failed:", saveError?.message);
      return NextResponse.json({ error: "Could not save your question securely." }, { status: 500 });
    }

    // Deliberately return only safe question metadata. The model answer and rubric remain server-only.
    return NextResponse.json({ question: safeQuestion(saved as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error("Custom Mains question creation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create your question." }, { status: 500 });
  }
}
