import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// A harmless fallback lets Next.js prerender client routes in environments where
// public runtime variables are injected only at deployment time. It is never a
// credential and all real requests still require the configured public values.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = createClient(
  supabaseUrl ?? "https://not-configured.supabase.co",
  supabasePublishableKey ?? "not-configured-public-key"
);
