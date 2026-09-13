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
    status: "approved" | "rejected"
  ) {
    setBusyId(id);
    setError("");

    const { error: updateError } = await supabase
      .from("mpsc_profiles")
      .update({ access_status: status })
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

        {error && (
          <p className="form-error">
            {error}
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
                      <strong>
                        {user.full_name}
                      </strong>

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
                      <strong>
                        {user.full_name}
                      </strong>

                      <span>
                        Status:{" "}
                        {user.access_status}
                      </span>
                    </div>

                    <div className="actions">

                      {user.access_status !==
                        "approved" && (
                        <button
                          className="approve"
                          disabled={
                            busyId === user.id
                          }
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

                      {user.access_status !==
                        "rejected" && (
                        <button
                          className="reject"
                          disabled={
                            busyId === user.id
                          }
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
