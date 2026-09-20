function renderNote(text:string){
 const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 const lines=String(text||"").split("\n"); let html=""; let inList=false;
 for(const raw of lines){const line=raw.trim(); if(!line){if(inList){html+="</ul>";inList=false;} continue;}
  const fmt=(s:string)=>s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
  if(/^###\s+/.test(line)){if(inList){html+="</ul>";inList=false;} html+="<h3>"+fmt(esc(line.replace(/^###\s+/,"")))+"</h3>";}
  else if(/^##\s+/.test(line)){if(inList){html+="</ul>";inList=false;} html+="<h2>"+fmt(esc(line.replace(/^##\s+/,"")))+"</h2>";}
  else if(/^#\s+/.test(line)){if(inList){html+="</ul>";inList=false;} html+="<h1>"+fmt(esc(line.replace(/^#\s+/,"")))+"</h1>";}
  else if(/^>\s?/.test(line)){if(inList){html+="</ul>";inList=false;} html+="<blockquote>"+fmt(esc(line.replace(/^>\s?/,"")))+"</blockquote>";}
  else if(/^(?:[-•*])\s+/.test(line)){if(!inList){html+="<ul>";inList=true;} html+="<li>"+fmt(esc(line.replace(/^(?:[-•*])\s+/,"")))+"</li>";}
  else {if(inList){html+="</ul>";inList=false;} html+="<p>"+fmt(esc(line))+"</p>";}
 }
 if(inList)html+="</ul>"; return html;
}
// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRENT_AFFAIRS_SUBJECTS } from "@/lib/study-material-subjects";

export default function CurrentAffairsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [subject, setSubject] = useState("All Subjects");
  const [month, setMonth] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      const { data: profile } = await supabase.from("mpsc_profiles").select("role,access_status").eq("id", user.id).single();
      if (profile?.role === "admin") { router.replace("/admin"); return; }
      if (profile?.access_status !== "approved") { router.replace("/pending"); return; }
      const { data } = await supabase.from("current_affairs").select("*").eq("status", "published").order("published_date", { ascending: false }).order("updated_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(() => items.filter(x =>
    (subject === "All Subjects" || x.subject === subject) &&
    (!month || String(x.published_date).slice(0, 7) === month) &&
    (!q || [x.title, x.topic, x.summary, x.content, x.prelims_points, x.mains_angle, x.keywords].join(" ").toLowerCase().includes(q.toLowerCase()))
  ), [items, subject, month, q]);

  if (loading) return <main className="page"><section className="card"><p>Loading current affairs...</p></section></main>;

  return (
    <main className="page">
      <section className="card ca-student">
        <div className="admin-head">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Current Affairs & Important Information</h1>
            <p className="muted">Clean, subject-wise notes for quick revision.</p>
          </div>
          <button className="secondary" onClick={() => router.push("/student")}>Dashboard</button>
        </div>

        <div className="ca-filters">
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option>All Subjects</option>
            {CURRENT_AFFAIRS_SUBJECTS.map(x => <option key={x.key}>{x.name}</option>)}
          </select>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          <input placeholder="Search current affairs..." value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="ca-student-list">
          {filtered.length === 0 ? <p className="muted">No current affairs found.</p> : filtered.map(item => {
            const isOpen = open === item.id;
            return (
              <article className={`ca-student-item ${isOpen ? "open" : ""}`} key={item.id}>
                <button className="ca-student-header" onClick={() => setOpen(isOpen ? null : item.id)}>
                  <span>
                    <small>{item.subject} · {item.published_date}</small>
                    <strong>{item.title}</strong>
                    {item.summary && <em>{item.summary}</em>}
                  </span>
                  <b>{isOpen ? "−" : "+"}</b>
                </button>
                {isOpen && (
                  <div className="ca-reader">
                    {item.topic && <div className="ca-reader-topic">{item.topic}</div>}
                    {item.content ? <div className="ca-reader-content" dangerouslySetInnerHTML={{__html:renderNote(item.content)}} /> : <>
                      {item.details && <p>{item.details}</p>}
                      {item.prelims_points && <p><strong>Prelims:</strong> {item.prelims_points}</p>}
                      {item.mains_angle && <p><strong>Mains:</strong> {item.mains_angle}</p>}
                    </>}
                    {item.keywords && <div className="ca-keywords"><strong>Keywords:</strong> {item.keywords}</div>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <style jsx>{`
        .ca-student{max-width:1050px;margin:auto}.ca-filters{display:grid;grid-template-columns:1fr 180px 1.5fr;gap:9px;margin:20px 0}
        .ca-filters input,.ca-filters select{width:100%;height:40px;border:1px solid #d8dee9;border-radius:9px;padding:0 10px;background:#fff;font:inherit;box-sizing:border-box}
        .ca-student-list{display:grid;gap:10px}.ca-student-item{border:1px solid var(--line);border-radius:11px;background:#fff;overflow:hidden}.ca-student-item.open{box-shadow:0 4px 16px rgba(20,40,70,.07)}
        .ca-student-header{width:100%;display:flex;justify-content:space-between;gap:12px;text-align:left;border:0;background:#fff;padding:14px;cursor:pointer;color:var(--ink)}
        .ca-student-header span{display:grid;gap:4px;min-width:0}.ca-student-header small{color:var(--primary);font-size:10px;font-weight:800;text-transform:uppercase}.ca-student-header strong{font-size:16px;line-height:1.4}.ca-student-header em{font-style:normal;color:var(--muted);font-size:12px;line-height:1.45}.ca-student-header>b{font-size:20px;color:var(--primary)}
        .ca-reader{padding:15px;border-top:1px solid var(--line);background:#fff}.ca-reader-topic{color:var(--primary);font-weight:800;font-size:12px;margin-bottom:9px}.ca-reader-content{font-size:14px;line-height:1.85;color:#263746}.ca-reader-content h1{font-size:23px;color:#173f5f;margin:4px 0 16px}.ca-reader-content h2{font-size:18px;color:#0f766e;margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #e5eceb}.ca-reader-content h3{font-size:15px;color:#3e617a;margin:16px 0 6px}.ca-reader-content p{margin:7px 0}.ca-reader-content strong{font-weight:800;color:#172f45}.ca-reader-content ul{padding-left:22px;margin:7px 0}.ca-reader-content li{margin:5px 0}.ca-reader-content blockquote{margin:12px 0;padding:10px 13px;border-left:4px solid var(--primary);background:#f2f8f7;border-radius:5px;color:#254b4a;font-weight:650}.ca-reader p{font-size:14px;line-height:1.7}.ca-keywords{margin-top:16px;padding-top:10px;border-top:1px dashed var(--line);color:var(--muted);font-size:12px}
        @media(max-width:700px){.ca-filters{grid-template-columns:1fr}.ca-student-header{padding:12px}.ca-reader{padding:13px}.ca-reader-content{font-size:13px;line-height:1.75}}
      `}</style>
    </main>
  );
}
