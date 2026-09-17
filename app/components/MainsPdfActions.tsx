"use client";

import { useEffect } from "react";

type SectionData = {
  title: string;
  body: string;
};

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

  const weaknessParts = [missingPoints, factualErrors].filter(Boolean);
  const weaknesses = weaknessParts.length
    ? weaknessParts.join("\n")
    : "No specific weakness was identified by the AI evaluation.";

  const improvementParts = [feedback, framework].filter(Boolean);
  const improvements = improvementParts.length
    ? improvementParts.join("\n\n")
    : "Use the criteria and missing-point analysis above to strengthen the next answer.";

  return {
    question,
    answer,
    marks,
    wordBar,
    score,
    confidence,
    criteria,
    strengths,
    weaknesses,
    missingPoints,
    factualErrors,
    feedback,
    framework,
    improvedAnswer,
    improvements,
    generatedAt: new Date().toLocaleString()
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function textHtml(value: string) {
  return escapeHtml(value || "—").replace(/\n/g, "<br />");
}

function sectionHtml(title: string, body: string, className = "") {
  if (!body) return "";
  return `<section class="pdf-section ${className}"><h2>${escapeHtml(title)}</h2><div class="pdf-body">${textHtml(body)}</div></section>`;
}

function criteriaHtml(criteria: { name: string; value: string }[]) {
  if (!criteria.length) return "";
  return `<section class="pdf-section"><h2>AI Assessment Criteria</h2><table><thead><tr><th>Criterion</th><th>Assessment</th></tr></thead><tbody>${criteria
    .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.value)}</td></tr>`)
    .join("")}</tbody></table></section>`;
}

function makeDocument(data: NonNullable<ReturnType<typeof getEvaluationData>>, mode: 1 | 2 | 3) {
  const title = mode === 1
    ? "Complete Answer Analysis"
    : mode === 2
      ? "Improved Answer & Model Points"
      : "Complete Revision Sheet";

  const analysis = mode === 1 || mode === 3;
  const improved = mode === 2 || mode === 3;

  const analysisHtml = analysis ? `
    ${criteriaHtml(data.criteria)}
    ${sectionHtml("Strengths", data.strengths)}
    ${sectionHtml("Weaknesses / Areas of Concern", data.weaknesses)}
    ${sectionHtml("Missing Points", data.missingPoints)}
    ${sectionHtml("Improvement Areas", data.improvements)}
  ` : "";

  const improvedHtml = improved ? `
    ${sectionHtml("AI-Improved Answer", data.improvedAnswer, "highlight")}
    ${sectionHtml("Model Answer Points / Framework", data.framework)}
  ` : "";

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
@page { size: A4; margin: 13mm 13mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; color: #172033; background: #fff; font-size: 11pt; line-height: 1.55; }
body::before { content: ""; position: fixed; inset: 5mm; border: 1.4px solid #8793a5; pointer-events: none; z-index: 9999; }
.pdf-page { position: relative; min-height: 100vh; padding: 3mm 4mm 12mm; }
.pdf-header { border-bottom: 2px solid #234f78; padding-bottom: 9px; margin-bottom: 13px; }
.pdf-brand { font-size: 9pt; letter-spacing: .16em; font-weight: 800; color: #234f78; }
.pdf-title { margin: 4px 0 2px; font-size: 21pt; line-height: 1.15; color: #172033; }
.pdf-subtitle { color: #687386; font-size: 9pt; }
.meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin: 10px 0 13px; }
.meta-item { border: 1px solid #d5dce5; border-radius: 6px; padding: 7px 9px; background: #f7f9fb; }
.meta-label { display:block; color:#687386; font-size:8pt; text-transform:uppercase; letter-spacing:.05em; }
.meta-value { display:block; font-weight:700; margin-top:2px; }
.question-box, .answer-box { border: 1px solid #cbd4df; border-radius: 7px; padding: 11px 12px; margin-bottom: 13px; background: #fff; }
.box-label { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing:.06em; color:#234f78; margin-bottom:6px; }
.question-text { font-size: 12pt; font-weight: 600; line-height:1.55; }
.answer-text { white-space: pre-wrap; overflow-wrap:anywhere; }
.score-row { display:flex; justify-content:space-between; gap:10px; align-items:center; border:1px solid #cbd4df; border-radius:7px; padding:9px 12px; margin-bottom:13px; background:#f5f8fc; }
.score { font-size:18pt; font-weight:800; color:#234f78; }
.confidence { color:#687386; font-size:9pt; }
.pdf-section { margin: 0 0 13px; break-inside: avoid; page-break-inside: avoid; }
.pdf-section h2 { font-size: 12pt; margin: 0 0 6px; padding-bottom: 4px; border-bottom: 1px solid #d7dee7; color:#234f78; }
.pdf-body { white-space: normal; overflow-wrap:anywhere; }
.highlight { border: 1.5px solid #234f78; border-radius:7px; padding:11px 12px; background:#f7fbff; }
.highlight h2 { border-bottom-color:#a9bdd1; }
table { width:100%; border-collapse:collapse; font-size:10pt; }
th, td { border:1px solid #cbd4df; padding:7px 8px; text-align:left; vertical-align:top; }
th { background:#eef3f8; font-weight:800; }
.footer { position: fixed; left: 10mm; right: 10mm; bottom: 4mm; text-align:center; font-size:8pt; color:#687386; }
.note { margin-top: 10px; padding: 8px 10px; border-left: 3px solid #234f78; background:#f7f9fb; color:#4d596d; font-size:9pt; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display:none !important; } }
</style></head><body>
<div class="pdf-page">
  <header class="pdf-header"><div class="pdf-brand">MPSC / UPSC • AI ANSWER EVALUATION</div><div class="pdf-title">${escapeHtml(title)}</div><div class="pdf-subtitle">Professional answer-writing analysis and revision document</div></header>
  <div class="meta">
    <div class="meta-item"><span class="meta-label">Maximum Marks</span><span class="meta-value">${escapeHtml(data.marks || "—")}</span></div>
    <div class="meta-item"><span class="meta-label">Answer Assessment</span><span class="meta-value">${escapeHtml(data.score || "—")}</span></div>
    <div class="meta-item"><span class="meta-label">Word Information</span><span class="meta-value">${escapeHtml(data.wordBar || "—")}</span></div>
  </div>
  <section class="question-box"><div class="box-label">Published Question</div><div class="question-text">${textHtml(data.question)}</div></section>
  ${mode === 1 || mode === 3 ? `<section class="answer-box"><div class="box-label">Student's Answer</div><div class="answer-text">${textHtml(data.answer)}</div></section>` : ""}
  ${mode === 1 || mode === 3 ? `<div class="score-row"><span class="score">${escapeHtml(data.score || "—")}</span><span class="confidence">${escapeHtml(data.confidence || "")}</span></div>` : ""}
  ${analysisHtml}
  ${improvedHtml}
  <div class="note">AI-generated feedback is intended as a study aid. Verify factual, constitutional and current-affairs details before using them in an examination.</div>
</div>
<div class="footer">MPSC / UPSC AI Answer Evaluation • Generated ${escapeHtml(data.generatedAt)}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},250);}; window.onafterprint=function(){setTimeout(function(){window.close();},200);};</script>
</body></html>`;
}

function openPdfPrint(mode: 1 | 2 | 3) {
  const data = getEvaluationData();
  if (!data) return;
  const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!popup) {
    window.alert("Please allow pop-ups for this website to generate the PDF.");
    return;
  }
  popup.document.open();
  popup.document.write(makeDocument(data, mode));
  popup.document.close();
}

function installButtons() {
  const result = document.querySelector<HTMLElement>(".mains-evaluation-result");
  const anchor = document.querySelector<HTMLElement>(".mains-evaluate-card");
  if (!result || !anchor || document.querySelector("[data-mains-pdf-actions]")) return;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-mains-pdf-actions", "true");
  wrapper.style.cssText = "margin-top:12px;padding:12px;border:1px solid #dbe1e9;border-radius:14px;background:#f8fafc";
  wrapper.innerHTML = `
    <div style="font-weight:800;margin-bottom:8px">📄 Download Professional PDF</div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
      <button type="button" data-pdf-mode="1" style="min-height:44px;border:1px solid #ccd4df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer">📊 Complete Analysis</button>
      <button type="button" data-pdf-mode="2" style="min-height:44px;border:1px solid #ccd4df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer">✍️ Improved Answer</button>
      <button type="button" data-pdf-mode="3" style="min-height:44px;border:0;border-radius:9px;background:#234f78;color:#fff;font-weight:800;cursor:pointer">📚 Revision PDF</button>
    </div>
    <div style="margin-top:7px;color:#687386;font-size:12px;line-height:1.4">A4 format with page boundary, professional header/footer and print-ready layout. Choose <b>Save as PDF</b> in the print dialog.</div>
  `;
  wrapper.querySelectorAll<HTMLButtonElement>("[data-pdf-mode]").forEach((button) => {
    button.addEventListener("click", () => openPdfPrint(Number(button.dataset.pdfMode) as 1 | 2 | 3));
  });
  anchor.insertAdjacentElement("afterend", wrapper);
}

export default function MainsPdfActions() {
  useEffect(() => {
    installButtons();
    const observer = new MutationObserver(() => installButtons());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
