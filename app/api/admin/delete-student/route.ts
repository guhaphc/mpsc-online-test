import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "").trim();

    const body = await request.json();
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !publishableKey
    ) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }
    const userClient = createClient(
      supabaseUrl,
      publishableKey
    );

    const {
      data: { user: adminUser },
      error: adminAuthError,
    } = await userClient.auth.getUser(token);

    if (adminAuthError || !adminUser) {
      return NextResponse.json(
        { error: "Invalid admin session." },
        { status: 401 }
      );
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { data: adminProfile, error: profileError } =
      await adminClient
        .from("mpsc_profiles")
        .select("role, access_status")
        .eq("id", adminUser.id)
        .single();

    if (
      profileError ||
      adminProfile?.role !== "admin" ||
      adminProfile?.access_status !== "approved"
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    if (userId === adminUser.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own admin account.",
        },
        { status: 400 }
      );
    }
        const { data: targetProfile, error: targetError } =
      await adminClient
        .from("mpsc_profiles")
        .select("id, role")
        .eq("id", userId)
        .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json(
        {
          error:
            "Admin accounts cannot be deleted here.",
        },
        { status: 403 }
      );
    }

    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: deleteAuthError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
