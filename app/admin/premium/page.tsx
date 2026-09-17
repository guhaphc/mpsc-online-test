"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  full_name: string;
  mobile: string | null;
  access_status: string;
  role: string;
};

type Premium = {
  user_id: string;
  is_premium: boolean;
  valid_until: string | null;
};

export default function AdminPremiumPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [access, setAccess] = useState<Record<string, Premium>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }

    const { data: me, error: meError } = await supabase
      .from("mpsc_profiles")
      .select("role, access_status")
      .eq("id", user.id)
      .single();

    if (meError || me?.role !== "admin" || me?.access_status !== "approved") {
      router.replace("/");
      return;
    }

    const { data: studentData, error: studentError } = await supabase
      .from("mpsc_profiles")
      .select("id, full_name, mobile, access_status, role")
      .eq("role", "user")
      .order("full_name");

    if (studentError) {
      setError(studentError.message);
      setLoading(false);
      return;
    }

    const { data: premiumData, error: premiumError } = await supabase
      .from("mpsc_premium_access")
      .select("user_id, is_premium, valid_until");

    if (premiumError) {
      setError(premiumError.message);
      setLoading(false);
      return;
    }

    const map: Record<string, Premium> = {};
    const dateMap: Record<string, string> = {};
    for (const row of (premiumData ?? []) as Premium[]) {
      map[row.user_id] = row;
      dateMap[row.user_id] = row.valid_until
        ? row.valid_until.slice(0, 10)
        : "";
    }

    setStudents((studentData ?? []) as Student[]);
    setAccess(map);
    setDates(dateMap);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      (s.mobile ?? "").includes(q)
    );
  }, [students, search]);

  async function setPremium(student: Student, enabled: boolean) {
    setBusyId(student.id);
    setError("");
    setMessage("");

    const validUntil = dates[student.id]
      ? new Date(dates[student.id] + "T23:59:59").toISOString()
      : null;

    const { data, error: upsertError } = await supabase
      .from("mpsc_premium_access")
      .upsert({
        user_id: student.id,
        is_premium: enabled,
        valid_until: validUntil,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setAccess((current) => ({ ...current, [student.id]: data as Premium }));
      setMessage(enabled
        ? `Premium access activated for ${student.full_name}.`
        : `Premium access disabled for ${student.full_name}.`);
    }
    setBusyId("");
  }

  async function saveDate(student: Student) {
    const current = access[student.id];
    if (!current?.is_premium) {
      setError("Activate premium before setting an expiry date.");
      return;
    }
    await setPremium(student, true);
  }

  async function removeAccess(student: Student) {
    setBusyId(student.id);
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("mpsc_premium_access")
      .delete()
      .eq("user_id", student.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setAccess((current) => {
        const next = { ...current };
        delete next[student.id];
        return next;
      });
      setDates((current) => ({ ...current, [student.id]: "" }));
      setMessage(`Premium access removed for ${student.full_name}.`);
    }
    setBusyId("");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return <main className="page"><section className="card admin-card"><p>Loading premium management...</p></section></main>;
  }

  return (
    <main className="page">
      <section className="card admin-card">
        <div className="admin-head">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Premium Management</h1>
            <p className="muted">Activate, expire, or remove Premium Question Bank access.</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => router.push("/admin")}>Admin Dashboard</button>
            <button className="secondary" onClick={logout}>Logout</button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <div className="admin-tools">
          <div>
            <strong>Premium students: {students.filter(s => access[s.id]?.is_premium).length}</strong>
            <span>Only approved student accounts should normally be activated.</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name or mobile"
            style={{ minWidth: 220, padding: "10px", border: "1px solid #d8deea", borderRadius: 10 }}
          />
        </div>

        {visibleStudents.length === 0 ? (
          <p className="muted">No students found.</p>
        ) : (
          <div className="user-list">
            {visibleStudents.map((student) => {
              const current = access[student.id];
              const active = Boolean(current?.is_premium) &&
                (!current?.valid_until || new Date(current.valid_until).getTime() >= Date.now());

              return (
                <div className="user-row" key={student.id}>
                  <div>
                    <strong>{student.full_name}</strong>
                    <span>{student.mobile ? `Mobile: ${student.mobile}` : "Mobile not provided"}</span>
                    <span>Account: <strong>{student.access_status}</strong></span>
                    <span>
                      Premium: <strong>{active ? "ACTIVE" : "INACTIVE"}</strong>
                      {current?.valid_until ? ` · Until ${new Date(current.valid_until).toLocaleDateString()}` : ""}
                    </span>
                  </div>

                  <div className="actions" style={{ alignItems: "center" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                      Valid until
                      <input
                        type="date"
                        value={dates[student.id] ?? ""}
                        onChange={(e) => setDates((v) => ({ ...v, [student.id]: e.target.value }))}
                        disabled={busyId === student.id}
                      />
                    </label>
                    {active ? (
                      <button className="reject" disabled={busyId === student.id} onClick={() => setPremium(student, false)}>
                        Disable Premium
                      </button>
                    ) : (
                      <button className="approve" disabled={busyId === student.id || student.access_status !== "approved"} onClick={() => setPremium(student, true)}>
                        Activate Premium
                      </button>
                    )}
                    <button className="secondary" disabled={busyId === student.id || !current} onClick={() => saveDate(student)}>
                      Save Date
                    </button>
                    {current && (
                      <button className="reject" disabled={busyId === student.id} onClick={() => removeAccess(student)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
