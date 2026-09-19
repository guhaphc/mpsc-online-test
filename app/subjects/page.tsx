"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stage = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
};

type Paper = {
  id: number;
  stage_id: number;
  paper_no: number;
  code: string | null;
  name: string;
  marks: number;
  duration_minutes: number;
  standard: string | null;
  medium: string | null;
  qualifying: boolean;
  description: string | null;
  sort_order: number;
};

type SyllabusItem = {
  id: number;
  paper_id: number;
  parent_id: number | null;
  item_type: "subject" | "topic" | "subtopic";
  name: string;
  description: string | null;
  sort_order: number;
  source_page: number | null;
};

export default function SubjectsPage() {
  const router = useRouter();

  const [stages, setStages] = useState<Stage[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<SyllabusItem[]>([]);

  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedSubject, setSelectedSubject] =
    useState<SyllabusItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSyllabus();
  }, []);

  async function loadSyllabus() {
    setLoading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/");
      return;
    }

    const { data: stageData, error: stageError } = await supabase
      .from("mpsc_exam_stages")
      .select("*")
      .order("sort_order");

    if (stageError) {
      setError(stageError.message);
      setLoading(false);
      return;
    }

    const { data: paperData, error: paperError } = await supabase
      .from("mpsc_papers")
      .select("*")
      .order("sort_order");

    if (paperError) {
      setError(paperError.message);
      setLoading(false);
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from("mpsc_syllabus_items")
      .select("*")
      .order("sort_order");

    if (itemError) {
      setError(itemError.message);
      setLoading(false);
      return;
    }

    setStages(stageData || []);
    setPapers(paperData || []);
    setItems(itemData || []);
    setLoading(false);
  }

  function subjectsForPaper(paperId: number) {
    return items.filter(
      (item) =>
        item.paper_id === paperId &&
        item.item_type === "subject" &&
        item.parent_id === null
    );
  }

  function subtopicsForSubject(subjectId: number) {
    return items
      .filter(
        (item) =>
          item.parent_id === subjectId &&
          item.item_type === "subtopic"
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function papersForStage(stageId: number) {
    return papers
      .filter((paper) => paper.stage_id === stageId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function resetToStages() {
    setSelectedStage(null);
    setSelectedPaper(null);
    setSelectedSubject(null);
  }

  function resetToPapers() {
    setSelectedPaper(null);
    setSelectedSubject(null);
  }

  function resetToSubjects() {
    setSelectedSubject(null);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <p>Loading syllabus...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="card">
          <h2>Unable to load syllabus</h2>
          <p>{error}</p>
          <button onClick={loadSyllabus}>Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card subjects-card">
        <div className="subjects-header">
          <div>
            <div className="eyebrow">MPSC RAJYASEVA</div>
            <h1>Syllabus</h1>
            <p>Complete examination structure and detailed syllabus</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => router.push("/student")}
          >
            Dashboard
          </button>
        </div>

        {/* STAGE */}
        {!selectedStage && (
          <section>
            <h2>Select Examination</h2>

            <div className="subject-list">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className="subject-card"
                  onClick={() => setSelectedStage(stage)}
                >
                  <div>
                    <strong>{stage.name}</strong>
                    <span>
                      {papersForStage(stage.id).length} papers
                    </span>
                  </div>
                  <span className="arrow">›</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* PAPERS */}
        {selectedStage && !selectedPaper && (
          <section>
            <div className="breadcrumb">
              <button onClick={resetToStages}>Examination</button>
              <span>›</span>
              <strong>{selectedStage.name}</strong>
            </div>

            <h2>Select Paper</h2>

            <div className="subject-list">
              {papersForStage(selectedStage.id).map((paper) => (
                <button
                  key={paper.id}
                  className="subject-card"
                  onClick={() => setSelectedPaper(paper)}
                >
                  <div>
                    <strong>
                      Paper {paper.paper_no} — {paper.name}
                    </strong>

                    <span>
                      {paper.marks} marks ·{" "}
                      {paper.duration_minutes / 60} hours
                      {paper.qualifying ? " · Qualifying" : ""}
                    </span>
                  </div>

                  <span className="arrow">›</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SUBJECTS / TOPICS */}
        {selectedStage && selectedPaper && !selectedSubject && (
          <section>
            <div className="breadcrumb">
              <button onClick={resetToStages}>Examination</button>
              <span>›</span>
              <button onClick={resetToPapers}>
                {selectedStage.name}
              </button>
              <span>›</span>
              <strong>
                Paper {selectedPaper.paper_no}
              </strong>
            </div>

            <h2>{selectedPaper.name}</h2>

            {selectedPaper.description && (
              <div className="info-box">
                {selectedPaper.description}
              </div>
            )}

            <div className="subject-list">
              {subjectsForPaper(selectedPaper.id).map((subject, index) => {
                const subtopics = subtopicsForSubject(subject.id);

                return (
                  <button
                    key={subject.id}
                    className="subject-card"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div>
                      <strong>
                        {index + 1}. {subject.name}
                      </strong>

                      <span>
                        {subtopics.length > 0
                          ? `${subtopics.length} detailed subtopics`
                          : "View syllabus area"}
                      </span>
                    </div>

                    <span className="arrow">›</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* SUBTOPICS */}
        {selectedStage &&
          selectedPaper &&
          selectedSubject && (
            <section>
              <div className="breadcrumb">
                <button onClick={resetToStages}>
                  Examination
                </button>
                <span>›</span>
                <button onClick={resetToPapers}>
                  {selectedStage.name}
                </button>
                <span>›</span>
                <button onClick={resetToSubjects}>
                  Paper {selectedPaper.paper_no}
                </button>
                <span>›</span>
                <strong>Topic</strong>
              </div>

              <h2>{selectedSubject.name}</h2>

              {selectedSubject.description && (
                <div className="info-box">
                  {selectedSubject.description}
                </div>
              )}

              <div className="topic-list">
                {subtopicsForSubject(selectedSubject.id).length === 0 ? (
                  <div className="empty-box">
                    Detailed subtopics will be added here.
                  </div>
                ) : (
                  subtopicsForSubject(selectedSubject.id).map(
                    (topic, index) => (
                      <div key={topic.id} className="topic-card">
                        <div className="topic-number">
                          {index + 1}
                        </div>

                        <div>
                          <strong>{topic.name}</strong>


                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}
