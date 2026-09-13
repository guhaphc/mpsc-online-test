"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentPage() {
  const router = useRouter();
  const [name, setName] = useState("Student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("mpsc_profiles")
        .select("full_name, role, access_status")
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

      setName(profile.full_name || "Student");
      setLoading(false);
    }

    checkAccess();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="page">
        <section className="card">
          <p>Checking your access...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          MPSC / UPSC
        </div>

        <h1>
          Student Dashboard
        </h1>

        <p className="muted">
          Welcome, {name}. Your account has been approved.
        </p>

        <div className="dashboard-grid">

          <div className="dashboard-item">
            <strong>📚 Subjects</strong>
            <span>
              Study MPSC/UPSC subjects
            </span>
          </div>

          <div className="dashboard-item">
            <strong>📝 Tests</strong>
            <span>
              Practice objective and descriptive tests
            </span>
          </div>

          <div className="dashboard-item">
            <strong>📄 Answer Papers</strong>
            <span>
              Upload descriptive answer sheets
            </span>
          </div>

          <div className="dashboard-item">
            <strong>🤖 AI Evaluation</strong>
            <span>
              Get marks and detailed feedback
            </span>
          </div>

        </div>

        <button
          className="primary"
          onClick={logout}
        >
          Logout
        </button>

      </section>
    </main>
  );
}
