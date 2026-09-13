"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Subject = {
  id: number;
  name: string;
  description: string | null;
};

type Topic = {
  id: number;
  subject_id: number;
  name: string;
};

export default function SubjectsPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] =
    useState<Subject | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("mpsc_profiles")
        .select("access_status, role")
        .eq("id", user.id)
        .single();

      if (
        profile?.role === "admin" &&
        profile?.access_status === "approved"
      ) {
        router.replace("/admin");
        return;
      }

      if (profile?.access_status !== "approved") {
        router.replace("/pending");
        return;
      }

      const { data: subjectData, error: subjectError } =
        await supabase
          .from("mpsc_subjects")
          .select("id, name, description")
          .order("name");

      if (subjectError) {
        setError(subjectError.message);
        setLoading(false);
        return;
      }

      const { data: topicData, error: topicError } =
        await supabase
          .from("mpsc_topics")
          .select("id, subject_id, name")
          .order("name");

      if (topicError) {
        setError(topicError.message);
        setLoading(false);
        return;
      }

      setSubjects(subjectData ?? []);
      setTopics(topicData ?? []);
      setLoading(false);
    }

    load();
  }, [router]);

  function openSubject(subject: Subject) {
    setSelectedSubject(subject);
  }

  function backToDashboard() {
    router.push("/student");
  }

  const selectedTopics = selectedSubject
    ? topics.filter(
        (topic) => topic.subject_id === selectedSubject.id
      )
    : [];

  if (loading) {
    return (
      <main className="page">
        <section className="card">
          <p>Loading subjects...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card subjects-card">

        <button
          className="secondary back-button"
          onClick={
            selectedSubject
              ? () => setSelectedSubject(null)
              : backToDashboard
          }
        >
          ← Back
        </button>

        {!selectedSubject ? (
          <>
            <div className="brand">
              MPSC / UPSC
            </div>

            <h1>Subjects</h1>

            <p className="muted">
              Select a subject to view its topics.
            </p>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            {subjects.length === 0 ? (
              <div className="empty-box">
                <strong>No subjects available yet.</strong>
                <span>
                  Subjects will appear here when the
                  administrator adds them.
                </span>
              </div>
            ) : (
              <div className="subject-list">
                {subjects.map((subject) => {
                  const count = topics.filter(
                    (topic) =>
                      topic.subject_id === subject.id
                  ).length;

                  return (
                    <button
                      className="subject-card"
                      key={subject.id}
                      onClick={() =>
                        openSubject(subject)
                      }
                    >
                      <strong>{subject.name}</strong>

                      {subject.description && (
                        <span>
                          {subject.description}
                        </span>
                      )}

                      <small>
                        {count} topic
                        {count === 1 ? "" : "s"}
                      </small>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="brand">
              MPSC / UPSC
            </div>

            <h1>{selectedSubject.name}</h1>

            {selectedSubject.description && (
              <p className="muted">
                {selectedSubject.description}
              </p>
            )}

            <h2>Topics</h2>

            {selectedTopics.length === 0 ? (
              <div className="empty-box">
                <strong>No topics available yet.</strong>
                <span>
                  Topics will appear here when they are
                  added by the administrator.
                </span>
              </div>
            ) : (
              <div className="topic-list">
                {selectedTopics.map((topic) => (
                  <div
                    className="topic-card"
                    key={topic.id}
                  >
                    <strong>
                      📖 {topic.name}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </section>
    </main>
  );
  }
