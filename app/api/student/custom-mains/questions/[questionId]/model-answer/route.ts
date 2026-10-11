import { NextRequest, NextResponse } from "next/server";
import { getStudentContext } from "../../../_lib";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const context = await getStudentContext(request);
  if (!context.ok) return context.response;

  const { questionId } = await params;
  if (!questionId || questionId.length > 100) {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }

  const { data, error } = await context.adminClient
    .from("mpsc_student_custom_mains_questions")
    .select("model_answer")
    .eq("id", questionId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (error) {
    console.error("Custom Mains model answer fetch failed:", error.message);
    return NextResponse.json({ error: "Could not load the model answer." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  return NextResponse.json({ model_answer: data.model_answer });
}
