import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getQuizLeaderboard } from "@/lib/scoring";
import { Quiz } from "@/models/Quiz";

export const dynamic = "force-dynamic";

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

    const [quiz, leaderboard] = await Promise.all([
      Quiz.findById(quizId).select("title durationSeconds quizType").lean(),
      getQuizLeaderboard(quizId),
    ]);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          durationSeconds: quiz.durationSeconds,
          quizType: quiz.quizType,
        },
        updatedAt: new Date().toISOString(),
        totalParticipants: leaderboard.length,
        leaderboard,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
