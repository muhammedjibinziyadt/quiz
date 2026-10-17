import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Quiz } from "@/models/Quiz";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await context.params;
    await connectToDatabase();

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      studentId: session.studentId,
      isCompleted: true,
    }).lean();

    if (!attempt) {
      return NextResponse.json({ error: "Result not found or not finalized" }, { status: 404 });
    }

    const quiz = await Quiz.findById(attempt.quizId)
      .select("title allowReviewAnswers")
      .lean();

    // STRICT PRIVACY ENFORCEMENT:
    // Withhold scores and answer details from participant view.
    return NextResponse.json(
      {
        attemptId: attempt._id,
        quizTitle: quiz?.title || "Quiz Competition",
        submittedAt: attempt.submittedAt,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Result fetch error:", error);
    return NextResponse.json({ error: "Failed to load result" }, { status: 500 });
  }
}
