import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nijhvrddhkokfesyjzoq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

function client(token: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function requireAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Authentication required.");
  const sb = client(auth.slice(7));
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error("Invalid authentication session.");
  const { data: profile, error: profileError } = await sb
    .from("mpsc_profiles")
    .select("role,access_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (profile?.role !== "admin" || profile?.access_status !== "approved") {
    throw new Error("Admin access required.");
  }
  return sb;
}

const schema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    topic: { type: "STRING" },
    summary: { type: "STRING" },
    content: { type: "STRING" },
    prelims_points: { type: "STRING" },
    mains_angle: { type: "STRING" },
    keywords: { type: "STRING" },
  },
  required: ["title", "topic", "summary", "content", "prelims_points", "mains_angle", "keywords"],
};

async function gemini(prompt: string) {
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini request failed (${response.status}).`);
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("AI returned an empty response.");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const sourceText = String(body.sourceText || "").trim();

    if (!subject) return NextResponse.json({ error: "Select a subject." }, { status: 400 });
    if (sourceText.length < 80) {
      return NextResponse.json({ error: "Paste enough source material to generate the note." }, { status: 400 });
    }
    if (sourceText.length > 120000) {
      return NextResponse.json({ error: "The pasted content is too large. Please paste a shorter source." }, { status: 400 });
    }

    const prompt = `You are an expert UPSC and MPSC current-affairs editor.

Create a professional, student-ready current-affairs note from the administrator's source material below.

SUBJECT: ${subject}

IMPORTANT RULES:
1. Use the supplied source material as the primary factual basis.
2. Do not invent dates, statistics, schemes, court cases, Articles, reports, institutions or other facts.
3. You may add only essential stable background knowledge needed to make the topic understandable.
4. Keep the note concise, clear and examination-oriented.
5. Create a useful balance of Prelims facts and Mains understanding.
6. Use clean plain text. Do not use Markdown symbols, HTML, emojis, or decorative characters.
7. Structure CONTENT with clear headings separated by blank lines.
8. Use simple bullet points beginning with "•".
9. Include "Why in News?", "Background", "Key Information", "Significance", "Challenges/Issues" and "Way Forward" only when relevant. Do not force irrelevant sections.
10. End the content with a compact "Prelims Revision" section.
11. Do not copy long passages from the source; synthesize them.
12. Return an administrator-reviewable draft. Do not claim external verification.
13. If the source contains an uncertain or questionable claim, preserve it cautiously and mention "Verify before publication" in the relevant section rather than inventing a correction.

Return:
- A professional title
- A short topic
- A 2-3 sentence summary
- Full ready-to-publish content
- Compact Prelims Points
- Compact Mains Angle
- Comma-separated keywords

SOURCE MATERIAL:
${sourceText}`;

    const generated = await gemini(prompt);
    const clean = (value: unknown) => String(value || "").trim();

    return NextResponse.json({
      title: clean(generated.title),
      topic: clean(generated.topic),
      summary: clean(generated.summary),
      content: clean(generated.content),
      prelims_points: clean(generated.prelims_points),
      mains_angle: clean(generated.mains_angle),
      keywords: clean(generated.keywords),
      model: MODEL,
    });
  } catch (error) {
    console.error("Current affairs generation error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Current affairs generation failed." },
      { status: 500 }
    );
  }
}
