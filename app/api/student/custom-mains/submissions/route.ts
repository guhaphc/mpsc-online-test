import { NextRequest, NextResponse } from "next/server";
import { countWords, geminiJson, getStudentContext, safeFilename } from "../_lib";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "mpsc-student-custom-mains";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const ocrSchema = {
  type: "OBJECT",
  properties: {
    extracted_text: { type: "STRING" },
    confidence: { type: "NUMBER" },
  },
  required: ["extracted_text", "confidence"],
};

export async function GET(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  const { data, error } = await context.adminClient
    .from("mpsc_student_custom_mains_submissions")
    .select("id,custom_question_id,answer_type,answer_text,word_count,status,evaluation,created_at,updated_at")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Could not load your submissions." }, { status: 500 });
  return NextResponse.json({ submissions: data || [] });
}

export async function POST(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  let submissionId: string | null = null;
  const uploadedPaths: string[] = [];

  try {
    const form = await request.formData();
    const questionId = String(form.get("question_id") || "");
    const answerType = String(form.get("answer_type") || "");
    const answerText = String(form.get("answer_text") || "").trim();

    if (!/^[0-9a-f-]{36}$/i.test(questionId)) {
      return NextResponse.json({ error: "Select a valid question." }, { status: 400 });
    }
    if (answerType !== "typed" && answerType !== "handwritten") {
      return NextResponse.json({ error: "Choose typed or handwritten answer submission." }, { status: 400 });
    }

    const { data: question, error: questionError } = await context.adminClient
      .from("mpsc_student_custom_mains_questions")
      .select("id,marks,word_limit,status")
      .eq("id", questionId)
      .eq("user_id", context.user.id)
      .single();

    if (questionError || !question || question.status !== "ready") {
      return NextResponse.json({ error: "Question not found or unavailable." }, { status: 404 });
    }

    const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (answerType === "typed" && !answerText) {
      return NextResponse.json({ error: "Enter your answer before submitting." }, { status: 400 });
    }
    if (answerType === "handwritten" && files.length === 0) {
      return NextResponse.json({ error: "Upload at least one handwritten page or a PDF." }, { status: 400 });
    }
    if (answerText.length > 50000) {
      return NextResponse.json({ error: "Typed answer is too long." }, { status: 400 });
    }
    if (files.length > 12) {
      return NextResponse.json({ error: "Upload a maximum of 12 files/pages at a time." }, { status: 400 });
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "Each page must be a PDF, JPG, PNG, or WebP file up to 8 MB." }, { status: 400 });
      }
    }

    const { data: saved, error: saveError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .insert({
        custom_question_id: questionId,
        user_id: context.user.id,
        answer_type: answerType,
        answer_text: answerType === "typed" ? answerText : null,
        word_count: answerType === "typed" ? countWords(answerText) : 0,
        status: "submitted",
      })
      .select("id,custom_question_id,answer_type,answer_text,word_count,status,created_at")
      .single();

    if (saveError || !saved) {
      return NextResponse.json({ error: "Could not save your answer." }, { status: 500 });
    }
    submissionId = String(saved.id);

    let finalText = answerText;
    let confidence = 1;
    if (answerType === "handwritten") {
      const pageRows: Array<Record<string, unknown>> = [];
      const transcriptions: string[] = [];
      const confidences: number[] = [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const bytes = Buffer.from(await file.arrayBuffer());
        const storagePath = `${context.user.id}/${questionId}/${submissionId}/${String(index + 1).padStart(2, "0")}-${safeFilename(file.name)}`;
        const { error: uploadError } = await context.adminClient.storage.from(BUCKET).upload(storagePath, bytes, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw new Error("Could not securely save one of the handwritten pages.");
        uploadedPaths.push(storagePath);

        pageRows.push({
          submission_id: submissionId,
          user_id: context.user.id,
          page_number: index + 1,
          storage_path: storagePath,
          file_name: safeFilename(file.name),
          mime_type: file.type,
        });

        const extracted = await geminiJson(
          `You are a careful OCR specialist. Transcribe ONLY the student's handwritten answer from the attached file, in page order. Preserve wording, spelling, numbering and paragraph breaks. Do not correct or improve the answer. Do not include the printed question or unrelated text. Mark unreadable words as [unclear]. Question maximum marks: ${question.marks}; word limit: ${question.word_limit || "not specified"}. Return extracted_text and confidence from 0 to 1.`,
          [{ mimeType: file.type, data: bytes.toString("base64") }],
          ocrSchema,
        ) as { extracted_text?: unknown; confidence?: unknown };

        const extractedText = String(extracted.extracted_text || "").trim();
        if (extractedText) transcriptions.push(extractedText);
        confidences.push(Math.max(0, Math.min(1, Number(extracted.confidence) || 0)));
      }

      const { error: pagesError } = await context.adminClient
        .from("mpsc_student_custom_mains_pages")
        .insert(pageRows);
      if (pagesError) throw new Error("Could not save handwritten page records.");

      finalText = transcriptions.join("\n\n").trim();
      confidence = confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0;
      if (!finalText) throw new Error("Could not read handwriting from these files. Upload clearer images or submit a typed answer.");
    }

    const words = countWords(finalText);
    const { error: updateError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .update({ answer_text: finalText, word_count: words, status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .eq("user_id", context.user.id);

    if (updateError) throw new Error("Could not save the extracted answer text.");

    return NextResponse.json({
      submission: { id: submissionId, custom_question_id: questionId, answer_type: answerType, word_count: words, status: "submitted" },
      ocr_confidence: answerType === "handwritten" ? Math.round(confidence * 100) / 100 : null,
      message: answerType === "handwritten" ? "Pages uploaded and handwriting transcribed. Review the transcription below before evaluation." : "Answer submitted successfully.",
      extracted_text: answerType === "handwritten" ? finalText : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error("Custom Mains submission failed:", error);
    if (submissionId) {
      await context.adminClient.from("mpsc_student_custom_mains_submissions")
        .delete().eq("id", submissionId).eq("user_id", context.user.id);
      if (uploadedPaths.length) {
        await context.adminClient.storage.from(BUCKET).remove(uploadedPaths);
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit your answer." }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  try {
    const body = await request.json();
    const submissionId = String(body.submission_id || "");
    const answerText = String(body.answer_text || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
      return NextResponse.json({ error: "A valid submission ID is required." }, { status: 400 });
    }
    if (!answerText || answerText.length > 50000) {
      return NextResponse.json({ error: "Transcription must contain 1–50,000 characters." }, { status: 400 });
    }

    const { data: submission, error: submissionError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .select("id,status,answer_type")
      .eq("id", submissionId)
      .eq("user_id", context.user.id)
      .single();

    if (submissionError || !submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (submission.status === "evaluated") {
      return NextResponse.json({ error: "An evaluated answer cannot be edited. Create a new submission to try again." }, { status: 409 });
    }

    const words = countWords(answerText);
    const { error: updateError } = await context.adminClient
      .from("mpsc_student_custom_mains_submissions")
      .update({ answer_text: answerText, word_count: words, status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .eq("user_id", context.user.id);

    if (updateError) return NextResponse.json({ error: "Could not save the corrected transcription." }, { status: 500 });
    return NextResponse.json({ success: true, submission_id: submissionId, word_count: words });
  } catch (error) {
    console.error("Custom Mains transcription update failed:", error);
    return NextResponse.json({ error: "Could not save the transcription." }, { status: 500 });
  }
}
