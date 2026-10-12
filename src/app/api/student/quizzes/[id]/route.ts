import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectToDatabase();

    const quiz = await Quiz.findOne({ _id: id, status: "published" }).lean();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found or not published" }, { status: 404 });
    }

    const questionsCount = await Question.countDocuments({ quizId: id });
    const completedAttempts = await QuizAttempt.countDocuments({
      quizId: id,
      studentId: session.studentId,
      isCompleted: true,
    });

    const activeAttempt = await QuizAttempt.findOne({
      quizId: id,
      studentId: session.studentId,
      isCompleted: false,
    }).lean();

    return NextResponse.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        coverImage: quiz.coverImage,
        quizType: quiz.quizType,
        durationSeconds: quiz.durationSeconds,
        timeLimitPerQuestion: quiz.timeLimitPerQuestion ?? 10,
        marksPerQuestion: quiz.marksPerQuestion,
        negativeMarkingEnabled: quiz.negativeMarkingEnabled,
        negativeMarks: quiz.negativeMarks,
        questionsCount,
        maxAttempts: quiz.maxAttempts,
        completedAttempts,
        hasAttemptsLeft: completedAttempts < quiz.maxAttempts,
        activeAttempt: activeAttempt
          ? {
              id: activeAttempt._id,
              startTime: activeAttempt.startTime,
              serverDeadline: activeAttempt.serverDeadline,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Student quiz detail error:", error);
    return NextResponse.json({ error: "Failed to load quiz details" }, { status: 500 });
  }
}
