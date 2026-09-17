"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  formatDuration,
  formatPenalty,
  optionKeys,
  Paper,
  Question,
  TestRecord,
} from "@/lib/tests";
import {
  GeneratedQuestion,
  validateGeneratedQuestions,
} from "@/lib/mock-test";

type Stage = {
  id: number;
  name: string;
  sort_order: number;
};

type SyllabusItem = {
  id: number;
  paper_id: number;
  parent_id: number | null;
  item_type: string;
  name: string;
  sort_order: number;
};

type TestForm = {
  title: string;
  stage_id: string;
  paper_id: string;
  subject_id: string;
  syllabus_item_id: string;
  duration_minutes: string;
  total_marks: string;
  negative_marking: string;
  is_published: boolean;
};

type QuestionForm = {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: string;
  explanation: string;
  question_order: string;
};

type GeneratorForm = {
  stage_id: string;
  paper_id: string;
  subject_id: string;
  topic_id: string;
  title: string;
  count: string;
  difficulty: string;
  language: string;
  marks: string;
  negative_marking: string;
  duration: string;
  instructions: string;
  referenceText: string;
  referenceName: string;

  // Main Examination settings
  mainsMode: boolean;
  wordLimit: string;
};

type MainsQuestion = {
  id?: number;
  question_text: string;
  marks: number;
  word_limit: number;
  model_answer: string;
  answer_framework: string;
  key_points: string[];
  status: "draft" | "published" | "rejected";
};
type MainsLibraryQuestion = {
  id: number;
  question_text: string;
  marks: number;
  word_limit: number;
  model_answer: string;
  answer_framework: string;
  key_points: string[];
  status: "draft" | "published" | "rejected";
  stage_id: number | null;
  paper_id: number | null;
  syllabus_item_id: number | null;
  created_at: string;
};

const blankTest = (): TestForm => ({
  title: "",
  stage_id: "",
  paper_id: "",
  subject_id: "",
  syllabus_item_id: "",
  duration_minutes: "60",
  total_marks: "100",
  negative_marking: "0",
  is_published: false,
});

const blankQuestion = (order = 1): QuestionForm => ({
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A",
  marks: "1",
  explanation: "",
  question_order: String(order),
});

const blankGenerator = (): GeneratorForm => ({
  stage_id: "",
  paper_id: "",
  subject_id: "",
  topic_id: "",
  title: "",
  count: "10",
  difficulty: "Mixed",
  language: "English",
  marks: "2",
  negative_marking: "0.66",
  duration: "60",
  instructions: "",
  referenceText: "",
  referenceName: "",
  mainsMode: false,
  wordLimit: "250",
});

export default function AdminTestsPage() {
  const router = useRouter();

  const [tests, setTests] = useState<TestRecord[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<SyllabusItem[]>([]);

  const [form, setForm] = useState<TestForm>(blankTest());
  const [editing, setEditing] = useState<TestRecord | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionForm, setQuestionForm] =
    useState<QuestionForm | null>(null);

  const [generator, setGenerator] =
    useState<GeneratorForm>(blankGenerator());

  const [mainsQuestions, setMainsQuestions] =
    useState<MainsQuestion[]>([]);

  const [selectedMainsQuestion, setSelectedMainsQuestion] =
    useState<number | null>(null);
  const [mainsLibraryQuestions, setMainsLibraryQuestions] =
    useState<MainsLibraryQuestion[]>([]);

  const [generating, setGenerating] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] =
    useState<number | null>(null);

  const [progress, setProgress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedGeneratorStage = useMemo(
    () =>
      stages.find(
        (stage) =>
          stage.id === Number(generator.stage_id)
      ),
    [stages, generator.stage_id]
  );

  const isMainExamination =
    selectedGeneratorStage?.name
      ?.toLowerCase()
      .includes("main") ?? false;
    useEffect(() => {
    if (isMainExamination) {
      setGenerator((current) => ({
        ...current,
        mainsMode: true,
        marks: current.marks || "10",
        wordLimit: current.wordLimit || "250",
      }));
    } else {
      setGenerator((current) => ({
        ...current,
        mainsMode: false,
      }));
    }
  }, [isMainExamination]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("mpsc_profiles")
      .select("role, access_status")
      .eq("id", session.user.id)
      .maybeSingle();

    if (
      profile?.role !== "admin" ||
      profile?.access_status !== "approved"
    ) {
      router.replace("/student");
      return;
    }

    const [
      testsResponse,
      stagesResponse,
      papersResponse,
      itemsResponse,
      mainsQuestionsResponse,
    ] = await Promise.all([
      supabase
        .from("mpsc_tests")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("mpsc_exam_stages")
        .select("id, name, sort_order")
        .order("sort_order"),

      supabase
        .from("mpsc_papers")
        .select("*")
        .order("stage_id")
        .order("paper_no"),

      supabase
        .from("mpsc_syllabus_items")
        .select(
          "id, paper_id, parent_id, item_type, name, sort_order"
        )
        .order("paper_id")
        .order("sort_order"),

      supabase
        .from("mpsc_mains_questions")
        .select(
          "id, question_text, marks, word_limit, model_answer, answer_framework, key_points, status, stage_id, paper_id, syllabus_item_id, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

    if (testsResponse.error) {
      setError(testsResponse.error.message);
    }

    if (stagesResponse.error) {
      setError(stagesResponse.error.message);
    }

    if (papersResponse.error) {
      setError(papersResponse.error.message);
    }

    if (itemsResponse.error) {
      setError(itemsResponse.error.message);
    }

    if (mainsQuestionsResponse.error) {
      setError(mainsQuestionsResponse.error.message);
    }

    setTests((testsResponse.data ?? []) as TestRecord[]);
    setStages((stagesResponse.data ?? []) as Stage[]);
    setPapers((papersResponse.data ?? []) as Paper[]);
    setItems((itemsResponse.data ?? []) as SyllabusItem[]);
    const normalizedMainsLibraryQuestions: MainsLibraryQuestion[] =
      (mainsQuestionsResponse.data ?? []).map((row) => ({
        id: Number(row.id),
        question_text: String(row.question_text ?? ""),
        marks: Number(row.marks ?? 0),
        word_limit: Number(row.word_limit ?? 0),
        model_answer: String(row.model_answer ?? ""),
        answer_framework: String(row.answer_framework ?? ""),
        key_points: Array.isArray(row.key_points)
          ? row.key_points.map((point) => String(point ?? "")).filter(Boolean)
          : [],
        status:
          row.status === "published" || row.status === "rejected"
            ? row.status
            : "draft",
        stage_id: row.stage_id == null ? null : Number(row.stage_id),
        paper_id: row.paper_id == null ? null : Number(row.paper_id),
        syllabus_item_id:
          row.syllabus_item_id == null ? null : Number(row.syllabus_item_id),
        created_at: String(row.created_at ?? ""),
      }));

    setMainsLibraryQuestions(normalizedMainsLibraryQuestions);

    setLoading(false);
  }

  const selectedStageId = Number(generator.stage_id);
  const selectedPaperId = Number(generator.paper_id);
  const selectedSubjectId = Number(generator.subject_id);

  const generatorPapers = useMemo(
    () =>
      papers.filter(
        (paper) =>
          paper.stage_id === selectedStageId
      ),
    [papers, selectedStageId]
  );

  const generatorSubjects = useMemo(
    () =>
      items.filter(
        (item) =>
          item.paper_id === selectedPaperId &&
          item.item_type === "subject"
      ),
    [items, selectedPaperId]
  );

  const generatorTopics = useMemo(
    () =>
      items.filter(
        (item) =>
          item.paper_id === selectedPaperId &&
          item.parent_id === selectedSubjectId &&
          item.item_type !== "subject"
      ),
    [items, selectedPaperId, selectedSubjectId]
  );

  function updateGenerator(
    patch: Partial<GeneratorForm>
  ) {
    setGenerator((current) => ({
      ...current,
      ...patch,
    }));
  }

  function handleGeneratorStageChange(
    stageId: string
  ) {
    const stage = stages.find(
      (value) => value.id === Number(stageId)
    );

    const mains =
      stage?.name
        ?.toLowerCase()
        .includes("main") ?? false;

    setGenerator((current) => ({
      ...current,
      stage_id: stageId,
      paper_id: "",
      subject_id: "",
      topic_id: "",
      mainsMode: mains,
      marks: mains ? "10" : "2",
      wordLimit: mains ? "250" : current.wordLimit,
      negative_marking: mains
        ? "0"
        : current.negative_marking,
      duration: mains ? "180" : current.duration,
    }));

    setMainsQuestions([]);
    setSelectedMainsQuestion(null);
  }

  function handleGeneratorPaperChange(
    paperId: string
  ) {
    setGenerator((current) => ({
      ...current,
      paper_id: paperId,
      subject_id: "",
      topic_id: "",
    }));

    setMainsQuestions([]);
    setSelectedMainsQuestion(null);
  }

  function handleGeneratorSubjectChange(
    subjectId: string
  ) {
    const hasChildTopics = items.some(
      (item) =>
        item.paper_id ===
          Number(generator.paper_id) &&
        item.parent_id === Number(subjectId) &&
        item.item_type !== "subject"
    );

    setGenerator((current) => ({
      ...current,
      subject_id: subjectId,
      topic_id: hasChildTopics ? "" : subjectId,
    }));

    setMainsQuestions([]);
    setSelectedMainsQuestion(null);
  }

  function handleGeneratorTopicChange(
    topicId: string
  ) {
    setGenerator((current) => ({
      ...current,
      topic_id: topicId,
    }));
  }

  function resetGenerator() {
    setGenerator(blankGenerator());
    setMainsQuestions([]);
    setSelectedMainsQuestion(null);
    setProgress("");
  }

  function getSelectedGeneratorContext() {
    const stage = stages.find(
      (value) =>
        value.id === Number(generator.stage_id)
    );

    const paper = papers.find(
      (value) =>
        value.id === Number(generator.paper_id)
    );

    const subject = items.find(
      (value) =>
        value.id === Number(generator.subject_id)
    );

    const topic = items.find(
      (value) =>
        value.id === Number(generator.topic_id)
    );

    return {
      stage,
      paper,
      subject,
      topic,
    };
  }
    async function requestQuestions(
    singleQuestion = false
  ): Promise<GeneratedQuestion[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const {
      stage,
      paper,
      subject,
      topic,
    } = getSelectedGeneratorContext();

    const response = await fetch("/api/ai/mock-test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        stage: stage?.name,
        paper: paper
          ? `Paper ${paper.paper_no} · ${paper.name}`
          : "",
        subject: subject?.name,
        topic: topic?.name,
        count: Number(generator.count),
        difficulty: generator.difficulty,
        language: generator.language,
        instructions: generator.instructions,
        referenceText: generator.referenceText,
        marks: Number(generator.marks),
        singleQuestion,
      }),
    });

    const result = (await response.json()) as {
      questions?: unknown;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        result.error || "AI question generation failed."
      );
    }

    return validateGeneratedQuestions(
      result.questions,
      singleQuestion
        ? 1
        : Number(generator.count),
      Number(generator.marks)
    );
  }

  async function generateDraft(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setProgress("");

    if (isMainExamination) {
      await generateMainsQuestions();
      return;
    }

    if (!generator.stage_id) {
      setError("Please select an examination stage.");
      return;
    }

    if (!generator.paper_id) {
      setError("Please select a paper.");
      return;
    }

    if (!generator.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!generator.topic_id) {
      setError("Please select a topic.");
      return;
    }

    setGenerating(true);

    try {
      setProgress("AI is generating questions...");

      const generated = await requestQuestions(false);

      const nextQuestions: Question[] =
        generated.map((question, index) => ({
          id: Date.now() + index,
          test_id: 0,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          marks: question.marks,
          explanation: question.explanation,
          question_order: index + 1,
          created_at: new Date().toISOString(),
        }));

      setQuestions(nextQuestions);

      setForm((current) => ({
        ...current,
        title:
          generator.title ||
          `${topicName(generator.topic_id)} AI Test`,
        duration_minutes: generator.duration,
        total_marks: String(
          nextQuestions.reduce(
            (sum, question) =>
              sum + Number(question.marks || 0),
            0
          )
        ),
        negative_marking:
          generator.negative_marking,
        stage_id: generator.stage_id,
        paper_id: generator.paper_id,
        subject_id: generator.subject_id,
        syllabus_item_id: generator.topic_id,
      }));

      setProgress(
        `${nextQuestions.length} questions generated successfully.`
      );
      setSuccess(
        "AI questions generated. Review them before saving."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Question generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  function topicName(topicId: string) {
    return (
      items.find(
        (item) => item.id === Number(topicId)
      )?.name || "MPSC"
    );
  }

  async function regenerateQuestion(
    index: number
  ) {
    setError("");
    setSuccess("");
    setGenerating(true);

    try {
      const generated =
        await requestQuestions(true);

      const replacement = generated[0];

      if (!replacement) {
        throw new Error(
          "AI did not return a question."
        );
      }

      setQuestions((current) =>
        current.map((question, questionIndex) =>
          questionIndex === index
            ? {
                ...question,
                question_text:
                  replacement.question_text,
                option_a:
                  replacement.option_a,
                option_b:
                  replacement.option_b,
                option_c:
                  replacement.option_c,
                option_d:
                  replacement.option_d,
                correct_answer:
                  replacement.correct_answer,
                marks: replacement.marks,
                explanation:
                  replacement.explanation,
              }
            : question
        )
      );

      setSuccess(
        "Question regenerated successfully."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Question regeneration failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateComplete() {
    setError("");
    setSuccess("");
    setGenerating(true);

    try {
      const generated =
        await requestQuestions(false);

      const nextQuestions: Question[] =
        generated.map((question, index) => ({
          id: Date.now() + index,
          test_id: 0,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          marks: question.marks,
          explanation: question.explanation,
          question_order: index + 1,
          created_at: new Date().toISOString(),
        }));

      setQuestions(nextQuestions);

      setForm((current) => ({
        ...current,
        total_marks: String(
          nextQuestions.reduce(
            (sum, question) =>
              sum + Number(question.marks || 0),
            0
          )
        ),
      }));

      setSuccess(
        "Complete AI question set regenerated."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Regeneration failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  function startNew() {
    setForm(blankTest());
    setEditing(null);
    setQuestions([]);
    setQuestionForm(null);
    setMainsQuestions([]);
    setSelectedMainsQuestion(null);
    setError("");
    setSuccess("");
    setProgress("");
  }

  function editQuestion(question: Question) {
    setQuestionForm({
      id: question.id,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer:
        question.correct_answer || "A",
      marks: String(question.marks ?? 1),
      explanation: question.explanation || "",
      question_order: String(
        question.question_order ?? 1
      ),
    });
        }
    async function generateMainsQuestions() {
    setError("");
    setSuccess("");
    setProgress("");

    if (!generator.stage_id) {
      setError("Please select an examination stage.");
      return;
    }

    if (!isMainExamination) {
      setError(
        "Mains question generation is available only for Main Examination."
      );
      return;
    }

    if (!generator.paper_id) {
      setError("Please select a paper.");
      return;
    }

    if (!generator.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!generator.topic_id) {
      setError("Please select a topic.");
      return;
    }

    const marks = Number(generator.marks);
    const wordLimit = Number(generator.wordLimit);
    const count = Number(generator.count);

    if (!Number.isFinite(marks) || marks <= 0) {
      setError("Please enter valid marks.");
      return;
    }

    if (
      !Number.isFinite(wordLimit) ||
      wordLimit < 50
    ) {
      setError(
        "Word limit must be at least 50 words."
      );
      return;
    }

    if (
      !Number.isFinite(count) ||
      count < 1 ||
      count > 20
    ) {
      setError(
        "Question count must be between 1 and 20."
      );
      return;
    }

    setGenerating(true);
    setMainsQuestions([]);
    setSelectedMainsQuestion(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const {
        stage,
        paper,
        subject,
        topic,
      } = getSelectedGeneratorContext();

      setProgress(
        "AI is creating UPSC/MPSC Mains questions..."
      );

      const response = await fetch(
        "/api/ai/mains-question",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            stage: stage?.name || "",
            paper: paper
              ? `Paper ${paper.paper_no} · ${paper.name}`
              : "",
            subject: subject?.name || "",
            topic: topic?.name || "",
            count,
            marks,
            wordLimit,
            difficulty: generator.difficulty,
            language: generator.language,
            instructions: generator.instructions,
            referenceText: generator.referenceText,
            referenceName: generator.referenceName,
          }),
        }
      );

      const result = (await response.json()) as {
        questions?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Mains question generation failed."
        );
      }

      if (!Array.isArray(result.questions)) {
        throw new Error(
          "AI returned an invalid question format."
        );
      }

      const generated: MainsQuestion[] =
        result.questions.map(
          (value, index) => {
            const item =
              value as Record<string, unknown>;

            return {
              id: undefined,
              question_text:
                String(
                  item.question_text || ""
                ).trim(),
              marks:
                Number(item.marks) || marks,
              word_limit:
                Number(item.word_limit) ||
                wordLimit,
              model_answer: "",
              answer_framework: "",
              key_points: Array.isArray(
                item.key_points
              )
                ? item.key_points.map((point) =>
                    String(point)
                  )
                : [],
              status: "draft",
            };
          }
        );

      const validQuestions =
        generated.filter(
          (question) =>
            question.question_text.length > 0
        );

      if (!validQuestions.length) {
        throw new Error(
          "AI did not return any valid Mains questions."
        );
      }

      setMainsQuestions(validQuestions);
      // Keep generated questions in view mode initially.
      // The user can open a question for editing by tapping Edit.
      setSelectedMainsQuestion(null);

      setProgress(
        `${validQuestions.length} Mains questions generated successfully.`
      );

      setSuccess(
        "Mains questions generated. You can now generate a model answer for each question."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Mains question generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  function updateMainsQuestion(
    index: number,
    patch: Partial<MainsQuestion>
  ) {
    setMainsQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              ...patch,
            }
          : question
      )
    );
  }

  function removeMainsQuestion(index: number) {
    setMainsQuestions((current) =>
      current.filter(
        (_, questionIndex) =>
          questionIndex !== index
      )
    );

    setSelectedMainsQuestion((current) => {
      if (current === null) {
        return null;
      }

      if (current === index) {
        return null;
      }

      if (current > index) {
        return current - 1;
      }

      return current;
    });
  }

  function selectMainsQuestion(index: number) {
    if (
      index < 0 ||
      index >= mainsQuestions.length
    ) {
      return;
    }

    setSelectedMainsQuestion(index);
  }

  function mainsQuestionSummary(
    question: MainsQuestion
  ) {
    const text =
      question.question_text.trim();

    if (text.length <= 90) {
      return text;
    }

    return `${text.slice(0, 90)}…`;
  }
    async function generateModelAnswer(index: number) {
    const question = mainsQuestions[index];

    if (!question) {
      return;
    }

    if (!question.question_text.trim()) {
      setError("Question text cannot be empty.");
      return;
    }

    setError("");
    setSuccess("");
    setProgress("");

    setGeneratingAnswer(index);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const {
        stage,
        paper,
        subject,
        topic,
      } = getSelectedGeneratorContext();

      setProgress(
        "AI is preparing the model answer..."
      );

      const response = await fetch(
        "/api/ai/mains-model-answer",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question: question.question_text,
            marks: question.marks,
            wordLimit: question.word_limit,
            stage: stage?.name || "",
            paper: paper
              ? `Paper ${paper.paper_no} · ${paper.name}`
              : "",
            subject: subject?.name || "",
            topic: topic?.name || "",
            language: generator.language,
            difficulty: generator.difficulty,
            instructions: generator.instructions,
            referenceText: generator.referenceText,
            referenceName: generator.referenceName,
          }),
        }
      );

      const result = (await response.json()) as {
        model_answer?: string;
        answer_framework?: string;
        key_points?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Model answer generation failed."
        );
      }

      const modelAnswer =
        String(result.model_answer || "").trim();

      if (!modelAnswer) {
        throw new Error(
          "AI did not return a model answer."
        );
      }

      const answerFramework =
        String(
          result.answer_framework || ""
        ).trim();

      const keyPoints = Array.isArray(
        result.key_points
      )
        ? result.key_points.map((point) =>
            String(point)
          )
        : [];

      updateMainsQuestion(index, {
        model_answer: modelAnswer,
        answer_framework: answerFramework,
        key_points: keyPoints,
      });

      setProgress(
        "Model answer generated successfully."
      );

      setSuccess(
        "Model answer generated. You can edit it before saving."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Model answer generation failed."
      );
    } finally {
      setGeneratingAnswer(null);
    }
  }

  async function saveMainsQuestion(
    index: number
  ) {
    const question = mainsQuestions[index];

    if (!question) {
      return;
    }

    if (!question.question_text.trim()) {
      setError("Question text cannot be empty.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const syllabusItemId = Number(
        generator.topic_id
      );

      const payload = {
        created_by: session.user.id,
        stage_id: Number(generator.stage_id),
        paper_id: Number(generator.paper_id),
        syllabus_item_id:
          Number.isFinite(syllabusItemId) &&
          syllabusItemId > 0
            ? syllabusItemId
            : null,
        question_text:
          question.question_text.trim(),
        marks: Number(question.marks),
        word_limit: Number(question.word_limit),
        model_answer:
          question.model_answer.trim() || null,
        answer_framework:
          question.answer_framework.trim() || null,
        key_points: question.key_points,
        status: question.status,
      };

      if (question.id) {
        const { error: updateError } =
          await supabase
            .from("mpsc_mains_questions")
            .update(payload)
            .eq("id", question.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setSuccess(
          "Mains question updated successfully."
        );
      } else {
        const { data, error: insertError } =
          await supabase
            .from("mpsc_mains_questions")
            .insert(payload)
            .select("id")
            .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        updateMainsQuestion(index, {
          id: data.id,
        });

        setSuccess(
          "Mains question saved successfully."
        );
      }

      setProgress("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Mains question."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAllMainsQuestions() {
    if (!mainsQuestions.length) {
      setError("There are no Mains questions to save.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const syllabusItemId = Number(
        generator.topic_id
      );

      const rows = mainsQuestions.map(
        (question) => ({
          ...(question.id
            ? { id: question.id }
            : {}),
          created_by: session.user.id,
          stage_id: Number(generator.stage_id),
          paper_id: Number(generator.paper_id),
          syllabus_item_id:
            Number.isFinite(syllabusItemId) &&
            syllabusItemId > 0
              ? syllabusItemId
              : null,
          question_text:
            question.question_text.trim(),
          marks: Number(question.marks),
          word_limit: Number(
            question.word_limit
          ),
          model_answer:
            question.model_answer.trim() || null,
          answer_framework:
            question.answer_framework.trim() ||
            null,
          key_points: question.key_points,
          status: question.status,
          updated_at: new Date().toISOString(),
        })
      );

      const { data, error: upsertError } =
        await supabase
          .from("mpsc_mains_questions")
          .upsert(rows, {
            onConflict: "id",
          })
          .select(
            "id, question_text, marks, word_limit, model_answer, answer_framework, key_points, status"
          );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      if (data) {
        setMainsQuestions((current) =>
          current.map((question, index) => {
            const saved = data[index];

            return saved
              ? {
                  ...question,
                  id: saved.id,
                  question_text:
                    saved.question_text,
                  marks: Number(saved.marks),
                  word_limit:
                    Number(saved.word_limit),
                  model_answer:
                    saved.model_answer || "",
                  answer_framework:
                    saved.answer_framework ||
                    "",
                  key_points:
                    Array.isArray(
                      saved.key_points
                    )
                      ? saved.key_points.map(
                          (point) =>
                            String(point)
                        )
                      : [],
                  status:
                    saved.status as
                      | "draft"
                      | "published"
                      | "rejected",
                }
              : question;
          })
        );
      }

      setSuccess(
        `${rows.length} Mains question${
          rows.length === 1 ? "" : "s"
        } saved successfully.`
      );
      setProgress("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Mains questions."
      );
    } finally {
      setSaving(false);
    }
  }

  async function generateLibraryModelAnswer(
    question: MainsLibraryQuestion
  ) {
    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const stage = stages.find((item) => item.id === question.stage_id);
      const paper = papers.find((item) => item.id === question.paper_id);
      const syllabusItem = items.find(
        (item) => item.id === question.syllabus_item_id
      );
      const subject =
        syllabusItem?.item_type === "subject"
          ? syllabusItem
          : items.find((item) => item.id === syllabusItem?.parent_id);
      const topic =
        syllabusItem && syllabusItem.item_type !== "subject"
          ? syllabusItem
          : subject;

      setProgress(
        `AI is preparing the model answer for question #${question.id}...`
      );

      const response = await fetch("/api/ai/mains-model-answer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question: question.question_text,
          marks: question.marks,
          wordLimit: question.word_limit,
          stage: stage?.name || "Main Examination",
          paper: paper
            ? `Paper ${paper.paper_no} · ${paper.name}`
            : "",
          subject: subject?.name || "",
          topic: topic?.name || "",
          language: generator.language || "English",
          difficulty: generator.difficulty || "Mixed",
          instructions: generator.instructions,
          referenceText: generator.referenceText,
          referenceName: generator.referenceName,
        }),
      });

      const result = (await response.json()) as {
        model_answer?: string;
        answer_framework?: string;
        key_points?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Model answer generation failed."
        );
      }

      const modelAnswer = String(result.model_answer || "").trim();
      if (!modelAnswer) {
        throw new Error("AI did not return a model answer.");
      }

      const answerFramework = String(
        result.answer_framework || ""
      ).trim();
      const keyPoints = Array.isArray(result.key_points)
        ? result.key_points.map((point) => String(point).trim()).filter(Boolean)
        : [];

      setMainsLibraryQuestions((current) =>
        current.map((item) =>
          item.id === question.id
            ? {
                ...item,
                model_answer: modelAnswer,
                answer_framework: answerFramework,
                key_points: keyPoints,
              }
            : item
        )
      );

      setProgress(
        "Model answer generated. Review it below, then save it."
      );
      setSuccess(
        "Model answer generated successfully. It has not been saved yet."
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Model answer generation failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveLibraryModelAnswer(
    question: MainsLibraryQuestion
  ) {
    if (!question.model_answer.trim()) {
      setError("Generate or enter a model answer before saving.");
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const { error: updateError } = await supabase
        .from("mpsc_mains_questions")
        .update({
          model_answer: question.model_answer.trim(),
          answer_framework: question.answer_framework.trim() || null,
          key_points: question.key_points,
          updated_at: new Date().toISOString(),
        })
        .eq("id", question.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(
        question.status === "published"
          ? "Model answer saved and is now available in the Premium Question Bank."
          : "Model answer saved successfully."
      );
      setProgress("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save model answer."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function publishMainsQuestion(
    index: number
  ) {
    const question = mainsQuestions[index];

    if (!question?.id) {
      setError(
        "Please save the question before publishing it."
      );
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const { error: updateError } =
        await supabase
          .from("mpsc_mains_questions")
          .update({
            status: "published",
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", question.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      updateMainsQuestion(index, {
        status: "published",
      });

      setSuccess(
        "Mains question published successfully."
      );
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Could not publish question."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function unpublishMainsQuestion(
    index: number
  ) {
    const question = mainsQuestions[index];

    if (!question?.id) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const { error: updateError } =
        await supabase
          .from("mpsc_mains_questions")
          .update({
            status: "draft",
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", question.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      updateMainsQuestion(index, {
        status: "draft",
      });

      setSuccess(
        "Mains question moved back to draft."
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update question."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMainsQuestion(
    index: number
  ) {
    const question = mainsQuestions[index];

    if (!question) {
      return;
    }

    if (!window.confirm(
      "Delete this Mains question permanently?"
    )) {
      return;
    }

    if (!question.id) {
      removeMainsQuestion(index);
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const { error: deleteError } =
        await supabase
          .from("mpsc_mains_questions")
          .delete()
          .eq("id", question.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      removeMainsQuestion(index);

      setSuccess(
        "Mains question deleted successfully."
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete question."
      );
    } finally {
      setBusyId(null);
    }
        }
  
  async function deleteMainsLibraryQuestion(question: MainsLibraryQuestion) {
    if (question.status !== "draft") {
      setError("Only draft Mains questions can be deleted from the library.");
      return;
    }

    if (
      !window.confirm(
        "Delete this draft Mains question permanently? This cannot be undone."
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(question.id);

    try {
      const { error: deleteError } = await supabase
        .from("mpsc_mains_questions")
        .delete()
        .eq("id", question.id)
        .eq("status", "draft");

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setMainsLibraryQuestions((current) =>
        current.filter((item) => item.id !== question.id)
      );
      setMainsQuestions((current) =>
        current.filter((item) => item.id !== question.id)
      );
      setSuccess("Draft Mains question deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete draft Mains question."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!form.title.trim()) {
        throw new Error("Test title is required.");
      }

      if (!form.paper_id) {
        throw new Error("Please select a paper.");
      }

      const isNewTest = !editing;

      const payload = {
        title: form.title.trim(),
        paper_id: Number(form.paper_id),
        syllabus_item_id: form.syllabus_item_id
          ? Number(form.syllabus_item_id)
          : null,
        duration_minutes:
          Number(form.duration_minutes) || 60,
        total_marks:
          Number(form.total_marks) || 0,
        negative_marking:
          Number(form.negative_marking) || 0,
        // Publishing is allowed only after questions exist.
        is_published: false,
      };

      let testId: number;

      if (editing) {
        const { error: updateError } =
          await supabase
            .from("mpsc_tests")
            .update(payload)
            .eq("id", editing.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        testId = editing.id;
      } else {
        const { data, error: insertError } =
          await supabase
            .from("mpsc_tests")
            .insert(payload)
            .select("*")
            .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        const createdTest = data as TestRecord;
        testId = createdTest.id;
        setEditing(createdTest);
      }

      // AI-generated MCQs are held in local state with test_id = 0.
      // When the test is saved, persist them to mpsc_questions so
      // students can actually open the published test.
      const unsavedQuestions = questions.filter(
        (question) =>
          !question.test_id ||
          Number(question.test_id) === 0
      );

      if (unsavedQuestions.length > 0) {
        const questionRows = unsavedQuestions.map(
          (question, index) => ({
            test_id: testId,
            question_text:
              question.question_text.trim(),
            option_a: question.option_a.trim(),
            option_b: question.option_b.trim(),
            option_c: question.option_c.trim(),
            option_d: question.option_d.trim(),
            correct_answer:
              question.correct_answer
                .trim()
                .toUpperCase()
                .charAt(0),
            marks: Number(question.marks) || 1,
            explanation:
              question.explanation?.trim() || "",
            question_order:
              Number(question.question_order) ||
              index + 1,
          })
        );

        if (isNewTest) {
          const { error: insertQuestionsError } =
            await supabase
              .from("mpsc_questions")
              .insert(questionRows);

          if (insertQuestionsError) {
            // Remove the just-created empty test so we do not leave
            // another unusable published/draft record behind.
            await supabase
              .from("mpsc_tests")
              .delete()
              .eq("id", testId);

            throw new Error(
              `Test was created but its questions could not be saved: ${insertQuestionsError.message}`
            );
          }
        } else {
          const { error: deleteOldError } =
            await supabase
              .from("mpsc_questions")
              .delete()
              .eq("test_id", testId);

          if (deleteOldError) {
            throw new Error(deleteOldError.message);
          }

          const { error: insertQuestionsError } =
            await supabase
              .from("mpsc_questions")
              .insert(questionRows);

          if (insertQuestionsError) {
            throw new Error(
              `Questions could not be saved: ${insertQuestionsError.message}`
            );
          }
        }

        setQuestions(
          questionRows.map((question, index) => ({
            id: Date.now() + index,
            ...question,
            test_id: testId,
            created_at:
              new Date().toISOString(),
          })) as Question[]
        );
      }

      const { data: savedQuestions, error: countError } =
        await supabase
          .from("mpsc_questions")
          .select("id")
          .eq("test_id", testId);

      if (countError) {
        throw new Error(countError.message);
      }

      const questionCount =
        savedQuestions?.length ?? 0;

      // Never leave a published test without questions.
      if (form.is_published && questionCount === 0) {
        throw new Error(
          "The test cannot be published because it has no questions."
        );
      }

      const { error: publishError } =
        await supabase
          .from("mpsc_tests")
          .update({
            is_published:
              Boolean(form.is_published) &&
              questionCount > 0,
          })
          .eq("id", testId);

      if (publishError) {
        throw new Error(publishError.message);
      }

      setSuccess(
        questionCount > 0
          ? `Test saved successfully with ${questionCount} question${questionCount === 1 ? "" : "s"}.`
          : "Test saved as draft. Add questions before publishing."
      );

      await load();
      await loadQuestions(testId);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save test."
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadQuestions(testId: number) {
    setError("");

    const { data, error: questionsError } =
      await supabase
        .from("mpsc_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_order");

    if (questionsError) {
      setError(questionsError.message);
      return;
    }

    setQuestions((data ?? []) as Question[]);
  }

  async function saveQuestion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!questionForm) {
      return;
    }

    if (!editing) {
      setError(
        "Please save the test before adding questions."
      );
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        test_id: editing.id,
        question_text:
          questionForm.question_text.trim(),
        option_a: questionForm.option_a.trim(),
        option_b: questionForm.option_b.trim(),
        option_c: questionForm.option_c.trim(),
        option_d: questionForm.option_d.trim(),
        correct_answer:
          questionForm.correct_answer
            .trim()
            .toUpperCase()
            .charAt(0),
        marks: Number(questionForm.marks) || 1,
        explanation:
          questionForm.explanation.trim(),
        question_order:
          Number(questionForm.question_order) || 1,
      };

      if (!payload.question_text) {
        throw new Error(
          "Question text is required."
        );
      }

      if (
        !["A", "B", "C", "D"].includes(
          payload.correct_answer
        )
      ) {
        throw new Error(
          "Correct answer must be A, B, C or D."
        );
      }

      if (questionForm.id) {
        const { error: updateError } =
          await supabase
            .from("mpsc_questions")
            .update(payload)
            .eq("id", questionForm.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setSuccess(
          "Question updated successfully."
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("mpsc_questions")
            .insert(payload);

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess(
          "Question added successfully."
        );
      }

      setQuestionForm(null);
      await loadQuestions(editing.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save question."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(
    questionId: number
  ) {
    if (
      !window.confirm(
        "Delete this question permanently?"
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } =
      await supabase
        .from("mpsc_questions")
        .delete()
        .eq("id", questionId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setQuestions((current) =>
      current.filter(
        (question) => question.id !== questionId
      )
    );

    setSuccess(
      "Question deleted successfully."
    );
  }

  async function togglePublish(
    test: TestRecord
  ) {
    setError("");
    setSuccess("");
    setBusyId(test.id);

    try {
      const nextPublished =
        !Boolean(test.is_published);

      if (nextPublished) {
        const { count, error: countError } =
          await supabase
            .from("mpsc_questions")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("test_id", test.id);

        if (countError) {
          throw new Error(countError.message);
        }

        if (!count || count < 1) {
          throw new Error(
            "This test cannot be published because it has no questions. Generate or add questions first."
          );
        }
      }

      const { error: updateError } =
        await supabase
          .from("mpsc_tests")
          .update({
            is_published: nextPublished,
          })
          .eq("id", test.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setTests((current) =>
        current.map((item) =>
          item.id === test.id
            ? {
                ...item,
                is_published: nextPublished,
              }
            : item
        )
      );

      setSuccess(
        nextPublished
          ? "Test published successfully."
          : "Test unpublished successfully."
      );
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Could not update publication status."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTest(
    test: TestRecord
  ) {
    if (
      !window.confirm(
        `Delete "${test.title}" permanently? This will also remove its questions.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(test.id);

    try {
      const { error: deleteQuestionsError } =
        await supabase
          .from("mpsc_questions")
          .delete()
          .eq("test_id", test.id);

      if (deleteQuestionsError) {
        throw new Error(
          deleteQuestionsError.message
        );
      }

      const { error: deleteTestError } =
        await supabase
          .from("mpsc_tests")
          .delete()
          .eq("id", test.id);

      if (deleteTestError) {
        throw new Error(
          deleteTestError.message
        );
      }

      setTests((current) =>
        current.filter(
          (item) => item.id !== test.id
        )
      );

      if (editing?.id === test.id) {
        startNew();
      }

      setSuccess(
        "Test deleted successfully."
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete test."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function editTest(test: TestRecord) {
    setEditing(test);

    setForm({
      title: test.title || "",
      stage_id: test.paper_id
        ? String(
            papers.find(
              (paper) => paper.id === test.paper_id
            )?.stage_id ?? ""
          )
        : "",
      paper_id: test.paper_id
        ? String(test.paper_id)
        : "",
      subject_id: "",
      syllabus_item_id:
        test.syllabus_item_id
          ? String(test.syllabus_item_id)
          : "",
      duration_minutes: String(
        test.duration_minutes ?? 60
      ),
      total_marks: String(
        test.total_marks ?? 0
      ),
      negative_marking: String(
        test.negative_marking ?? 0
      ),
      is_published:
        Boolean(test.is_published),
    });

    setQuestionForm(null);
    setMainsQuestions([]);
    setSelectedMainsQuestion(null);

    await loadQuestions(test.id);
  }

  function updateQuestionForm(
    patch: Partial<QuestionForm>
  ) {
    setQuestionForm((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current
    );
  }

  function addBlankQuestion() {
    setQuestionForm(
      blankQuestion(questions.length + 1)
    );
  }

  function editMainsQuestionText(
    index: number,
    value: string
  ) {
    updateMainsQuestion(index, {
      question_text: value,
    });
  }

  function editMainsAnswer(
    index: number,
    value: string
  ) {
    updateMainsQuestion(index, {
      model_answer: value,
    });
  }

  function editMainsFramework(
    index: number,
    value: string
  ) {
    updateMainsQuestion(index, {
      answer_framework: value,
    });
}
    return (
    <main className="page">
      <section className="admin-tests-card">
        <div className="tests-header">
          <div>
            <p className="eyebrow">ADMIN</p>
            <h1>Tests & Mains Questions</h1>
            <p>
              Create AI-generated Prelims MCQs or
              descriptive Main Examination questions.
            </p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={startNew}
            >
              New
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => router.push("/admin")}
            >
              Back to Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-success">
            {success}
          </div>
        )}

        {progress && (
          <div className="form-success">
            {progress}
          </div>
        )}

        {/* AI GENERATOR */}

        <details className="card ai-generator" open>
          <summary className="collapse-summary">
            <span>AI Generator · MPSC / UPSC Question Generator</span>
          </summary>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                AI GENERATOR
              </p>

              <h2>
                MPSC / UPSC Question Generator
              </h2>

              <p>
                Select the examination stage,
                paper and syllabus topic.
              </p>
            </div>
          </div>

          <form
            className="form"
            onSubmit={generateDraft}
          >
            <div className="form-grid">
              <label>
                Examination Stage
                <select
                  value={generator.stage_id}
                  onChange={(event) =>
                    handleGeneratorStageChange(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select Stage
                  </option>

                  {stages.map((stage) => (
                    <option
                      key={stage.id}
                      value={stage.id}
                    >
                      {stage.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Paper
                <select
                  value={generator.paper_id}
                  onChange={(event) =>
                    handleGeneratorPaperChange(
                      event.target.value
                    )
                  }
                  disabled={!generator.stage_id}
                  required
                >
                  <option value="">
                    Select Paper
                  </option>

                  {generatorPapers.map(
                    (paper) => (
                      <option
                        key={paper.id}
                        value={paper.id}
                      >
                        Paper {paper.paper_no} ·{" "}
                        {paper.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Subject
                <select
                  value={generator.subject_id}
                  onChange={(event) =>
                    handleGeneratorSubjectChange(
                      event.target.value
                    )
                  }
                  disabled={!generator.paper_id}
                  required
                >
                  <option value="">
                    Select Subject
                  </option>

                  {generatorSubjects.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Topic / Syllabus Area
                <select
                  value={generator.topic_id}
                  onChange={(event) =>
                    handleGeneratorTopicChange(
                      event.target.value
                    )
                  }
                  disabled={!generator.subject_id}
                  required
                >
                  <option value="">
                    Select Topic / Syllabus Area
                  </option>

                  {generatorTopics.length > 0 ? (
                    generatorTopics.map(
                      (topic) => (
                        <option
                          key={topic.id}
                          value={topic.id}
                        >
                          {topic.name}
                        </option>
                      )
                    )
                  ) : (
                    generatorSubjects
                      .filter(
                        (subject) =>
                          subject.id ===
                          Number(
                            generator.subject_id
                          )
                      )
                      .map((subject) => (
                        <option
                          key={subject.id}
                          value={subject.id}
                        >
                          {subject.name}
                        </option>
                      ))
                  )}
                </select>
              </label>

              <label>
                Number of Questions
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={generator.count}
                  onChange={(event) =>
                    updateGenerator({
                      count:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Difficulty
                <select
                  value={generator.difficulty}
                  onChange={(event) =>
                    updateGenerator({
                      difficulty:
                        event.target.value,
                    })
                  }
                >
                  <option value="Easy">
                    Easy
                  </option>
                  <option value="Moderate">
                    Moderate
                  </option>
                  <option value="Difficult">
                    Difficult
                  </option>
                  <option value="Mixed">
                    Mixed
                  </option>
                </select>
              </label>

              <label>
                Language
                <select
                  value={generator.language}
                  onChange={(event) =>
                    updateGenerator({
                      language:
                        event.target.value,
                    })
                  }
                >
                  <option value="English">
                    English
                  </option>
                  <option value="Marathi">
                    Marathi
                  </option>
                </select>
              </label>

              <label>
                Marks
                <input
                  type="number"
                  min="1"
                  value={generator.marks}
                  onChange={(event) =>
                    updateGenerator({
                      marks:
                        event.target.value,
                    })
                  }
                />
              </label>

              {isMainExamination && (
                <label>
                  Word Limit
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={generator.wordLimit}
                    onChange={(event) =>
                      updateGenerator({
                        wordLimit:
                          event.target.value,
                      })
                    }
                  />
                </label>
              )}

              {!isMainExamination && (
                <label>
                  Negative Marking
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      generator.negative_marking
                    }
                    onChange={(event) =>
                      updateGenerator({
                        negative_marking:
                          event.target.value,
                      })
                    }
                  />
                </label>
              )}

              {!isMainExamination && (
                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={generator.duration}
                    onChange={(event) =>
                      updateGenerator({
                        duration:
                          event.target.value,
                      })
                    }
                  />
                </label>
              )}

              <label>
                Generator Title
                <input
                  type="text"
                  value={generator.title}
                  onChange={(event) =>
                    updateGenerator({
                      title:
                        event.target.value,
                    })
                  }
                  placeholder={
                    isMainExamination
                      ? "Optional Mains set title"
                      : "Optional test title"
                  }
                />
              </label>
            </div>

            <label>
              Instructions
              <textarea
                value={generator.instructions}
                onChange={(event) =>
                  updateGenerator({
                    instructions:
                      event.target.value,
                  })
                }
                rows={3}
                placeholder={
                  isMainExamination
                    ? "Example: Focus on analytical dimensions, constitutional provisions and Maharashtra-specific examples."
                    : "Optional instructions for the AI."
                }
              />
            </label>

            <label>
              Reference Name
              <input
                type="text"
                value={generator.referenceName}
                onChange={(event) =>
                  updateGenerator({
                    referenceName:
                      event.target.value,
                  })
                }
                placeholder="Optional source/reference name"
              />
            </label>

            <label>
              Reference Text
              <textarea
                value={generator.referenceText}
                onChange={(event) =>
                  updateGenerator({
                    referenceText:
                      event.target.value,
                  })
                }
                rows={5}
                placeholder="Optional reference material for AI generation."
              />
            </label>

            {isMainExamination ? (
              <div className="actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={generating}
                >
                  {generating
                    ? "Generating Mains Questions..."
                    : "Generate Mains Questions"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={resetGenerator}
                  disabled={generating}
                >
                  Reset
                </button>
              </div>
            ) : (
              <div className="actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={generating}
                >
                  {generating
                    ? "Generating MCQs..."
                    : "Generate AI MCQs"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={resetGenerator}
                  disabled={generating}
                >
                  Reset
                </button>
              </div>
            )}
          </form>
        </details>

        {/* MAINS QUESTIONS */}

        {isMainExamination &&
          mainsQuestions.length > 0 && (
            <details className="card collapsible-card" open>
              <summary className="collapse-summary">
                <span>Generated Mains Questions</span>
              </summary>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    MAIN EXAMINATION
                  </p>

                  <h2>
                    Generated Mains Questions
                  </h2>

                  <p>
                    Review the questions, generate
                    model answers and edit them
                    before publishing.
                  </p>
                </div>

                <div className="actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={
                      saveAllMainsQuestions
                    }
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save All Questions"}
                  </button>
                </div>
              </div>

              <div className="form-grid">
                {mainsQuestions.map(
                  (question, index) => (
                    <article
                      className="question-editor"
                      key={
                        question.id ??
                        `mains-${index}`
                      }
                    >
                      <div className="section-heading">
                        <div>
                          <strong>
                            Question {index + 1}
                          </strong>

                          <p>
                            {question.marks} Marks ·{" "}
                            {question.word_limit} Words
                          </p>
                        </div>

                        <div className="actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              selectMainsQuestion(
                                index
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="reject"
                            onClick={() =>
                              deleteMainsQuestion(
                                index
                              )
                            }
                            disabled={
                              busyId ===
                              question.id
                            }
                          >
                            Delete
                          </button>
                          {question.id &&
                            question.status !== "published" && (
                              <button
                                type="button"
                                className="primary"
                                onClick={() =>
                                  publishMainsQuestion(index)
                                }
                                disabled={busyId === question.id}
                              >
                                Publish
                              </button>
                            )}

                          {question.id &&
                            question.status === "published" && (
                              <button
                                type="button"
                                className="secondary"
                                onClick={() =>
                                  unpublishMainsQuestion(index)
                                }
                                disabled={busyId === question.id}
                              >
                                Unpublish
                              </button>
                            )}
                        </div>
                      </div>

                      <p>
                        {mainsQuestionSummary(
                          question
                        )}
                      </p>

                      {selectedMainsQuestion ===
                        index && (
                        <>
                          <label>
                            Question
                            <textarea
                              value={
                                question.question_text
                              }
                              onChange={(event) =>
                                editMainsQuestionText(
                                  index,
                                  event.target.value
                                )
                              }
                              rows={5}
                            />
                          </label>

                          <div className="form-grid">
                            <label>
                              Marks
                              <input
                                type="number"
                                min="1"
                                value={
                                  question.marks
                                }
                                onChange={(event) =>
                                  updateMainsQuestion(
                                    index,
                                    {
                                      marks:
                                        Number(
                                          event
                                            .target
                                            .value
                                        ) || 1,
                                    }
                                  )
                                }
                              />
                            </label>

                            <label>
                              Word Limit
                              <input
                                type="number"
                                min="50"
                                value={
                                  question.word_limit
                                }
                                onChange={(event) =>
                                  updateMainsQuestion(
                                    index,
                                    {
                                      word_limit:
                                        Number(
                                          event
                                            .target
                                            .value
                                        ) || 50,
                                    }
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="actions">
                            <button
                              type="button"
                              className="primary"
                              onClick={() =>
                                generateModelAnswer(
                                  index
                                )
                              }
                              disabled={
                                generatingAnswer ===
                                index
                              }
                            >
                              {generatingAnswer ===
                              index
                                ? "Generating Answer..."
                                : "Generate Model Answer"}
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                saveMainsQuestion(
                                  index
                                )
                              }
                              disabled={saving}
                            >
                              Save Question
                            </button>
                          </div>

                          {question.model_answer && (
                            <label>
                              Model Answer
                              <textarea
                                value={
                                  question.model_answer
                                }
                                onChange={(event) =>
                                  editMainsAnswer(
                                    index,
                                    event.target.value
                                  )
                                }
                                rows={16}
                              />
                            </label>
                          )}

                          {question.answer_framework && (
                            <label>
                              Answer Framework
                              <textarea
                                value={
                                  question.answer_framework
                                }
                                onChange={(event) =>
                                  editMainsFramework(
                                    index,
                                    event.target.value
                                  )
                                }
                                rows={8}
                              />
                            </label>
                          )}

                          {question.key_points.length >
                            0 && (
                            <div>
                              <strong>
                                Key Points
                              </strong>

                              <ul>
                                {question.key_points.map(
                                  (
                                    point,
                                    pointIndex
                                  ) => (
                                    <li
                                      key={
                                        pointIndex
                                      }
                                    >
                                      {point}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="actions">
                            <span>
                              Status:{" "}
                              {question.status}
                            </span>
                          </div>
                        </>
                      )}
                    </article>
                  )
                )}
              </div>
            </details>
          )}
        {/* MCQ QUESTIONS */}

        {!isMainExamination &&
          questions.length > 0 && (
            <details className="card collapsible-card" open>
              <summary className="collapse-summary">
                <span>Generated AI MCQ Questions</span>
              </summary>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    AI MCQ QUESTIONS
                  </p>

                  <h2>
                    Generated Questions
                  </h2>
                </div>

                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={
                      regenerateComplete
                    }
                    disabled={generating}
                  >
                    Regenerate All
                  </button>
                </div>
              </div>

              <div className="form-grid">
                {questions.map(
                  (question, index) => (
                    <article
                      className="question-editor"
                      key={question.id}
                    >
                      <div className="section-heading">
                        <strong>
                          Question {index + 1}
                        </strong>

                        <div className="actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              editQuestion(
                                question
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              regenerateQuestion(
                                index
                              )
                            }
                            disabled={generating}
                          >
                            Regenerate
                          </button>

                          <button
                            type="button"
                            className="reject"
                            onClick={() =>
                              deleteQuestion(
                                question.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p>
                        {question.question_text}
                      </p>

                      <ol type="A">
                        {optionKeys.map(
                          (key) => (
                            <li key={key}>
                              {
                                question[
                                  `option_${key.toLowerCase()}` as keyof Question
                                ]
                              }
                            </li>
                          )
                        )}
                      </ol>

                      <p>
                        <strong>
                          Correct:
                        </strong>{" "}
                        {question.correct_answer}
                      </p>
                    </article>
                  )
                )}
              </div>
            </details>
          )}
        {/* MANUAL TEST EDITOR */}

        {!isMainExamination && (
          <details className="card collapsible-card">
            <summary className="collapse-summary">
              <span>Test Editor · Create Manual Test</span>
            </summary>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  TEST EDITOR
                </p>

                <h2>
                  {editing
                    ? "Edit Test"
                    : "Create Manual Test"}
                </h2>
              </div>

              {editing && (
                <button
                  type="button"
                  className="secondary"
                  onClick={startNew}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form
              className="form"
              onSubmit={saveTest}
            >
              <div className="form-grid">
                <label>
                  Test Title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title:
                          event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                    <label>
                  Examination Stage
                  <select
                    value={form.stage_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stage_id:
                          event.target.value,
                        paper_id: "",
                        subject_id: "",
                        syllabus_item_id: "",
                      }))
                    }
                    required
                  >
                    <option value="">
                      Select Stage
                    </option>

                    {stages.map((stage) => (
                      <option
                        key={stage.id}
                        value={stage.id}
                      >
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Paper
                  <select
                    value={form.paper_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paper_id:
                          event.target.value,
                        syllabus_item_id: "",
                      }))
                    }
                    disabled={!form.stage_id}
                    required
                  >
                    <option value="">
                      Select Paper
                    </option>

                    {papers
                      .filter(
                        (paper) =>
                          paper.stage_id ===
                          Number(
                            form.stage_id
                          )
                      )
                      .map((paper) => (
                        <option
                          key={paper.id}
                          value={paper.id}
                        >
                          Paper{" "}
                          {paper.paper_no} ·{" "}
                          {paper.name}
                        </option>
                      ))}
                  </select>
                </label>
                   <label>
                  Topic
                  <select
                    value={
                      form.syllabus_item_id
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        syllabus_item_id:
                          event.target.value,
                      }))
                    }
                    disabled={!form.paper_id}
                  >
                    <option value="">
                      Select Topic
                    </option>

                    {items
                      .filter(
                        (item) =>
                          item.paper_id ===
                            Number(
                              form.paper_id
                            ) &&
                          item.item_type !==
                            "subject"
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={
                      form.duration_minutes
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        duration_minutes:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Total Marks
                  <input
                    type="number"
                    min="0"
                    value={form.total_marks}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        total_marks:
                          event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Negative Marking
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.negative_marking
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        negative_marking:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Published
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_published:
                        event.target.checked,
                    }))
                  }
                />
              </label>

              <div className="actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Test"
                      : "Create Test"}
                </button>

                {editing && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={addBlankQuestion}
                  >
                    Add Question
                  </button>
                )}
              </div>
            </form>
            {/* QUESTION FORM */}

            {questionForm && editing && (
              <form
                className="question-editor"
                onSubmit={saveQuestion}
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">
                      QUESTION
                    </p>

                    <h3>
                      {questionForm.id
                        ? "Edit Question"
                        : "Add Question"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setQuestionForm(null)
                    }
                  >
                    Close
                  </button>
                </div>

                <label>
                  Question
                  <textarea
                    value={
                      questionForm.question_text
                    }
                    onChange={(event) =>
                      updateQuestionForm({
                        question_text:
                          event.target.value,
                      })
                    }
                    rows={5}
                    required
                  />
                </label>

                <div className="form-grid">
                  <label>
                    Option A
                    <input
                      type="text"
                      value={
                        questionForm.option_a
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          option_a:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                    <label>
                    Option B
                    <input
                      type="text"
                      value={
                        questionForm.option_b
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          option_b:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Option C
                    <input
                      type="text"
                      value={
                        questionForm.option_c
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          option_c:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Option D
                    <input
                      type="text"
                      value={
                        questionForm.option_d
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          option_d:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Correct Answer
                    <select
                      value={
                        questionForm.correct_answer
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          correct_answer:
                            event.target.value,
                        })
                      }
                    >
                      <option value="A">
                        A
                      </option>
                      <option value="B">
                        B
                      </option>
                      <option value="C">
                        C
                      </option>
                      <option value="D">
                        D
                      </option>
                    </select>
                  </label>
                   <label>
                    Marks
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        questionForm.marks
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          marks:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Question Order
                    <input
                      type="number"
                      min="1"
                      value={
                        questionForm.question_order
                      }
                      onChange={(event) =>
                        updateQuestionForm({
                          question_order:
                            event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label>
                  Explanation
                  <textarea
                    value={
                      questionForm.explanation
                    }
                    onChange={(event) =>
                      updateQuestionForm({
                        explanation:
                          event.target.value,
                      })
                    }
                    rows={5}
                  />
                </label>

                <div className="actions">
                  <button
                    type="submit"
                    className="primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : questionForm.id
                        ? "Update Question"
                        : "Save Question"}
                  </button>
                </div>
              </form>
            )}
              {/* EXISTING QUESTIONS */}

            {editing && questions.length > 0 && (
              <div className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">
                      SAVED QUESTIONS
                    </p>

                    <h3>
                      Questions in this test
                    </h3>
                  </div>
                </div>

                <div className="form-grid">
                  {questions.map(
                    (question, index) => (
                      <article
                        className="question-editor"
                        key={question.id}
                      >
                        <strong>
                          Question {index + 1}
                        </strong>

                        <p>
                          {question.question_text}
                        </p>

                        <div className="actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              editQuestion(
                                question
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="reject"
                            onClick={() =>
                              deleteQuestion(
                                question.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </div>
            )}
          </details>
        )}
        {/* MAINS QUESTION LIBRARY */}

        <details className="card collapsible-card">
          <summary className="collapse-summary">
            <span>Mains Question Library</span>
          </summary>
          <div className="section-heading">
            <div>
              <p className="eyebrow">MAIN EXAMINATION</p>
              <h2>Mains Question Library</h2>
              <p>
                Saved Mains questions are managed separately from the
                Prelims MCQ test library.
              </p>
            </div>
          </div>

          {mainsLibraryQuestions.length === 0 ? (
            <p>No Mains questions have been saved yet.</p>
          ) : (
            <div className="form-grid">
              {mainsLibraryQuestions.map((question) => (
                <article
                  className="question-editor"
                  key={`mains-library-${question.id}`}
                >
                  <div className="section-heading">
                    <div>
                      <strong>
                        {question.marks} Marks · {question.word_limit} Words
                      </strong>
                      <p>
                        {stages.find((s) => s.id === question.stage_id)?.name ||
                          "Main Examination"}
                        {papers.find((p) => p.id === question.paper_id)
                          ? ` · ${
                              papers.find((p) => p.id === question.paper_id)
                                ?.name
                            }`
                          : ""}
                      </p>
                    </div>
                    <span>
                      Status: <strong>{question.status}</strong>
                    </span>
                  </div>

                  <p>{question.question_text}</p>

                  <label>
                    Model Answer
                    <textarea
                      value={question.model_answer}
                      onChange={(event) =>
                        setMainsLibraryQuestions((current) =>
                          current.map((item) =>
                            item.id === question.id
                              ? {
                                  ...item,
                                  model_answer: event.target.value,
                                }
                              : item
                          )
                        )
                      }
                      rows={10}
                      placeholder="Generate an AI model answer or enter/edit one manually..."
                    />
                  </label>

                  <div className="actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => generateLibraryModelAnswer(question)}
                      disabled={busyId === question.id}
                    >
                      {busyId === question.id
                        ? "Generating..."
                        : question.model_answer
                          ? "Regenerate Model Answer"
                          : "Generate Model Answer"}
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => saveLibraryModelAnswer(question)}
                      disabled={
                        busyId === question.id || !question.model_answer.trim()
                      }
                    >
                      Save Model Answer
                    </button>
                  </div>

                  <div className="actions">
                    {question.status !== "published" ? (
                      <button
                        type="button"
                        className="primary"
                        onClick={async () => {
                          setError("");
                          setSuccess("");
                          setBusyId(question.id);
                          try {
                            const { error: updateError } = await supabase
                              .from("mpsc_mains_questions")
                              .update({
                                status: "published",
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", question.id);

                            if (updateError) {
                              throw new Error(updateError.message);
                            }

                            setMainsLibraryQuestions((current) =>
                              current.map((item) =>
                                item.id === question.id
                                  ? { ...item, status: "published" }
                                  : item
                              )
                            );
                            setMainsQuestions((current) =>
                              current.map((item) =>
                                item.id === question.id
                                  ? { ...item, status: "published" }
                                  : item
                              )
                            );
                            setSuccess(
                              "Mains question published successfully."
                            );
                          } catch (publishError) {
                            setError(
                              publishError instanceof Error
                                ? publishError.message
                                : "Could not publish question."
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={busyId === question.id}
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary"
                        onClick={async () => {
                          setError("");
                          setSuccess("");
                          setBusyId(question.id);
                          try {
                            const { error: updateError } = await supabase
                              .from("mpsc_mains_questions")
                              .update({
                                status: "draft",
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", question.id);

                            if (updateError) {
                              throw new Error(updateError.message);
                            }

                            setMainsLibraryQuestions((current) =>
                              current.map((item) =>
                                item.id === question.id
                                  ? { ...item, status: "draft" }
                                  : item
                              )
                            );
                            setMainsQuestions((current) =>
                              current.map((item) =>
                                item.id === question.id
                                  ? { ...item, status: "draft" }
                                  : item
                              )
                            );
                            setSuccess(
                              "Mains question moved back to draft."
                            );
                          } catch (updateError) {
                            setError(
                              updateError instanceof Error
                                ? updateError.message
                                : "Could not update question."
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={busyId === question.id}
                      >
                        Unpublish
                      </button>
                    )}

                    {question.status === "draft" && (
                      <button
                        type="button"
                        className="reject"
                        onClick={() =>
                          deleteMainsLibraryQuestion(question)
                        }
                        disabled={busyId === question.id}
                      >
                        Delete Draft
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </details>

        {/* EXISTING TESTS */}

        <details className="card collapsible-card">
          <summary className="collapse-summary">
            <span>Test Library · Existing Tests</span>
          </summary>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                TEST LIBRARY
              </p>

              <h2>
                Existing Tests
              </h2>

              <p>
                Manage previously created
                Prelims tests.
              </p>
            </div>
          </div>

          {loading ? (
            <p>Loading tests...</p>
          ) : tests.length === 0 ? (
            <p>
              No tests have been created yet.
            </p>
          ) : (
            <div className="form-grid">
              {tests.map((test) => (
                <article
                  className="question-editor"
                  key={test.id}
                >
                  <div className="section-heading">
                    <div>
                      <h3>{test.title}</h3>

                      <p>
                        {formatDuration(
                          test.duration_minutes
                        )}{" "}
                        ·{" "}
                        {test.total_marks} marks
                        {Number(
                          test.negative_marking
                        ) > 0
                          ? ` · Negative ${formatPenalty(
                              test.negative_marking
                            )}`
                          : ""}
                      </p>
                    </div>

                    <strong>
                      {test.is_published
                        ? "Published"
                        : "Draft"}
                    </strong>
                  </div>

                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        editTest(test)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="primary"
                      onClick={() =>
                        togglePublish(test)
                      }
                      disabled={
                        busyId === test.id
                      }
                    >
                      {test.is_published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="reject"
                      onClick={() =>
                        deleteTest(test)
                      }
                      disabled={
                        busyId === test.id
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </details>
      </section>

        <style jsx>{`
          .page {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .admin-tests-card {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          .tests-header {
            width: 100%;
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 16px;
          }

          .tests-header > div:first-child {
            min-width: 0;
            flex: 1 1 420px;
          }

          .tests-header h1,
          .tests-header h2,
          .tests-header h3,
          .section-heading h1,
          .section-heading h2,
          .section-heading h3 {
            min-width: 0;
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .tests-header .actions {
            min-width: 0;
            flex: 0 1 auto;
            max-width: 100%;
          }

          .form-grid {
            min-width: 0;
          }

          .form-grid > *,
          .card,
          .question-editor,
          .ai-generator {
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
          }

          label {
            min-width: 0;
            max-width: 100%;
          }

          input,
          select,
          textarea,
          button {
            max-width: 100%;
            box-sizing: border-box;
          }

          select,
          input,
          textarea {
            min-width: 0;
          }

          .collapse-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: pointer;
            list-style: none;
            font-size: 1.05rem;
            font-weight: 800;
            min-width: 0;
            padding: 2px 0;
            user-select: none;
          }

          .collapse-summary::-webkit-details-marker {
            display: none;
          }

          .collapse-summary::after {
            content: "＋";
            flex: 0 0 auto;
            font-size: 1.35rem;
            line-height: 1;
          }

          details[open] > .collapse-summary::after {
            content: "−";
          }

          details[open] > .collapse-summary {
            margin-bottom: 14px;
          }

          .collapsible-card > .section-heading,
          .ai-generator > .section-heading {
            min-width: 0;
          }

          @media (max-width: 700px) {
            .page {
              padding: 12px !important;
            }

            .admin-tests-card {
              padding: 0 !important;
            }

            .tests-header {
              display: flex;
              flex-direction: column;
              width: 100%;
              gap: 14px;
            }

            .tests-header > div:first-child {
              width: 100%;
              flex: none;
            }

            .tests-header .actions {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }

            .tests-header .actions button {
              width: 100%;
              min-width: 0;
              white-space: normal;
            }

            .tests-header h1 {
              font-size: clamp(28px, 8vw, 40px);
              line-height: 1.1;
            }

            .tests-header p {
              max-width: 100%;
              overflow-wrap: anywhere;
            }

            .form-grid {
              grid-template-columns: 1fr !important;
              width: 100%;
            }

            .section-heading {
              min-width: 0;
              max-width: 100%;
            }

            .section-heading > div {
              min-width: 0;
              max-width: 100%;
            }

            .actions {
              flex-wrap: wrap;
              max-width: 100%;
            }

            .actions button {
              max-width: 100%;
            }

            select,
            input,
            textarea {
              width: 100%;
              font-size: 16px;
            }

            textarea {
              min-height: 120px;
            }

            .collapse-summary {
              font-size: 0.98rem;
              min-height: 42px;
              padding: 4px 2px;
            }

            details.collapsible-card,
            details.ai-generator {
              padding: 14px !important;
            }

            details[open] > .collapse-summary {
              margin-bottom: 10px;
            }

            .card,
            .question-editor {
              width: 100%;
              overflow: hidden;
            }
          }

          @media (max-width: 430px) {
            .page {
              padding: 10px !important;
            }

            .tests-header .actions {
              grid-template-columns: 1fr;
            }

            .tests-header h1 {
              font-size: 30px;
            }
          }
        `}</style>
    </main>
  );
}
      
