"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Stage = { id: number; name: string };
type Paper = { id: number; stage_id: number; paper_no: number; name: string };
type Item = {
  id: number;
  paper_id: number | null;
  parent_id: number | null;
  name: string;
  item_type: string;
};

type MainQuestion = {
  id: number;
  stage_id: number;
  paper_id: number;
  syllabus_item_id: number | null;
  question_text: string;
  marks: number;
  word_limit: number;
  model_answer: string | null;
  status: string;
};

type Submission = {
  id: number;
  mains_question_id: number;
  answer_type: "typed" | "handwritten";
  answer_text: string | null;
  word_count: number;
  status: string;
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function MainsAnswerPage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [questions, setQuestions] = useState<MainQuestion[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, Submission>>({});

  const [stageId, setStageId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [handwrittenFiles, setHandwrittenFiles] = useState<File[]>([]);
  const [uploadingHandwritten, setUploadingHandwritten] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("mpsc_profiles")
          .select("role, access_status")
          .eq("id", user.id)
          .single();

        if (profileError) throw new Error(profileError.message);

        if (profile?.role === "admin" && profile?.access_status === "approved") {
          router.replace("/admin");
          return;
        }
        if (profile?.access_status !== "approved") {
          router.replace("/pending");
          return;
        }

        const [st, pa, it, qu, su] = await Promise.all([
          supabase.from("mpsc_exam_stages").select("id,name").order("id"),
          supabase.from("mpsc_papers").select("id,stage_id,paper_no,name").order("id"),
          supabase.from("mpsc_syllabus_items").select("id,paper_id,parent_id,name,item_type").order("id"),
          supabase.from("mpsc_mains_questions")
            .select("id,stage_id,paper_id,syllabus_item_id,question_text,marks,word_limit,model_answer,status")
            .eq("status", "published")
            .order("id", { ascending: false }),
          supabase.from("mpsc_mains_answer_submissions")
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .eq("user_id", user.id)
            .order("id", { ascending: false }),
        ]);

        if (st.error) throw new Error(st.error.message);
        if (pa.error) throw new Error(pa.error.message);
        if (it.error) throw new Error(it.error.message);
        if (qu.error) throw new Error(qu.error.message);
        if (su.error) throw new Error(su.error.message);

        setStages((st.data || []) as Stage[]);
        setPapers((pa.data || []) as Paper[]);
        setItems((it.data || []) as Item[]);
        setQuestions((qu.data || []) as MainQuestion[]);

        const map: Record<number, Submission> = {};
        for (const row of (su.data || []) as Submission[]) {
          if (!map[row.mains_question_id]) map[row.mains_question_id] = row;
        }
        setSubmissions(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load Mains questions.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const mainsStages = useMemo(
    () => stages.filter((s) => s.name.toLowerCase().includes("main")),
    [stages]
  );

  const filteredPapers = useMemo(
    () => papers.filter((p) => !stageId || p.stage_id === Number(stageId)),
    [papers, stageId]
  );

  const subjects = useMemo(
    () => items.filter(
      (i) => i.item_type === "subject" && (!paperId || i.paper_id === Number(paperId))
    ),
    [items, paperId]
  );

  const topics = useMemo(
    () => items.filter(
      (i) => i.item_type !== "subject" && i.parent_id === Number(subjectId)
    ),
    [items, subjectId]
  );

  function belongsToSubject(itemId: number, subject: number) {
    let current = items.find((i) => i.id === itemId);
    const seen = new Set<number>();

    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      if (current.id === subject) return true;
      if (current.parent_id === null) return false;
      current = items.find((i) => i.id === current!.parent_id);
    }
    return false;
  }

  const filteredQuestions = useMemo(
    () => questions.filter((q) => {
      if (stageId && q.stage_id !== Number(stageId)) return false;
      if (paperId && q.paper_id !== Number(paperId)) return false;
      if (topicId && q.syllabus_item_id !== Number(topicId)) return false;
      if (subjectId && !topicId && q.syllabus_item_id !== null &&
          !belongsToSubject(q.syllabus_item_id, Number(subjectId))) return false;
      return true;
    }),
    [questions, stageId, paperId, subjectId, topicId, items]
  );

  const selected = questions.find((q) => q.id === selectedId) || null;
  const currentWords = wordCount(answer);
  const handwrittenPreviews = useMemo(
    () => handwrittenFiles.map((file) => (file.type === "application/pdf" ? "" : URL.createObjectURL(file))),
    [handwrittenFiles]
  );

  useEffect(() => {
    return () => {
      handwrittenPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [handwrittenPreviews]);

  useEffect(() => {
    if (!selected) {
      setAnswer("");
      return;
    }
    setAnswer(submissions[selected.id]?.answer_text || "");
    setSuccess("");
    setError("");
    setOcrText("");
    setOcrConfidence(null);
    setEvaluation(null);
  }, [selectedId, submissions, selected]);

  function addHandwrittenFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const allowed = incoming.filter((file) =>
      ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)
    );
    const rejected = incoming.filter((file) => !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type));
    if (rejected.length) {
      setError("Only JPG, PNG, WebP images and PDF files are supported.");
    }
    const tooLarge = allowed.filter((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge.length) {
      setError("Each handwritten file must be 8 MB or smaller.");
    }
    const usable = allowed.filter((file) => file.size <= 8 * 1024 * 1024);
    setHandwrittenFiles((current) => {
      const combined = [...current, ...usable];
      const totalBytes = combined.reduce((sum, file) => sum + file.size, 0);
      if (combined.length > 10) {
        setError("You can upload up to 10 handwritten pages/files at a time.");
        return current;
      }
      if (totalBytes > 40 * 1024 * 1024) {
        setError("The total handwritten upload size must be 40 MB or less.");
        return current;
      }
      setError("");
      return combined;
    });
  }

  function removeHandwrittenFile(index: number) {
    setHandwrittenFiles((current) => current.filter((_, i) => i !== index));
  }

  async function submitHandwrittenAnswer() {
    if (!selected || handwrittenFiles.length === 0) return;
    setUploadingHandwritten(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");

      const { data: submission, error: submissionError } = await supabase
        .from("mpsc_mains_answer_submissions")
        .insert({
          user_id: user.id,
          mains_question_id: selected.id,
          answer_type: "handwritten",
          answer_text: null,
          word_count: 0,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id,mains_question_id,answer_type,answer_text,word_count,status")
        .single();

      if (submissionError || !submission) {
        throw new Error(submissionError?.message || "Could not create handwritten submission.");
      }

      const uploadedPaths: string[] = [];
      try {
        for (let index = 0; index < handwrittenFiles.length; index += 1) {
          const file = handwrittenFiles[index];
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${user.id}/${selected.id}/${Date.now()}-${index + 1}-${safeName}`;

          const upload = await supabase.storage
            .from("mpsc-mains-answers")
            .upload(path, file, { contentType: file.type, upsert: false });

          if (upload.error) throw new Error(upload.error.message);
          uploadedPaths.push(path);

          const pageInsert = await supabase
            .from("mpsc_mains_answer_pages")
            .insert({
              submission_id: submission.id,
              page_number: index + 1,
              storage_path: path,
              file_name: file.name,
              mime_type: file.type,
            });

          if (pageInsert.error) throw new Error(pageInsert.error.message);
        }
      } catch (uploadError) {
        if (uploadedPaths.length) {
          await supabase.storage.from("mpsc-mains-answers").remove(uploadedPaths);
        }
        await supabase.from("mpsc_mains_answer_submissions").delete().eq("id", submission.id);
        throw uploadError;
      }

      const submittedFileCount = handwrittenFiles.length;
      setSubmissions((old) => ({
        ...old,
        [selected.id]: submission as Submission,
      }));
      setHandwrittenFiles([]);
      setSuccess(`${submittedFileCount} handwritten page/file${submittedFileCount === 1 ? "" : "s"} uploaded. Starting AI handwriting OCR...`);

      setOcrProcessing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const ocrResponse = await fetch("/api/ai/mains-ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ submission_id: submission.id, question_id: selected.id }),
        });
        const ocrData = await ocrResponse.json();
        if (!ocrResponse.ok) throw new Error(ocrData?.error || "AI handwriting OCR failed.");
        setOcrText(ocrData.extracted_text || "");
        setOcrConfidence(typeof ocrData.confidence === "number" ? ocrData.confidence : null);
        setSubmissions((old) => ({
          ...old,
          [selected.id]: {
            ...(old[selected.id] || (submission as Submission)),
            answer_text: ocrData.extracted_text || null,
            word_count: Number(ocrData.word_count || 0),
            status: "submitted",
          },
        }));
        setSuccess(`✓ Handwritten answer submitted and read by AI · ${Number(ocrData.word_count || 0)} words`);
      } catch (ocrError) {
        setError(ocrError instanceof Error ? ocrError.message : "AI handwriting OCR failed.");
        setSuccess(`${submittedFileCount} handwritten page/file${submittedFileCount === 1 ? "" : "s"} uploaded successfully. OCR can be retried later.`);
      } finally {
        setOcrProcessing(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit handwritten answer.");
    } finally {
      setUploadingHandwritten(false);
    }
  }

  async function submitTypedAnswer(event: FormEvent) {
    event.preventDefault();
    if (!selected || !answer.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");

      const payload = {
        user_id: user.id,
        mains_question_id: selected.id,
        answer_type: "typed",
        answer_text: answer.trim(),
        word_count: currentWords,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existing = submissions[selected.id];
      const result = existing
        ? await supabase.from("mpsc_mains_answer_submissions")
            .update(payload)
            .eq("id", existing.id)
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .single()
        : await supabase.from("mpsc_mains_answer_submissions")
            .insert(payload)
            .select("id,mains_question_id,answer_type,answer_text,word_count,status")
            .single();

      if (result.error) throw new Error(result.error.message);

      setSubmissions((old) => ({
        ...old,
        [selected.id]: result.data as Submission,
      }));
      setSuccess("Answer submitted successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit answer.");
    } finally {
      setSaving(false);
    }
  }

  async function evaluateAnswer() {
    if (!selected) return;

    const submission = submissions[selected.id];
    const answerText = submission?.answer_text || (submission?.answer_type === "typed" ? answer : "");

    if (!submission || !answerText.trim()) {
      setError("Please submit your answer first. For a handwritten answer, wait until AI finishes reading the handwriting.");
      return;
    }

    setEvaluating(true);
    setError("");
    setSuccess("");
    setEvaluation(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch("/api/ai/mains-evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          submissionId: submission.id,
          questionId: selected.id,
          questionText: selected.question_text,
          answerText,
          marks: selected.marks,
          wordLimit: selected.word_limit,
          modelAnswer: selected.model_answer || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI evaluation failed.");

      setEvaluation(data.evaluation || null);
      setSuccess("✓ AI evaluation completed successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        .mains-answer-page {
          min-height: 100vh;
          background: #f6f8fc;
          color: #172033;
          padding: 20px 12px 48px;
        }
        .mains-answer-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }
        .mains-answer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .mains-answer-header h1 {
          margin: 4px 0 8px;
          font-size: clamp(30px, 6vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }
        .brand {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .14em;
          color: #5e6a7e;
        }
        .muted {
          color: #687386;
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
        }
        .mains-filter-card, .mains-writing-card, .mains-question-list {
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-filter-card { padding: 18px; margin-bottom: 18px; }
        .mains-filter-card h2, .mains-list-title h2 {
          margin: 0 0 14px;
          font-size: 24px;
        }
        .mains-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .mains-filter-grid label, .mains-answer-label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-weight: 700;
        }
        .mains-filter-grid select {
          width: 100%;
          min-height: 46px;
          border: 1px solid #ccd4df;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
          color: #172033;
          font-size: 15px;
        }
        .mains-answer-grid {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
          gap: 18px;
          align-items: start;
        }
        .mains-question-list { padding: 18px; }
        .mains-list-title p { margin: 0 0 12px; color: #687386; }
        .mains-question-row {
          width: 100%;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          text-align: left;
          padding: 14px 10px;
          margin-top: 8px;
          border: 1px solid #dbe1e9;
          border-radius: 12px;
          background: #fff;
          color: #172033;
          cursor: pointer;
        }
        .mains-question-row:hover, .mains-question-row.selected {
          border-color: #8ca4c0;
          background: #f4f7fb;
        }
        .mains-q-number {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e9eef5;
          font-weight: 800;
        }
        .mains-q-text {
          min-width: 0;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .mains-q-text small {
          display: block;
          margin-top: 6px;
          color: #687386;
          font-size: 13px;
        }
        .mains-writing-card { padding: 20px; }
        .mains-selected-question {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: start;
        }
        .mains-selected-question h2 {
          margin: 10px 0 0;
          font-size: clamp(22px, 4vw, 31px);
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .mains-badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          background: #e9eef5;
          font-size: 12px;
          font-weight: 800;
        }
        .mains-marks {
          min-width: 74px;
          text-align: center;
          padding: 10px;
          border: 1px solid #dbe1e9;
          border-radius: 12px;
        }
        .mains-marks strong { display: block; font-size: 24px; }
        .mains-marks span { font-size: 12px; color: #687386; }
        .mains-word-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin: 18px 0;
          padding: 11px 13px;
          border-radius: 10px;
          background: #f2f5f9;
          color: #4d596d;
          font-size: 14px;
        }
        .mains-word-bar .over { font-weight: 800; }
        .mains-answer-label { font-size: 16px; }
        .mains-answer-label textarea {
          width: 100%;
          min-height: 360px;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #cbd3de;
          border-radius: 12px;
          padding: 14px;
          font: inherit;
          line-height: 1.6;
          color: #172033;
          background: #fff;
        }
        .mains-answer-label textarea:focus { outline: 2px solid #9db2ca; outline-offset: 1px; }
        .mains-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 12px;
        }
        .mains-actions button, .mains-answer-header button, .mains-upload-placeholder button {
          min-height: 46px;
          border-radius: 10px;
          padding: 10px 16px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }
        .mains-actions .primary { border: 0; background: #234f78; color: #fff; }
        .mains-actions .secondary, .mains-answer-header .secondary, .mains-upload-placeholder .secondary { border: 1px solid #ccd4df; background: #fff; color: #172033; }
        .mains-upload-placeholder {
          margin-top: 18px;
          padding: 16px;
          border: 1px dashed #b9c4d2;
          border-radius: 12px;
          background: #fafbfd;
        }
        .mains-upload-placeholder strong { font-size: 17px; }
        .mains-upload-placeholder p { margin: 8px 0 12px; color: #687386; line-height: 1.5; }
        .mains-upload-card {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid #dbe1e9;
          border-radius: 14px;
          background: #fafbfd;
        }
        .mains-upload-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .mains-upload-heading strong { font-size: 18px; }
        .mains-upload-heading p { margin: 7px 0 0; color: #687386; line-height: 1.5; }
        .mains-upload-count {
          padding: 5px 9px;
          border-radius: 999px;
          background: #e9eef5;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }
        .mains-hidden-input { display: none; }
        .mains-upload-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }
        .mains-upload-button {
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border-radius: 10px;
          background: #234f78;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          text-align: center;
          box-sizing: border-box;
        }
        .mains-upload-button.secondary {
          border: 1px solid #ccd4df;
          background: #fff;
          color: #172033;
        }
        .mains-upload-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .mains-upload-preview {
          overflow: hidden;
          border: 1px solid #dbe1e9;
          border-radius: 10px;
          background: #fff;
        }
        .mains-upload-preview img {
          display: block;
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          background: #f2f5f9;
        }
        .mains-pdf-preview {
          aspect-ratio: 3 / 4;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 4px;
          font-size: 42px;
          background: #f2f5f9;
        }
        .mains-pdf-preview span { font-size: 13px; font-weight: 800; }
        .mains-upload-preview-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 7px;
          font-size: 12px;
          font-weight: 800;
        }
        .mains-upload-preview-footer button {
          border: 0;
          background: transparent;
          color: #a33a3a;
          font: inherit;
          cursor: pointer;
          padding: 3px;
        }
        .mains-upload-help { margin: 12px 0; color: #687386; font-size: 12px; line-height: 1.45; }
        .mains-handwritten-submit { width: 100%; min-height: 48px; border: 0; border-radius: 10px; padding: 11px 14px; font: inherit; font-weight: 800; background: #234f78; color: #fff; cursor: pointer; }
        .mains-handwritten-submit:disabled { opacity: .55; cursor: not-allowed; }
        .mains-evaluate-card {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid #dbe1e9;
          border-radius: 14px;
          background: #f8fafc;
        }
        .mains-evaluate-button {
          width: 100%;
          min-height: 50px;
          border: 0;
          border-radius: 10px;
          padding: 12px 16px;
          font: inherit;
          font-weight: 800;
          background: #234f78;
          color: #fff;
          cursor: pointer;
        }
        .mains-evaluate-button:disabled { opacity: .55; cursor: not-allowed; }
        .mains-evaluation-result {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid #dbe1e9;
          border-radius: 14px;
          background: #fff;
        }
        .mains-evaluation-score {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border-radius: 12px;
          background: #eef5ff;
          margin-bottom: 16px;
        }
        .mains-evaluation-score strong { font-size: 30px; }
        .mains-evaluation-confidence { color: #687386; font-size: 13px; }
        .mains-criteria-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
          margin: 12px 0 16px;
        }
        .mains-criteria-item {
          padding: 10px 12px;
          border: 1px solid #e0e5ec;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 14px;
        }
        .mains-evaluation-section { margin-top: 16px; }
        .mains-evaluation-section h3 { margin: 0 0 8px; font-size: 17px; }
        .mains-evaluation-section ul { margin: 0; padding-left: 20px; }
        .mains-evaluation-section li { margin-bottom: 6px; line-height: 1.5; }
        .mains-evaluation-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.6;
          margin: 0;
          padding: 12px;
          border-radius: 10px;
          background: #f8fafc;
        }
        .mains-ocr-status { margin-top: 14px; padding: 14px; border-radius: 12px; background: #eef5ff; font-weight: 700; }
        .mains-ocr-result { margin-top: 16px; padding: 16px; border: 1px solid #d7dce5; border-radius: 14px; background: #fff; }
        .mains-ocr-result-title { font-weight: 800; font-size: 18px; }
        .mains-ocr-meta { margin: 6px 0 12px; color: #687386; }
        .mains-ocr-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.6; color: #172033; background: #f8fafc; padding: 14px; border-radius: 10px; }
        .mains-submission-status, .mains-message, .mains-empty {
          padding: 12px 14px;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .mains-submission-status { margin-top: 14px; background: #edf7ef; }
        .mains-error { background: #fff0f0; color: #a33a3a; }
        .mains-success { background: #edf7ef; color: #287a45; }
        .mains-empty { color: #687386; background: #fff; border: 1px dashed #cbd3de; }
        .mains-collapsible {
          margin-bottom: 18px;
        }
        .mains-collapsible > summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px;
          font-size: 24px;
          font-weight: 800;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-collapsible > summary::-webkit-details-marker { display: none; }
        .mains-collapsible > summary::after {
          content: "+";
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #d7dce5;
          border-radius: 10px;
          font-size: 22px;
          background: #fff;
        }
        .mains-collapsible[open] > summary::after { content: "−"; }
        .mains-collapsible > .mains-collapsible-body {
          margin-top: 10px;
        }
        .mains-filter-card.mains-collapsible { padding: 0; background: transparent; border: 0; box-shadow: none; }
        .mains-filter-card.mains-collapsible > summary { margin-bottom: 0; }
        .mains-filter-card.mains-collapsible[open] > .mains-filter-body {
          padding: 18px;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 0 0 18px 18px;
          border-top: 0;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        .mains-filter-card.mains-collapsible[open] > summary { border-radius: 18px 18px 0 0; }
        .mains-question-list.mains-collapsible, .mains-writing-card.mains-collapsible { padding: 0; }
        .mains-question-list.mains-collapsible > summary, .mains-writing-card.mains-collapsible > summary { margin-bottom: 0; }
        .mains-question-list.mains-collapsible[open] > .mains-collapsible-body,
        .mains-writing-card.mains-collapsible[open] > .mains-collapsible-body {
          padding: 18px;
          background: #fff;
          border: 1px solid #dce2eb;
          border-radius: 0 0 18px 18px;
          border-top: 0;
          box-shadow: 0 8px 24px rgba(24, 39, 75, .06);
        }
        @media (max-width: 800px) {
          .mains-collapsible > summary {
            padding: 15px 14px;
            font-size: 20px;
          }
          .mains-answer-page { padding: 14px 10px 36px; }
          .mains-answer-header { flex-direction: column; }
          .mains-answer-header button { width: 100%; }
          .mains-filter-grid { grid-template-columns: 1fr; }
          .mains-answer-grid { grid-template-columns: 1fr; }
          .mains-question-list, .mains-writing-card { padding: 14px; }
          .mains-selected-question { grid-template-columns: 1fr; }
          .mains-marks { width: fit-content; min-width: 72px; }
          .mains-answer-label textarea { min-height: 320px; font-size: 16px; }
          .mains-actions { grid-template-columns: 1fr; }
          .mains-upload-buttons { grid-template-columns: 1fr; }
          .mains-upload-preview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mains-criteria-grid { grid-template-columns: 1fr; }
          .mains-evaluation-score { align-items: flex-start; flex-direction: column; }
        }
      `}</style>
      <main className="mains-answer-page">
      <div className="mains-answer-shell">
        <header className="mains-answer-header">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Mains Answer Writing</h1>
            <p className="muted">Select a published Mains question and write your answer.</p>
          </div>
          <button className="secondary" onClick={() => router.push("/student")}>
            Dashboard
          </button>
        </header>

        {error && <div className="mains-message mains-error">{error}</div>}
        {success && <div className="mains-message mains-success">{success}</div>}

        <details className="mains-filter-card mains-collapsible" open>
          <summary>Find a Question</summary>
          <div className="mains-filter-body">
          <div className="mains-filter-grid">
            <label>
              Examination Stage
              <select value={stageId} onChange={(e) => {
                setStageId(e.target.value);
                setPaperId(""); setSubjectId(""); setTopicId(""); setSelectedId(null);
              }}>
                <option value="">Select stage</option>
                {mainsStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label>
              Paper
              <select value={paperId} onChange={(e) => {
                setPaperId(e.target.value);
                setSubjectId(""); setTopicId(""); setSelectedId(null);
              }} disabled={!stageId}>
                <option value="">All papers</option>
                {filteredPapers.map((p) => (
                  <option key={p.id} value={p.id}>Paper {p.paper_no} · {p.name}</option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select value={subjectId} onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId(""); setSelectedId(null);
              }} disabled={!paperId}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label>
              Topic
              <select value={topicId} onChange={(e) => {
                setTopicId(e.target.value);
                setSelectedId(null);
              }} disabled={!subjectId}>
                <option value="">All topics</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </div>
          </div>
        </details>

        {loading ? (
          <div className="mains-empty">Loading Mains questions...</div>
        ) : (
          <div className="mains-answer-grid">
            <details className="mains-question-list mains-collapsible" open>
              <summary>Published Questions <span style={{fontSize: "14px", fontWeight: 700, color: "#687386"}}>({filteredQuestions.length})</span></summary>
              <div className="mains-collapsible-body">

              {filteredQuestions.length === 0 ? (
                <div className="mains-empty">
                  No published Mains questions found for these filters.
                </div>
              ) : filteredQuestions.map((q, index) => (
                <button
                  key={q.id}
                  type="button"
                  className={selectedId === q.id ? "mains-question-row selected" : "mains-question-row"}
                  onClick={() => setSelectedId(q.id)}
                >
                  <span className="mains-q-number">{index + 1}</span>
                  <span className="mains-q-text">
                    {q.question_text}
                    <small>
                      {q.marks} marks · {q.word_limit} words
                      {submissions[q.id] ? " · Answer submitted" : ""}
                    </small>
                  </span>
                </button>
              ))}
              </div>
            </details>

            <details className="mains-writing-card mains-collapsible" open={Boolean(selected)}>
              <summary>Answer Writing</summary>
              <div className="mains-collapsible-body">
              {!selected ? (
                <div className="mains-empty">
                  <strong>Select a question</strong>
                  <span>Your answer-writing area will appear here.</span>
                </div>
              ) : (
                <>
                  <div className="mains-selected-question">
                    <div>
                      <span className="mains-badge">Mains Question</span>
                      <h2>{selected.question_text}</h2>
                    </div>
                    <div className="mains-marks">
                      <strong>{selected.marks}</strong>
                      <span>Marks</span>
                    </div>
                  </div>

                  <div className="mains-word-bar">
                    <span>Word limit: <b>{selected.word_limit}</b></span>
                    <span>Words: <b>{currentWords}</b></span>
                    <span className={currentWords > selected.word_limit ? "over" : ""}>
                      {currentWords > selected.word_limit ? "Over limit" : "Within limit"}
                    </span>
                  </div>

                  <form onSubmit={submitTypedAnswer}>
                    <label className="mains-answer-label">
                      ✍️ Write Your Answer
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={18}
                        placeholder="Write your answer here..."
                      />
                    </label>

                    <div className="mains-actions">
                      <button className="primary" type="submit" disabled={saving || !answer.trim()}>
                        {saving ? "Submitting..." : "Submit Answer"}
                      </button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => setAnswer("")}>
                        Clear
                      </button>
                    </div>
                  </form>

                  <div className="mains-upload-card">
                    <div className="mains-upload-heading">
                      <div>
                        <strong>📷 Handwritten Answer</strong>
                        <p>Take page photos with your phone camera or select handwritten images/PDF pages.</p>
                      </div>
                      <span className="mains-upload-count">{handwrittenFiles.length}/10</span>
                    </div>

                    <input
                      id="mains-camera-input"
                      className="mains-hidden-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => {
                        addHandwrittenFiles(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <input
                      id="mains-files-input"
                      className="mains-hidden-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      multiple
                      onChange={(e) => {
                        addHandwrittenFiles(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div className="mains-upload-buttons">
                      <label className="mains-upload-button" htmlFor="mains-camera-input">
                        📷 Take Photo
                      </label>
                      <label className="mains-upload-button secondary" htmlFor="mains-files-input">
                        🖼️ Choose Pages / PDF
                      </label>
                    </div>

                    {handwrittenFiles.length > 0 && (
                      <div className="mains-upload-preview-grid">
                        {handwrittenFiles.map((file, index) => (
                          <div className="mains-upload-preview" key={`${file.name}-${index}`}>
                            {file.type === "application/pdf" ? (
                              <div className="mains-pdf-preview">📄<span>PDF</span></div>
                            ) : (
                              <img src={handwrittenPreviews[index]} alt={`Handwritten page ${index + 1}`} />
                            )}
                            <div className="mains-upload-preview-footer">
                              <span>Page {index + 1}</span>
                              <button type="button" onClick={() => removeHandwrittenFile(index)} disabled={uploadingHandwritten}>Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="mains-upload-help">Maximum 10 files, 8 MB each, 40 MB total. Supported: JPG, PNG, WebP, PDF.</p>

                    <button
                      className="primary mains-handwritten-submit"
                      type="button"
                      disabled={uploadingHandwritten || ocrProcessing || handwrittenFiles.length === 0}
                      onClick={submitHandwrittenAnswer}
                    >
                      {uploadingHandwritten ? "Uploading..." : ocrProcessing ? "Reading Handwriting..." : "Submit Handwritten Answer"}
                    </button>
                  </div>

                  {submissions[selected.id] && (
                    <div className="mains-submission-status">
                      ✓ {submissions[selected.id].answer_type === "handwritten" ? "Handwritten answer submitted" : "Answer submitted"} · {submissions[selected.id].word_count} words
                    </div>
                  )}

                  {ocrProcessing && (
                    <div className="mains-ocr-status">🤖 AI is reading your handwriting…</div>
                  )}

                  {ocrText && (
                    <div className="mains-ocr-result">
                      <div className="mains-ocr-result-title">🤖 AI-extracted answer</div>
                      <p className="mains-ocr-meta">Word count: {ocrText.split(/\s+/).filter(Boolean).length}{ocrConfidence !== null ? ` · OCR confidence: ${Math.round(ocrConfidence * 100)}%` : ""}</p>
                      <pre className="mains-ocr-text">{ocrText}</pre>
                    </div>
                  )}

                  <div className="mains-evaluate-card">
                    <button
                      type="button"
                      className="mains-evaluate-button"
                      onClick={evaluateAnswer}
                      disabled={evaluating || !submissions[selected.id]?.answer_text}
                    >
                      {evaluating ? "🤖 AI is evaluating your answer…" : "🤖 Evaluate Answer with AI"}
                    </button>
                    <p className="mains-upload-help">AI evaluates relevance, content, analysis, structure, examples and conclusion against the question and word limit.</p>
                  </div>

                  {evaluation && (
                    <div className="mains-evaluation-result">
                      <div className="mains-evaluation-score">
                        <div>
                          <div style={{fontWeight: 800}}>AI Evaluation</div>
                          <strong>{Number(evaluation.awarded_marks ?? 0).toFixed(1)} / {selected.marks}</strong>
                        </div>
                        <div className="mains-evaluation-confidence">
                          Confidence: {Math.round(Number(evaluation.evaluation_confidence ?? 0) * 100)}%
                        </div>
                      </div>

                      {evaluation.criteria_scores && (
                        <div>
                          <h3 style={{margin: 0}}>Criteria Scores</h3>
                          <div className="mains-criteria-grid">
                            {Object.entries(evaluation.criteria_scores).map(([key, value]) => (
                              <div className="mains-criteria-item" key={key}>
                                <span>{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                                <strong>{String(value)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
                        <div className="mains-evaluation-section">
                          <h3>✅ Strengths</h3>
                          <ul>{evaluation.strengths.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      )}

                      {Array.isArray(evaluation.missing_points) && evaluation.missing_points.length > 0 && (
                        <div className="mains-evaluation-section">
                          <h3>📌 Missing Points</h3>
                          <ul>{evaluation.missing_points.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      )}

                      {Array.isArray(evaluation.factual_errors) && evaluation.factual_errors.length > 0 && (
                        <div className="mains-evaluation-section">
                          <h3>⚠️ Factual Errors</h3>
                          <ul>{evaluation.factual_errors.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      )}

                      {evaluation.feedback && (
                        <div className="mains-evaluation-section">
                          <h3>📝 Detailed Feedback</h3>
                          <p className="mains-evaluation-text">{evaluation.feedback}</p>
                        </div>
                      )}

                      {evaluation.answer_framework && (
                        <div className="mains-evaluation-section">
                          <h3>🧭 Answer Framework</h3>
                          <p className="mains-evaluation-text">{evaluation.answer_framework}</p>
                        </div>
                      )}

                      {evaluation.improved_answer && (
                        <div className="mains-evaluation-section">
                          <h3>✨ Improved Answer</h3>
                          <p className="mains-evaluation-text">{evaluation.improved_answer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              </div>
            </details>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
