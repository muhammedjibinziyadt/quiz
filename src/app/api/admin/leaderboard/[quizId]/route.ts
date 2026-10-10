import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getQuizLeaderboard } from "@/lib/scoring";
import { Quiz } from "@/models/Quiz";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      // STRICT ACCESS CONTROL: Students must NEVER see this endpoint!
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { quizId } = await context.params;
    await connectToDatabase();

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const leaderboard = await getQuizLeaderboard(quizId);

    return NextResponse.json({
      quiz: {
        id: quiz._id,
        title: quiz.title,
        durationSeconds: quiz.durationSeconds,
        quizType: quiz.quizType,
      },
      updatedAt: new Date().toISOString(),
      totalParticipants: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
