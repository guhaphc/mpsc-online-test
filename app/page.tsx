"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Mode = "register" | "login";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function changeMode(nextMode: Mode) {
    setMode(nextMode); setMessage(""); setError(""); setPassword(""); setConfirmPassword("");
    setShowPassword(false); setShowConfirmPassword(false);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const name = fullName.trim(), emailAddress = email.trim();
    if (!name) return setError("Please enter your full name.");
    if (!emailAddress) return setError("Please enter your email ID.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailAddress, password, options: { data: { full_name: name } },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    setPassword(""); setConfirmPassword("");
    setMessage(data.session ? "Registration successful. Your account is ready." : "Registration successful. Please check your email to confirm your account.");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const emailAddress = email.trim();
    if (!emailAddress || !password) { setError("Please enter your email ID and password."); return; }
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: emailAddress, password });
    if (signInError) { setLoading(false); setError(signInError.message); return; }
    const { data: profile, error: profileError } = await supabase.from("mpsc_profiles")
      .select("role, access_status").eq("id", data.user.id).single();
    setLoading(false);
    if (profileError) { await supabase.auth.signOut(); setError("Your account profile could not be loaded. Please try again."); return; }
    setPassword("");
    if (profile.role === "admin" && profile.access_status === "approved") { router.push("/admin"); return; }
    if (profile.access_status !== "approved") { router.push("/pending"); return; }
    router.push("/student");
  }

  return (
    <main className="auth-page auth-photo-page">
      <section className="auth-photo-shell">
        <header className="auth-photo-hero">
          <img src="/mpsc-guidance.jpg" alt="Maharashtra Public Service Commission guidance and examination hall" className="auth-photo-image" />
          <div className="auth-photo-shade" />
          <div className="auth-photo-brand"><div className="auth-photo-logo">M</div><div><strong>MPSC ALL-IN-ONE</strong><span>Your preparation, organised.</span></div></div>
        </header>
        <section className="auth-panel auth-photo-panel" aria-label={mode === "login" ? "Login" : "Create account"}>
          <div className="auth-panel-heading">
            <span className="auth-step-label">{mode === "login" ? "WELCOME BACK" : "START YOUR PREPARATION"}</span>
            <h2>{mode === "login" ? "Sign in to continue." : "Create your account."}</h2>
            <p>{mode === "login" ? "Pick up where your preparation left off." : "A few details to get your preparation started."}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Choose an account action">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Create account</button>
          </div>
          {mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" /></label>
              <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label>Password<div className="auth-password-wrap"><input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" /><button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)}>{showPassword ? "Hide" : "Show"}</button></div><small className="auth-field-hint">Use at least 6 characters.</small></label>
              <label>Confirm password<div className="auth-password-wrap"><input required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" /><button type="button" className="auth-show-password" onClick={() => setShowConfirmPassword(v => !v)}>{showConfirmPassword ? "Hide" : "Show"}</button></div></label>
              {error && <p className="auth-message auth-error" role="alert">{error}</p>}{message && <p className="auth-message auth-success" role="status">{message}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"} <span>→</span></button>
              <p className="auth-approval-note">Your account may require administrator approval before access.</p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" /></label>
              <label>Password<div className="auth-password-wrap"><input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /><button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)}>{showPassword ? "Hide" : "Show"}</button></div></label>
              <div className="auth-forgot-row"><span>Keep your preparation moving.</span><button type="button" onClick={() => setMessage("Please contact your administrator to reset your password.")}>Forgot Password?</button></div>
              {error && <p className="auth-message auth-error" role="alert">{error}</p>}{message && <p className="auth-message auth-success" role="status">{message}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"} <span>→</span></button>
            </form>
          )}
          <div className="auth-panel-footer">A focused space for study material, exam practice and answer evaluation.</div>
        </section>
      </section>
    </main>
  );
}
