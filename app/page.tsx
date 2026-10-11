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
    setMode(nextMode);
    setMessage("");
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

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
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <section className="auth-shell">
        <aside className="auth-story">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">M</div>
            <div><strong>MPSC ALL-IN-ONE</strong><span>PREPARE WITH PURPOSE</span></div>
          </div>
          <div className="auth-story-main">
            <span className="auth-kicker"><i /> YOUR NEXT CHAPTER STARTS HERE</span>
            <h1>Make your<br />MPSC goal<br /><em>happen.</em></h1>
            <p>A focused space for learning, practice, and meaningful progress—built for your exam journey.</p>
            <div className="auth-benefits">
              <div><span className="auth-benefit-icon" aria-hidden="true">▤</span><span><strong>Study with structure</strong><small>Organised study material</small></span></div>
              <div><span className="auth-benefit-icon" aria-hidden="true">✓</span><span><strong>Practise with purpose</strong><small>Prelims and Mains practice</small></span></div>
              <div><span className="auth-benefit-icon" aria-hidden="true">↗</span><span><strong>Improve with feedback</strong><small>AI-assisted answer evaluation</small></span></div>
            </div>
          </div>
          <div className="auth-story-footer"><span>CONSISTENCY BUILDS CONFIDENCE.</span><span>LEARN · PRACTISE · PROGRESS</span></div>
        </aside>

        <section className="auth-panel" aria-label={mode === "login" ? "Login" : "Create account"}>
          <div className="auth-mobile-brand"><div className="auth-logo" aria-hidden="true">M</div><div><strong>MPSC ALL-IN-ONE</strong><span>Your preparation, organised.</span></div></div>
          <div className="auth-panel-heading">
            <span className="auth-step-label">{mode === "login" ? "WELCOME BACK" : "JOIN THE LEARNING COMMUNITY"}</span>
            <h2>{mode === "login" ? "Good to see you." : "Create your account."}</h2>
            <p>{mode === "login" ? "Sign in to pick up where your preparation left off." : "A few details to get your preparation started."}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Choose an account action">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Create account</button>
          </div>

          {mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" /></label>
              <label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label>Password<div className="auth-password-wrap"><input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" /><button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div><small className="auth-field-hint">Use at least 6 characters.</small></label>
              <label>Confirm password<div className="auth-password-wrap"><input required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" /><button type="button" className="auth-show-password" onClick={() => setShowConfirmPassword(v => !v)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>{showConfirmPassword ? "Hide" : "Show"}</button></div></label>
              {error && <p className="auth-message auth-error" role="alert">{error}</p>}
              {message && <p className="auth-message auth-success" role="status">{message}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"} <span aria-hidden="true">→</span></button>
              <p className="auth-approval-note"><span aria-hidden="true">♧</span> Your account may require administrator approval before access.</p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" /></label>
              <label>Password<div className="auth-password-wrap"><input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /><button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></label>
              {error && <p className="auth-message auth-error" role="alert">{error}</p>}
              {message && <p className="auth-message auth-success" role="status">{message}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"} <span aria-hidden="true">→</span></button>
              <p className="auth-privacy-note"><span aria-hidden="true">◇</span> Your learning journey starts with one step.</p>
            </form>
          )}

          <div className="auth-panel-footer">By continuing, you agree to use the platform responsibly.</div>
        </section>
      </section>
    </main>
  );
}
