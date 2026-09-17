import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return NextResponse.json({ premium: false }, { status: 401 });

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: { user }, error: userError } = await client.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ premium: false }, { status: 401 });

    const { data: profile } = await client.from("mpsc_profiles")
      .select("role, access_status").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin" && profile.access_status === "approved") {
      return NextResponse.json({ premium: true, role: "admin" });
    }

    const { data: access, error } = await client.from("mpsc_premium_access")
      .select("is_premium, valid_until").eq("user_id", user.id).maybeSingle();
    if (error) return NextResponse.json({ premium: false }, { status: 500 });

    const premium = Boolean(access?.is_premium) &&
      (!access?.valid_until || new Date(access.valid_until).getTime() >= Date.now());
    return NextResponse.json({ premium });
  } catch {
    return NextResponse.json({ premium: false }, { status: 500 });
  }
}
