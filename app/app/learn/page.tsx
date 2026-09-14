"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Item = {
  id: number;
  name: string;
  item_type: string;
  parent_id: number | null;
  paper_id: number;
};

type Note = {
  id: number;
  syllabus_item_id: number | null;
  topic_id: number | null;
  title: string;
  content: string;
  language: string;
  status: string;
  version: number;
  updated_at: string;
  published_at: string | null;
};

export default function LearnPage() {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stage, setStage] = useState("");
  const [paper, setPaper] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/");
      return;
    }

    const { data: profile } = await supabase
      .from("mpsc_profiles")
      .select("access_status, role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (
      !profile ||
      (profile.role !== "admin" && profile.access_status !== "approved")
    ) {
      router.replace("/pending");
      return;
    }

    const [itemsResult, notesResult] = await Promise.all([
      supabase
        .from("mpsc_syllabus_items")
        .select("id,name,item_type,parent_id,paper_id")
        .order("sort_order", { ascending: true }),

      supabase
        .from("ai_note_documents")
        .select(
          "id,syllabus_item_id,topic_id,title,content,language,status,version,updated_at,published_at"
        )
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
    ]);

    if (itemsResult.error) {
      setError(itemsResult.error.message);
      setLoading(false);
      return;
    }

    if (notesResult.error) {
      setError(notesResult.error.message);
      setLoading(false);
      return;
    }

    setItems((itemsResult.data || []) as Item[]);
    setNotes((notesResult.data || []) as Note[]);
    setLoading(false);
  }

  const stages = useMemo(
    () =>
      items.filter(
        (x) => x.item_type === "stage" || x.item_type === "exam_stage"
      ),
    [items]
  );

  const papers = useMemo(
    () =>
      items.filter(
        (x) =>
          x.item_type === "paper" &&
          (!stage || String(x.parent_id) === stage)
      ),
    [items, stage]
  );

  const subjects = useMemo(
    () =>
      items.filter(
        (x) =>
          x.item_type === "subject" &&
          (!paper || String(x.paper_id) === paper)
      ),
    [items, paper]
  );

  const topics = useMemo(
    () =>
      items.filter(
        (x) =>
          (x.item_type === "topic" || x.item_type === "subtopic") &&
          (!subject || String(x.parent_id) === subject)
      ),
    [items, subject]
  );

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (topic && String(note.syllabus_item_id) !== topic) return false;

      if (
        !topic &&
        subject &&
        !(
          String(note.syllabus_item_id) === subject ||
          String(note.topic_id) === subject
        )
      ) {
        return false;
      }

      return true;
    });
  }, [notes, topic, subject]);

  function resetFrom(level: "stage" | "paper" | "subject") {
    if (level === "stage") {
      setPaper("");
      setSubject("");
      setTopic("");
    }

    if (level === "paper") {
      setSubject("");
      setTopic("");
    }

    if (level === "subject") {
      setTopic("");
    }

    setSelectedNote(null);
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="page-card">
          <p>Loading Study Notes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-card">
        <div className="subjects-header">
          <div>
            <p className="eyebrow">MPSC / UPSC</p>
            <h1>Study Notes</h1>
            <p className="muted">
              Read syllabus-linked, AI-assisted study material.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() => router.push("/student")}
          >
            Dashboard
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="note-filters">
          <label>
            Examination Stage
            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                resetFrom("stage");
              }}
            >
              <option value="">All Stages</option>
              {stages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Paper
            <select
              value={paper}
              onChange={(e) => {
                setPaper(e.target.value);
                resetFrom("paper");
              }}
            >
              <option value="">All Papers</option>
              {papers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                resetFrom("subject");
              }}
            >
              <option value="">All Subjects</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Topic
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSelectedNote(null);
              }}
            >
              <option value="">All Topics</option>
              {topics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!selectedNote ? (
          <section className="notes-list">
            <div className="section-heading">
              <h2>Available Notes</h2>
              <span>{filteredNotes.length}</span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="info-box">
                No published notes are available for the selected syllabus
                section yet.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  className="note-card"
                  onClick={() => setSelectedNote(note)}
                >
                  <div>
                    <h3>{note.title}</h3>
                    <p>
                      {note.language || "English"} · Version {note.version}
                    </p>
                  </div>

                  <span className="note-arrow">›</span>
                </button>
              ))
            )}
          </section>
        ) : (
          <section className="note-reader">
            <button
              className="back-button"
              onClick={() => setSelectedNote(null)}
            >
              ← Back to Notes
            </button>

            <article className="note-content">
              <div className="note-meta">
                {selectedNote.language || "English"} · Version{" "}
                {selectedNote.version}
              </div>

              <h1>{selectedNote.title}</h1>

              <div className="note-body">
                {selectedNote.content}
              </div>
            </article>
          </section>
        )}
      </div>
    </main>
  );
              }
