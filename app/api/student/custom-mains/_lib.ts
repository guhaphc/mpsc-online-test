import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.1-flash-lite";

export async function getStudentContext(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return { ok: false as const, response: NextResponse.json({ error: "Server authentication is not configured." }, { status: 500 }) };
  }

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const authClient = createClient(supabaseUrl, publishableKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
    return { ok: false as const, response: NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 }) };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("mpsc_profiles")
    .select("role,access_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.access_status !== "approved" || !["user", "student"].includes(String(profile.role))) {
    return { ok: false as const, response: NextResponse.json({ error: "An approved student account is required." }, { status: 403 }) };
  }

  return { ok: true as const, user, adminClient };
}

export async function geminiJson(
  prompt: string,
  attachments: Array<{ mimeType: string; data: string }> = [],
  responseSchema?: Record<string, unknown>,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured on the server.");

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const attachment of attachments) {
    parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          ...(responseSchema ? { responseSchema } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini request failed:", response.status, detail.slice(0, 400));
    throw new Error("The AI service could not process this request. Please try again.");
  }

  const payload = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text;
  if (!raw) throw new Error("The AI service returned an empty response.");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("The AI service returned an invalid response. Please try again.");
  }
}

export function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "upload";
}
