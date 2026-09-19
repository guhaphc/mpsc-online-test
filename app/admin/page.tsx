"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  full_name: string;
  mobile: string | null;
  access_status: string;
  role: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/");
      return;
    }

    const { data: me, error: meError } = await supabase
      .from("mpsc_profiles")
      .select("role, access_status")
      .eq("id", user.id)
      .single();

    if (
      meError ||
      me?.role !== "admin" ||
      me?.access_status !== "approved"
    ) {
      router.replace("/");
      return;
    }

    const { data, error: usersError } = await supabase
      .from("mpsc_profiles")
      .select(
        "id, full_name, mobile, access_status, role, created_at"
      )
      .order("created_at", { ascending: false });

    if (usersError) {
      setError(usersError.message);
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function setStatus(
    id: string,
    status: "approved" | "rejected" | "disabled"
  ) {
    setBusyId(id);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("mpsc_profiles")
      .update({
        access_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setBusyId("");

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? { ...user, access_status: status }
          : user
      )
    );

    setMessage(`Student status changed to ${status}.`);
  }

  async function deleteStudent(id: string, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${name}"?\n\nThis will delete the student's login account and profile. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session not found.");
      }

      const response = await fetch(
        "/api/admin/delete-student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete student."
        );
      }

      setUsers((current) =>
        current.filter((user) => user.id !== id)
      );

      setMessage(
        `Student "${name}" was permanently deleted.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete student."
      );
    } finally {
      setBusyId("");
    }
  }
    async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const pendingUsers = users.filter(
    (user) => user.access_status === "pending"
  );

  const approvedUsers = users.filter(
    (user) =>
      user.access_status === "approved" &&
      user.role !== "admin"
  );

  const rejectedUsers = users.filter(
    (user) => user.access_status === "rejected"
  );

  const disabledUsers = users.filter(
    (user) => user.access_status === "disabled"
  );

  return (
    <main className="page">
      <section className="card admin-card">
        <div className="admin-head">
          <div>
            <div className="brand">MPSC / UPSC</div>

            <h1>Admin Dashboard</h1>

            <p className="muted">
              Manage student access.
            </p>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="admin-tools">
          <div>
            <strong>Bulk AI Study Notes</strong>
            <span>
              Generate remaining syllabus-linked draft notes by stage, paper, or subject with progress tracking.
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() => router.push("/admin/notes/bulk")}
          >
            Bulk Generator
          </button>
        </div>

        <div className="admin-tools">
          <div>
            <strong>AI Study Notes</strong>
            <span>
              Create syllabus-linked notes, add references, generate AI drafts, review and publish.
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() => router.push("/admin/notes")}
          >
            Manage AI Notes
          </button>
        </div>

        <div className="admin-tools">
          <div>
            <strong>Test management</strong>
            <span>
              Create, publish, and maintain practice tests.
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() => router.push("/admin/tests")}
          >
            Manage Tests
          </button>
        </div>

        <div className="admin-tools">
          <div>
            <strong>Premium management</strong>
            <span>
              Activate, disable, and manage Premium Question Bank access.
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() => router.push("/admin/premium")}
          >
            Manage Premium
          </button>
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {message && (
          <p className="form-success">
            {message}
          </p>
        )}

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <>
            <div className="stats">
              <div>
                <strong>{pendingUsers.length}</strong>
                <span>Pending</span>
              </div>

              <div>
                <strong>{approvedUsers.length}</strong>
                <span>Approved</span>
              </div>

              <div>
                <strong>{rejectedUsers.length}</strong>
                <span>Rejected</span>
              </div>

              <div>
                <strong>{disabledUsers.length}</strong>
                <span>Disabled</span>
              </div>
            </div>

            <h2>Pending Users</h2>

            {pendingUsers.length === 0 ? (
              <p className="muted">
                No pending users.
              </p>
            ) : (
              <div className="user-list">
                {pendingUsers.map((user) => (
                  <div
                    className="user-row"
                    key={user.id}
                  >
                    <div>
                      <strong>{user.full_name}</strong>

                      <span>
                        {user.mobile
                          ? `Mobile: ${user.mobile}`
                          : "Mobile not provided"}
                      </span>

                      <span>
                        Registered:{" "}
                        {new Date(
                          user.created_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="actions">
                      <button
                        className="approve"
                        disabled={busyId === user.id}
                        onClick={() =>
                          setStatus(
                            user.id,
                            "approved"
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="reject"
                        disabled={busyId === user.id}
                        onClick={() =>
                          setStatus(
                            user.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </button>

                      <button
                        className="reject"
                        disabled={busyId === user.id}
                        onClick={() =>
                          deleteStudent(
                            user.id,
                            user.full_name
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2>All Students</h2>
                        <div className="user-list">
              {users
                .filter(
                  (user) => user.role !== "admin"
                )
                .map((user) => (
                  <div
                    className="user-row"
                    key={user.id}
                  >
                    <div>
                      <strong>{user.full_name}</strong>

                      <span>
                        {user.mobile
                          ? `Mobile: ${user.mobile}`
                          : "Mobile not provided"}
                      </span>

                      <span>
                        Status:{" "}
                        <strong>
                          {user.access_status}
                        </strong>
                      </span>
                    </div>

                    <div className="actions">
                      {user.access_status !== "approved" && (
                        <button
                          className="approve"
                          disabled={busyId === user.id}
                          onClick={() =>
                            setStatus(
                              user.id,
                              "approved"
                            )
                          }
                        >
                          Approve
                        </button>
                      )}

                      {user.access_status === "approved" && (
                        <button
                          className="reject"
                          disabled={busyId === user.id}
                          onClick={() =>
                            setStatus(
                              user.id,
                              "disabled"
                            )
                          }
                        >
                          Disable Login
                        </button>
                      )}

                      {user.access_status === "disabled" && (
                        <button
                          className="approve"
                          disabled={busyId === user.id}
                          onClick={() =>
                            setStatus(
                              user.id,
                              "approved"
                            )
                          }
                        >
                          Enable Login
                        </button>
                      )}

                      {user.access_status !== "rejected" && (
                        <button
                          className="reject"
                          disabled={busyId === user.id}
                          onClick={() =>
                            setStatus(
                              user.id,
                              "rejected"
                            )
                          }
                        >
                          Reject
                        </button>
                      )}

                      <button
                        className="reject"
                        disabled={busyId === user.id}
                        onClick={() =>
                          deleteStudent(
                            user.id,
                            user.full_name
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
