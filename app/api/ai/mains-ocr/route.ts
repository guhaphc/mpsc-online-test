import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.1-flash-lite";
const BUCKET = "mpsc-mains-answers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const questionSchema = {
  type: "object",
  properties: {
    extracted_text: { type: "string" },
    confidence: { type: "number" },
  },
  required: ["extracted_text", "confidence"],
};

export async function POST(request: NextRequest) {
  try {
    if (!serviceRoleKey || !geminiApiKey) {
      return NextResponse.json({ error: "AI OCR is not configured on the server." }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const authClient = createClient(supabaseUrl, publishableKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await request.json();
    const submissionId = Number(body.submission_id);
    const questionId = Number(body.question_id);
    if (!Number.isInteger(submissionId) || !Number.isInteger(questionId)) {
      return NextResponse.json({ error: "Invalid submission or question." }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: submission, error: submissionError } = await adminClient
      .from("mpsc_mains_answer_submissions")
      .select("id,user_id,mains_question_id,answer_type,status")
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .eq("mains_question_id", questionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const { data: question, error: questionError } = await adminClient
      .from("mpsc_mains_questions")
      .select("id,question_text,word_limit,marks")
      .eq("id", questionId)
      .single();
    if (questionError || !question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

    const { data: pages, error: pagesError } = await adminClient
      .from("mpsc_mains_answer_pages")
      .select("id,page_number,storage_path,file_name,mime_type")
      .eq("submission_id", submissionId)
      .order("page_number", { ascending: true });

    if (pagesError || !pages?.length) {
      return NextResponse.json({ error: "No handwritten pages were found." }, { status: 400 });
    }

    const results: { page_number: number; extracted_text: string; confidence: number }[] = [];

    for (const page of pages) {
      const { data: blob, error: downloadError } = await adminClient.storage
        .from(BUCKET)
        .download(page.storage_path);
      if (downloadError || !blob) {
        throw new Error(`Could not read handwritten page ${page.page_number}.`);
      }

      const bytes = Buffer.from(await blob.arrayBuffer());
      if (bytes.length > 8 * 1024 * 1024) throw new Error(`Page ${page.page_number} is too large for OCR.`);

      const base64 = bytes.toString("base64");
      const mimeType = page.mime_type || "image/jpeg";
      const prompt = `You are an OCR specialist for MPSC/UPSC handwritten answer sheets.\n\nQuestion: ${question.question_text}\nExpected word limit: ${question.word_limit}.\n\nRead ONLY the student's handwritten answer from the supplied page. Transcribe it faithfully. Preserve the student's wording, spelling, paragraph breaks, numbering, and visible punctuation as much as possible. Do not correct grammar, facts, names, or spelling. Do not invent text that is not visible. If a word is unclear, use [unclear]. Ignore the question text, page borders, camera artifacts, and unrelated background. Return only the transcription and a confidence value from 0 to 1.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: questionSchema,
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini OCR request failed (${response.status}): ${detail.slice(0, 500)}`);
      }

      const payload = await response.json();
      const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error(`No OCR result was returned for page ${page.page_number}.`);

      let parsed: { extracted_text?: string; confidence?: number };
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`OCR returned invalid structured data for page ${page.page_number}.`);
      }

      const extractedText = String(parsed.extracted_text || "").trim();
      const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      results.push({ page_number: page.page_number, extracted_text: extractedText, confidence });
    }

    const combinedText = results.map((item) => item.extracted_text).filter(Boolean).join("\n\n").trim();
    const words = combinedText ? combinedText.split(/\s+/).filter(Boolean).length : 0;
    const avgConfidence = results.length
      ? results.reduce((sum, item) => sum + item.confidence, 0) / results.length
      : 0;

    const { error: updateError } = await adminClient
      .from("mpsc_mains_answer_submissions")
      .update({
        answer_text: combinedText || null,
        word_count: words,
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("user_id", user.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      success: true,
      submission_id: submissionId,
      pages: results,
      extracted_text: combinedText,
      word_count: words,
      confidence: avgConfidence,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not process handwritten answer." },
      { status: 500 },
    );
  }
}
