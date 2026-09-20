// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRENT_AFFAIRS_SUBJECTS } from "@/lib/study-material-subjects";

const emptyForm = () => ({
  id: null,
  subject: CURRENT_AFFAIRS_SUBJECTS[0].name,
  topic: "",
  title: "",
  published_date: new Date().toISOString().slice(0, 10),
  summary: "",
  content: "",
  prelims_points: "",
  mains_angle: "",
  keywords: "",
  source_text: "",
  status: "draft",
});

export default function CurrentAffairsAdmin() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm());
  const [filter, setFilter] = useState("All Subjects");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function auth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session expired. Please sign in again.");
    return session;
  }

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      const { data: profile } = await supabase
        .from("mpsc_profiles")
        .select("role,access_status")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin" || profile?.access_status !== "approved") {
        router.replace("/");
        return;
      }
      const { data, error: dbError } = await supabase
        .from("current_affairs")
        .select("*")
        .order("published_date", { ascending: false })
        .order("updated_at", { ascending: false });
      if (dbError) throw new Error(dbError.message);
      setItems(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load current affairs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function setField(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  function reset() {
    setForm(emptyForm());
    setError("");
    setMessage("");
  }

  async function generate() {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const session = await auth();
      const response = await fetch("/api/ai/current-affairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: form.subject,
          sourceText: form.source_text,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI generation failed.");
      setForm((current: any) => ({
        ...current,
        title: data.title || current.title,
        topic: data.topic || current.topic,
        summary: data.summary || "",
        content: data.content || "",
        prelims_points: data.prelims_points || "",
        mains_angle: data.mains_angle || "",
        keywords: data.keywords || "",
      }));
      setMessage("AI note generated. Review it before publishing.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function save(status = "draft") {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Admin session not found.");
      if (!form.title.trim() || !form.content.trim()) {
        throw new Error("Generate the note first, or enter a title and content.");
      }

      const payload = {
        subject: form.subject,
        content_type: "current_affair",
        topic: form.topic || null,
        title: form.title.trim(),
        published_date: form.published_date,
        summary: form.summary || null,
        content: form.content,
        details: form.content,
        prelims_points: form.prelims_points || null,
        mains_angle: form.mains_angle || null,
        keywords: form.keywords || null,
        source_text: form.source_text || null,
        status,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error: updateError } = await supabase
          .from("current_affairs")
          .update(payload)
          .eq("id", form.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { data, error: insertError } = await supabase
          .from("current_affairs")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        setForm((current: any) => ({ ...current, id: data.id }));
      }

      setMessage(status === "published" ? "Published successfully." : "Saved as draft.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: number, status: string) {
    setError("");
    const { error: dbError } = await supabase
      .from("current_affairs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (dbError) setError(dbError.message);
    else await load();
  }

  async function editItem(item: any) {
    setForm({
      id: item.id,
      subject: item.subject,
      topic: item.topic || "",
      title: item.title || "",
      published_date: item.published_date || new Date().toISOString().slice(0, 10),
      summary: item.summary || "",
      content: item.content || item.details || "",
      prelims_points: item.prelims_points || "",
      mains_angle: item.mains_angle || "",
      keywords: item.keywords || "",
      source_text: item.source_text || "",
      status: item.status || "draft",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this current-affairs note?")) return;
    const { error: dbError } = await supabase.from("current_affairs").delete().eq("id", id);
    if (dbError) setError(dbError.message);
    else { if (form.id === id) reset(); await load(); }
  }

  const visible = useMemo(
    () => items.filter(x => filter === "All Subjects" || x.subject === filter),
    [items, filter]
  );

  return (
    <main className="page">
      <section className="card ca-admin">
        <div className="admin-head">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Current Affairs & Important Information</h1>
            <p className="muted">Paste source material → Generate AI → Review → Publish.</p>
          </div>
          <button className="secondary" onClick={() => router.push("/admin")}>Admin Dashboard</button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <section className="ca-generator">
          <div className="ca-section-title">
            <div><strong>{form.id ? "Edit Current Affair" : "Create Current Affair"}</strong><span>Simple admin workflow</span></div>
            <button className="secondary" type="button" onClick={reset}>New</button>
          </div>

          <label className="ca-field">
            <span>Subject</span>
            <select value={form.subject} onChange={e => setField("subject", e.target.value)}>
              {CURRENT_AFFAIRS_SUBJECTS.map(x => <option key={x.key}>{x.name}</option>)}
            </select>
          </label>

          <label className="ca-field">
            <span>Paste Current Affairs / Source Material</span>
            <textarea
              className="ca-source"
              value={form.source_text}
              onChange={e => setField("source_text", e.target.value)}
              placeholder="Paste newspaper article, PDF text, government release or other source material here..."
            />
          </label>

          <button
            className="ca-generate"
            type="button"
            disabled={generating || !form.source_text.trim()}
            onClick={generate}
          >
            {generating ? "Generating AI Notes..." : "✨ Generate AI Notes"}
          </button>
        </section>

        {(form.content || form.title) && (
          <section className="ca-review">
            <div className="ca-section-title">
              <div><strong>AI Generated Note</strong><span>Review before publishing</span></div>
              <button className="secondary" type="button" disabled={generating} onClick={generate}>Regenerate</button>
            </div>

            <div className="ca-meta-grid">
              <label className="ca-field"><span>Title</span><input value={form.title} onChange={e => setField("title", e.target.value)} /></label>
              <label className="ca-field"><span>Date</span><input type="date" value={form.published_date} onChange={e => setField("published_date", e.target.value)} /></label>
              <label className="ca-field"><span>Topic</span><input value={form.topic} onChange={e => setField("topic", e.target.value)} /></label>
            </div>

            <label className="ca-field"><span>Summary</span><textarea value={form.summary} onChange={e => setField("summary", e.target.value)} /></label>
            <label className="ca-field"><span>Professional Note</span><textarea className="ca-content" value={form.content} onChange={e => setField("content", e.target.value)} /></label>
            <label className="ca-field"><span>Prelims Points</span><textarea value={form.prelims_points} onChange={e => setField("prelims_points", e.target.value)} /></label>
            <label className="ca-field"><span>Mains Angle</span><textarea value={form.mains_angle} onChange={e => setField("mains_angle", e.target.value)} /></label>
            <label className="ca-field"><span>Keywords</span><input value={form.keywords} onChange={e => setField("keywords", e.target.value)} /></label>

            <div className="ca-actions">
              <button className="secondary" disabled={saving} onClick={() => save("draft")}>Save Draft</button>
              <button className="primary" disabled={saving} onClick={() => save("published")}>{saving ? "Saving..." : "Publish"}</button>
            </div>
          </section>
        )}

        <section className="ca-library">
          <div className="ca-section-title">
            <div><strong>Published / Draft Notes</strong><span>{items.length} total</span></div>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option>All Subjects</option>
              {CURRENT_AFFAIRS_SUBJECTS.map(x => <option key={x.key}>{x.name}</option>)}
            </select>
          </div>

          {loading ? <p className="muted">Loading...</p> : visible.length === 0 ? <p className="muted">No current-affairs notes yet.</p> :
            <div className="ca-list">
              {visible.map(item => (
                <article className="ca-item" key={item.id}>
                  <div className="ca-item-main">
                    <div className="ca-item-meta">{item.subject} · {item.published_date} · {item.status}</div>
                    <h3>{item.title}</h3>
                    <p>{item.summary || item.topic}</p>
                  </div>
                  <div className="ca-item-actions">
                    <button className="secondary" onClick={() => editItem(item)}>Edit</button>
                    {item.status !== "published" && <button className="primary" onClick={() => changeStatus(item.id, "published")}>Publish</button>}
                    {item.status === "published" && <button className="secondary" onClick={() => changeStatus(item.id, "draft")}>Unpublish</button>}
                    <button className="danger" onClick={() => remove(item.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          }
        </section>
      </section>

      <style jsx>{`
        .ca-admin{max-width:1050px;margin:auto}
        .ca-generator,.ca-review,.ca-library{margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:var(--radius-md);background:#fff}
        .ca-generator{background:#f8fbfe}
        .ca-section-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}
        .ca-section-title>div{display:grid;gap:3px}.ca-section-title span{color:var(--muted);font-size:12px}
        .ca-field{display:grid;gap:6px;margin:10px 0;font-size:13px;font-weight:700}.ca-field span{color:var(--muted);font-size:11px}
        .ca-field input,.ca-field select,.ca-field textarea{width:100%;border:1px solid #d8dee9;border-radius:9px;background:#fff;padding:10px 11px;font:inherit;color:var(--ink);box-sizing:border-box}
        .ca-field textarea{min-height:88px;resize:vertical;line-height:1.55}.ca-source{min-height:260px!important}.ca-content{min-height:430px!important;font-size:14px}
        .ca-generate{width:100%;min-height:46px;border:0;border-radius:9px;background:var(--primary);color:#fff;font-weight:850;font-size:14px;cursor:pointer}
        .ca-generate:disabled{opacity:.55;cursor:not-allowed}
        .ca-meta-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}
        .ca-actions{display:flex;gap:9px;margin-top:14px}.ca-actions button{flex:1}
        .ca-list{display:grid;gap:9px}.ca-item{display:flex;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:10px}
        .ca-item-main{min-width:0}.ca-item-meta{color:var(--primary);font-size:10px;font-weight:800;text-transform:uppercase}.ca-item h3{margin:5px 0;font-size:15px}.ca-item p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}
        .ca-item-actions{display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap}.ca-item-actions button{white-space:nowrap}
        @media(max-width:700px){.ca-meta-grid{grid-template-columns:1fr}.ca-section-title{align-items:stretch;flex-direction:column}.ca-section-title>button,.ca-section-title>select{width:100%}.ca-item{display:block}.ca-item-actions{margin-top:10px}.ca-item-actions button{flex:1}.ca-actions{flex-direction:column}.ca-content{min-height:360px!important}}
      `}</style>
    </main>
  );
}
