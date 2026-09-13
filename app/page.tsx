"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Mode = "register" | "login";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const name = fullName.trim();
    const emailAddress = email.trim();

    if (!name) return setError("Please enter your full name.");
    if (!emailAddress) return setError("Please enter your email ID.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailAddress,
      password,
      options: { data: { full_name: name } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");

    if (data.session) {
      setMessage("Registration successful. Your account is ready.");
    } else {
      setMessage("Registration successful. Please check your email to confirm your account.");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const emailAddress = email.trim();
    if (!emailAddress || !password) {
      setError("Please enter your email ID and password.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailAddress,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const userId = data.user.id;
    const { data: profile, error: profileError } = await supabase
      .from("mpsc_profiles")
      .select("role, access_status")
      .eq("id", userId)
      .single();

    setLoading(false);

    if (profileError) {
      await supabase.auth.signOut();
      setError("Your account profile could not be loaded. Please try again.");
      return;
    }

    setPassword("");

    if (profile.role === "admin" && profile.access_status === "approved") {
      router.push("/admin");
      return;
    }

    if (profile.access_status !== "approved") {
      router.push("/pending");
      return;
    }

    router.push("/student");
  }

  return (
    <main className="page">
      <section className="card">
        <div className="brand">MPSC / UPSC</div>
        <h1>AI Answer Checker</h1>
        <p className="muted">Practice tests and intelligent descriptive-answer evaluation.</p>

        <div className="tabs">
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); setError(""); }}>Register</button>
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); setError(""); }}>Login</button>
        </div>

        {mode === "register" ? (
          <form className="form" onSubmit={handleRegister}>
            <label>Full Name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" autoComplete="name" /></label>
            <label>Email ID<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email ID" autoComplete="email" /></label>
            <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" /></label>
            <label>Confirm Password<input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" autoComplete="new-password" /></label>
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}
            <button className="primary" type="submit" disabled={loading}>{loading ? "Creating account..." : "Register"}</button>
          </form>
        ) : (
          <form className="form" onSubmit={handleLogin}>
            <label>Email ID<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email ID" autoComplete="email" /></label>
            <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" /></label>
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}
            <button className="primary" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
          </form>
        )}

        <div className="features">
          <span>📄 Question-paper detection</span>
          <span>✍️ Marathi + English OCR</span>
          <span>🤖 AI evaluation</span>
          <span>📊 Marks & feedback</span>
        </div>
      </section>
    </main>
  );
}
