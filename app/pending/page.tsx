"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PendingPage() {
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
        .select("full_name, access_status, role")
        .eq("id", user.id)
        .single();

      if (
        profile?.role === "admin" &&
        profile?.access_status === "approved"
      ) {
        router.replace("/admin");
        return;
      }

      if (profile?.access_status === "approved") {
        router.replace("/student");
        return;
      }

      setName(profile?.full_name || "Student");
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
          Access Pending
        </h1>

        <p className="muted">
          Hello {name}.
        </p>

        <p className="muted">
          Your registration is complete, but your
          account is waiting for administrator approval.
        </p>

        <p className="muted">
          Once your account is approved, you will be
          able to access the learning materials,
          tests, and AI answer evaluation features.
        </p>

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
