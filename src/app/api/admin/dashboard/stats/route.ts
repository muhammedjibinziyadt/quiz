import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { AuditLog } from "@/models/AuditLog";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [
      totalRegisteredStudents,
      totalQuizzes,
      publishedQuizzes,
      totalAttempts,
      completedAttempts,
      activeParticipants,
      recentActivity,
    ] = await Promise.all([
      Student.countDocuments({}),
      Quiz.countDocuments({}),
      Quiz.countDocuments({ status: "published" }),
      QuizAttempt.countDocuments({}),
      QuizAttempt.countDocuments({ isCompleted: true }),
      QuizAttempt.countDocuments({ isCompleted: false }),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(8).lean(),
    ]);

    return NextResponse.json({
      stats: {
        totalRegisteredStudents,
        totalQuizzes,
        publishedQuizzes,
        totalAttempts,
        completedAttempts,
        activeParticipants,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
