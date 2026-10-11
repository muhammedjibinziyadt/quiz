import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();

    // Query published quizzes that haven't ended yet (includes upcoming and active quizzes)
    const quizzes = await Quiz.find({
      status: "published",
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    })
      .sort({ startTime: 1, createdAt: -1 })
      .lean();

    const quizIds = quizzes.map((q) => q._id);

    // Question count per quiz
    const questionCounts = await Question.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: "$quizId", count: { $sum: 1 } } },
    ]);
    const qCountMap = new Map();
    for (const qc of questionCounts) {
      qCountMap.set(String(qc._id), qc.count);
    }

    // Student's attempts for each quiz
    const studentAttempts = await QuizAttempt.find({
      quizId: { $in: quizIds },
      studentId: session.studentId,
    }).lean();

    const attemptsMap = new Map<string, typeof studentAttempts>();
    for (const att of studentAttempts) {
      const qId = String(att.quizId);
      if (!attemptsMap.has(qId)) {
        attemptsMap.set(qId, []);
      }
      attemptsMap.get(qId)!.push(att);
    }

    const result = quizzes.map((quiz) => {
      const qId = String(quiz._id);
      const studentQuizAttempts = attemptsMap.get(qId) || [];
      const completedCount = studentQuizAttempts.filter((a) => a.isCompleted).length;
      const activeAttempt = studentQuizAttempts.find((a) => !a.isCompleted);
      const hasAttemptsLeft = completedCount < quiz.maxAttempts;
      const isStarted = !quiz.startTime || new Date(quiz.startTime).getTime() <= now.getTime();

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        coverImage: quiz.coverImage,
        quizType: quiz.quizType,
        startTime: quiz.startTime ? new Date(quiz.startTime).toISOString() : null,
        endTime: quiz.endTime ? new Date(quiz.endTime).toISOString() : null,
        isStarted,
        durationSeconds: quiz.durationSeconds,
        marksPerQuestion: quiz.marksPerQuestion,
        negativeMarkingEnabled: quiz.negativeMarkingEnabled,
        negativeMarks: quiz.negativeMarks,
        questionsCount: qCountMap.get(qId) || 0,
        maxAttempts: quiz.maxAttempts,
        completedAttemptsCount: completedCount,
        hasAttemptsLeft,
        activeAttemptId: activeAttempt ? String(activeAttempt._id) : null,
        lastCompletedAttemptId:
          studentQuizAttempts.filter((a) => a.isCompleted).pop()?._id || null,
      };
    });

    return NextResponse.json({ quizzes: result });
  } catch (error) {
    console.error("Student quizzes fetch error:", error);
    return NextResponse.json({ error: "Failed to load quizzes" }, { status: 500 });
  }
}
