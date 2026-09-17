"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

function textFromList(section: HTMLElement) {
  const items = Array.from(section.querySelectorAll("li"))
    .map((item) => item.textContent?.trim())
    .filter(Boolean) as string[];
  return items.length ? items.map((item) => `• ${item}`).join("\n") : "";
}

function getSection(title: string): string {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".mains-evaluation-section"));
  const section = sections.find((item) =>
    (item.querySelector("h3")?.textContent || "").toLowerCase().includes(title.toLowerCase())
  );
  if (!section) return "";
  return textFromList(section) || section.querySelector("p")?.textContent?.trim() || "";
}

function getEvaluationData() {
  const result = document.querySelector<HTMLElement>(".mains-evaluation-result");
  if (!result) return null;
  const question = document.querySelector<HTMLElement>(".mains-selected-question h2")?.textContent?.trim() || "";
  const answer = document.querySelector<HTMLTextAreaElement>(".mains-answer-label textarea")?.value?.trim() || "";
  const marks = document.querySelector<HTMLElement>(".mains-marks strong")?.textContent?.trim() || "";
  const wordBar = document.querySelector<HTMLElement>(".mains-word-bar")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const score = result.querySelector<HTMLElement>(".mains-evaluation-score strong")?.textContent?.trim() || "";
  const confidence = result.querySelector<HTMLElement>(".mains-evaluation-confidence")?.textContent?.trim() || "";
  const criteria = Array.from(result.querySelectorAll<HTMLElement>(".mains-criteria-item")).map((item) => ({
    name: item.querySelector("span")?.textContent?.trim() || "",
    value: item.querySelector("strong")?.textContent?.trim() || ""
  }));
  const strengths = getSection("strengths");
  const missingPoints = getSection("missing points");
  const factualErrors = getSection("factual errors");
  const feedback = getSection("detailed feedback");
  const framework = getSection("answer framework");
  const improvedAnswer = getSection("improved answer");
  const weaknesses = [missingPoints, factualErrors].filter(Boolean).join("\n") || "No specific weakness was identified by the AI evaluation.";
  const improvements = [feedback, framework].filter(Boolean).join("\n\n") || "Use the criteria and missing-point analysis above to strengthen the next answer.";
  return { question, answer, marks, wordBar, score, confidence, criteria, strengths, weaknesses, missingPoints, factualErrors, feedback, framework, improvedAnswer, improvements, generatedAt: new Date().toLocaleString() };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}
function textHtml(value: string) { return escapeHtml(value || "—").replace(/\n/g, "<br />"); }
function sectionHtml(title: string, body: string, className = "") {
  if (!body) return "";
  return `<section class="pdf-section ${className}"><h2>${escapeHtml(title)}</h2><div class="pdf-body">${textHtml(body)}</div></section>`;
}
function criteriaHtml(criteria: { name: string; value: string }[]) {
  if (!criteria.length) return "";
  return `<section class="pdf-section"><h2>AI Assessment Criteria</h2><table><thead><tr><th>Criterion</th><th>Assessment</th></tr></thead><tbody>${criteria.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.value)}</td></tr>`).join("")}</tbody></table></section>`;
}

function makeDocument(data: NonNullable<ReturnType<typeof getEvaluationData>>, mode: 1 | 2 | 3) {
  const title = mode === 1 ? "Complete Answer Analysis" : mode === 2 ? "Improved Answer & Model Points" : "Complete Revision Sheet";
  const analysis = mode === 1 || mode === 3;
  const improved = mode === 2 || mode === 3;
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#172033;background:#fff;font-size:11pt;line-height:1.55}.pdf-page{width:190mm;margin:0 auto;padding:8mm 5mm 15mm;position:relative}.pdf-page:before{content:"";position:absolute;inset:2mm;border:1.3px solid #8793a5;pointer-events:none}.pdf-header{border-bottom:2px solid #234f78;padding-bottom:9px;margin-bottom:13px}.pdf-brand{font-size:9pt;letter-spacing:.16em;font-weight:800;color:#234f78}.pdf-title{margin:4px 0 2px;font-size:21pt;line-height:1.15}.pdf-subtitle{color:#687386;font-size:9pt}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin:10px 0 13px}.meta-item{border:1px solid #d5dce5;border-radius:6px;padding:7px 9px;background:#f7f9fb}.meta-label{display:block;color:#687386;font-size:8pt;text-transform:uppercase}.meta-value{display:block;font-weight:700;margin-top:2px}.question-box,.answer-box{border:1px solid #cbd4df;border-radius:7px;padding:11px 12px;margin-bottom:13px}.box-label{font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#234f78;margin-bottom:6px}.question-text{font-size:12pt;font-weight:600}.answer-text{white-space:pre-wrap;overflow-wrap:anywhere}.score-row{display:flex;justify-content:space-between;gap:10px;border:1px solid #cbd4df;border-radius:7px;padding:9px 12px;margin-bottom:13px;background:#f5f8fc}.score{font-size:18pt;font-weight:800;color:#234f78}.confidence{color:#687386;font-size:9pt}.pdf-section{margin:0 0 13px;break-inside:avoid;page-break-inside:avoid}.pdf-section h2{font-size:12pt;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid #d7dee7;color:#234f78}.pdf-body{overflow-wrap:anywhere}.highlight{border:1.5px solid #234f78;border-radius:7px;padding:11px 12px;background:#f7fbff}.highlight h2{border-bottom-color:#a9bdd1}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{border:1px solid #cbd4df;padding:7px 8px;text-align:left;vertical-align:top}th{background:#eef3f8;font-weight:800}.note{margin-top:10px;padding:8px 10px;border-left:3px solid #234f78;background:#f7f9fb;color:#4d596d;font-size:9pt}.footer{margin-top:12px;text-align:center;font-size:8pt;color:#687386}@media(max-width:600px){.pdf-page{width:190mm}}
</style></head><body><div class="pdf-page"><header class="pdf-header"><div class="pdf-brand">MPSC / UPSC • AI ANSWER EVALUATION</div><div class="pdf-title">${escapeHtml(title)}</div><div class="pdf-subtitle">Professional answer-writing analysis and revision document</div></header><div class="meta"><div class="meta-item"><span class="meta-label">Maximum Marks</span><span class="meta-value">${escapeHtml(data.marks || "—")}</span></div><div class="meta-item"><span class="meta-label">Assessment</span><span class="meta-value">${escapeHtml(data.score || "—")}</span></div><div class="meta-item"><span class="meta-label">Word Information</span><span class="meta-value">${escapeHtml(data.wordBar || "—")}</span></div></div><section class="question-box"><div class="box-label">Published Question</div><div class="question-text">${textHtml(data.question)}</div></section>${analysis ? `<section class="answer-box"><div class="box-label">Student's Answer</div><div class="answer-text">${textHtml(data.answer)}</div></section><div class="score-row"><span class="score">${escapeHtml(data.score || "—")}</span><span class="confidence">${escapeHtml(data.confidence || "")}</span></div>${criteriaHtml(data.criteria)}${sectionHtml("Strengths",data.strengths)}${sectionHtml("Weaknesses / Areas of Concern",data.weaknesses)}${sectionHtml("Missing Points",data.missingPoints)}${sectionHtml("Improvement Areas",data.improvements)}` : ""}${improved ? `${sectionHtml("AI-Improved Answer",data.improvedAnswer,"highlight")}${sectionHtml("Model Answer Points / Framework",data.framework)}` : ""}<div class="note">AI-generated feedback is intended as a study aid. Verify factual, constitutional and current-affairs details before using them in an examination.</div><div class="footer">MPSC / UPSC AI Answer Evaluation • Generated ${escapeHtml(data.generatedAt)}</div></div></body></html>`;
}

async function downloadPdf(mode: 1 | 2 | 3) {
  const data = getEvaluationData();
  if (!data) return;
  if (!window.html2pdf) {
    window.alert("PDF engine is still loading. Please wait a moment and try again.");
    return;
  }
  const fullHtml = makeDocument(data, mode);
  const parser = new DOMParser();
  const parsed = parser.parseFromString(fullHtml, "text/html");
  const style = parsed.querySelector("style");
  const source = document.createElement("div");
  source.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1;";
  if (style) source.appendChild(style.cloneNode(true));
  const page = parsed.querySelector(".pdf-page");
  if (!page) return;
  source.appendChild(page.cloneNode(true));
  document.body.appendChild(source);
  const filenameBase = mode === 1 ? "MPSC_UPSC_Complete_Answer_Analysis" : mode === 2 ? "MPSC_UPSC_Improved_Answer" : "MPSC_UPSC_Complete_Revision_Sheet";
  try {
    await window.html2pdf().set({
      margin: [8, 8, 10, 8],
      filename: `${filenameBase}.pdf`,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    }).from(source).save();
  } finally {
    source.remove();
  }
}

function installButtons(ready: boolean) {
  const result = document.querySelector<HTMLElement>(".mains-evaluation-result");
  const anchor = document.querySelector<HTMLElement>(".mains-evaluate-card");
  if (!result || !anchor) return;
  let wrapper = document.querySelector<HTMLElement>("[data-mains-pdf-actions]");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.setAttribute("data-mains-pdf-actions", "true");
    wrapper.style.cssText = "margin-top:12px;padding:12px;border:1px solid #dbe1e9;border-radius:14px;background:#f8fafc";
    anchor.insertAdjacentElement("afterend", wrapper);
  }
  wrapper.innerHTML = `<div style="font-weight:800;margin-bottom:8px">📄 Download Professional PDF</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"><button type="button" data-pdf-mode="1" ${ready ? "" : "disabled"} style="min-height:44px;border:1px solid #ccd4df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer">📊 Complete Analysis</button><button type="button" data-pdf-mode="2" ${ready ? "" : "disabled"} style="min-height:44px;border:1px solid #ccd4df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer">✍️ Improved Answer</button><button type="button" data-pdf-mode="3" ${ready ? "" : "disabled"} style="min-height:44px;border:0;border-radius:9px;background:#234f78;color:#fff;font-weight:800;cursor:pointer">📚 Revision PDF</button></div><div style="margin-top:7px;color:#687386;font-size:12px;line-height:1.4">${ready ? "PDF downloads directly to your device. No print dialog or pop-up is required." : "Loading PDF engine…"}</div>`;
  wrapper.querySelectorAll<HTMLButtonElement>("[data-pdf-mode]").forEach((button) => {
    button.addEventListener("click", () => void downloadPdf(Number(button.dataset.pdfMode) as 1 | 2 | 3));
  });
}

export default function MainsPdfActions() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.html2pdf) { setReady(true); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-mains-html2pdf="true"]');
    const script = existing || document.createElement("script");
    if (!existing) {
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.async = true;
      script.dataset.mainsHtml2pdf = "true";
      script.onload = () => setReady(true);
      script.onerror = () => setReady(false);
      document.head.appendChild(script);
    } else if (window.html2pdf) setReady(true);
    const timer = window.setInterval(() => { if (window.html2pdf) { setReady(true); window.clearInterval(timer); } }, 500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    installButtons(ready);
    const observer = new MutationObserver(() => installButtons(ready));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ready]);
  return null;
}
