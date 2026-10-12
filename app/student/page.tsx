"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentPage() {
  const router = useRouter();
  const [name, setName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("mpsc_profiles")
        .select("full_name, role, access_status")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" && profile?.access_status === "approved") {
        router.replace("/admin"); return;
      }
      if (profile?.access_status !== "approved") {
        router.replace("/pending"); return;
      }

      setName(profile.full_name || "Student");
      setLoading(false);
    }
    checkAccess();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <main className="page"><section className="card"><p>Checking your access...</p></section></main>;

  return (
    <main className="student-home">
      <header className="student-topbar">
        <div className="student-brandmark" aria-hidden="true">M</div>
        <div className="student-brandcopy"><strong>MPSC ALL-IN-ONE</strong><span>Your preparation, organised.</span></div>
        <button className="student-avatar" type="button" aria-label="Open account options" onClick={() => setAccountOpen(v => !v)}>
          {(name.trim()[0] || "S").toUpperCase()}
        </button>
      </header>

      <div className="student-content">
        <section className="student-welcome">
          <span className="student-eyebrow">YOUR LEARNING SPACE</span>
          <h1>Welcome back, {name.split(" ")[0]}.</h1>
          <p>Small steps every day. Keep your preparation moving.</p>
        </section>

        <section className="student-continue">
          <div className="student-continue-icon" aria-hidden="true">↗</div>
          <div className="student-continue-copy"><span>READY WHEN YOU ARE</span><strong>Continue your preparation</strong><p>Choose a learning activity and get started.</p></div>
          <button type="button" onClick={() => router.push("/study-material")}>Start learning <span aria-hidden="true">→</span></button>
        </section>

        <div className="student-section-title"><div><h2>What would you like to do?</h2><p>Your main tools, all in one place.</p></div></div>
        <section className="student-feature-grid" aria-label="Main learning options">
          <button type="button" className="student-feature student-feature-study" onClick={() => router.push("/study-material")}>
            <span className="student-feature-icon" aria-hidden="true">▤</span><span className="student-feature-label">LEARN</span><strong>Study Material</strong><small>Subject-wise notes and resources</small><span className="student-feature-arrow" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="student-feature student-feature-tests" onClick={() => router.push("/question-banks")}>
            <span className="student-feature-icon" aria-hidden="true">▤</span><span className="student-feature-label">PRACTISE</span><strong>AI Question Banks</strong><small>Practise approved MCQs by difficulty</small><span className="student-feature-arrow" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="student-feature student-feature-tests" onClick={() => router.push("/tests")}>
            <span className="student-feature-icon" aria-hidden="true">✓</span><span className="student-feature-label">PRACTISE</span><strong>Prelims Tests</strong><small>Attempt objective practice tests</small><span className="student-feature-arrow" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="student-feature student-feature-mains" onClick={() => router.push("/mains")}>
            <span className="student-feature-icon" aria-hidden="true">✎</span><span className="student-feature-label">ANSWER WRITING</span><strong>Mains Practice</strong><small>Write answers and improve your skills</small><span className="student-feature-arrow" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="student-feature student-feature-progress" onClick={() => router.push("/ai-evaluation")}>
            <span className="student-feature-icon" aria-hidden="true">◎</span><span className="student-feature-label">FEEDBACK</span><strong>AI Evaluation</strong><small>Review marks and detailed feedback</small><span className="student-feature-arrow" aria-hidden="true">↗</span>
          </button>
        </section>

        <details className="student-more-tools">
          <summary><span><strong>More practice tools</strong><small>Subjects, custom questions and other options</small></span><span className="student-more-chevron" aria-hidden="true">⌄</span></summary>
          <div className="student-more-links">
            <button type="button" onClick={() => router.push("/subjects")}><span aria-hidden="true">▦</span><span><strong>Browse Subjects</strong><small>Explore subject-wise learning</small></span><b aria-hidden="true">→</b></button>
            <button type="button" onClick={() => router.push("/student/custom-mains")}><span aria-hidden="true">＋</span><span><strong>Custom Mains Question</strong><small>Upload a question and your handwritten answer</small></span><b aria-hidden="true">→</b></button>
          </div>
        </details>

        {accountOpen && <section className="student-account-panel"><div><strong>{name}</strong><span>Student account</span></div><button type="button" className="secondary" onClick={logout}>Log out</button></section>}
        <p className="student-footer-note">Stay consistent. Your progress is built one session at a time.</p>
      </div>

      <nav className="student-bottom-nav" aria-label="Student navigation">
        <button type="button" className="active" aria-current="page" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span aria-hidden="true">⌂</span><small>Home</small></button>
        <button type="button" onClick={() => router.push("/study-material")}><span aria-hidden="true">▤</span><small>Learn</small></button>
        <button type="button" onClick={() => router.push("/tests")}><span aria-hidden="true">✓</span><small>Tests</small></button>
        <button type="button" onClick={() => router.push("/mains")}><span aria-hidden="true">✎</span><small>Practice</small></button>
        <button type="button" onClick={() => setAccountOpen(v => !v)}><span aria-hidden="true">☻</span><small>Account</small></button>
      </nav>
    </main>
  );
}
