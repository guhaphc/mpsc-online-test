"use client";

import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"register"|"login">("register");

  return (
    <main className="page">
      <section className="card">
        <div className="brand">MPSC / UPSC</div>
        <h1>AI Answer Checker</h1>
        <p className="muted">Practice tests and intelligent descriptive-answer evaluation.</p>

        <div className="tabs">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        </div>

        {mode === "register" ? (
          <form className="form">
            <label>Full Name<input required placeholder="Full Name" /></label>
            <label>Email ID<input required type="email" placeholder="Email ID" /></label>
            <label>Password<input required type="password" placeholder="Password" /></label>
            <label>Confirm Password<input required type="password" placeholder="Confirm Password" /></label>
            <button className="primary" type="submit">Register</button>
          </form>
        ) : (
          <form className="form">
            <label>Email ID<input required type="email" placeholder="Email ID" /></label>
            <label>Password<input required type="password" placeholder="Password" /></label>
            <button className="primary" type="submit">Login</button>
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