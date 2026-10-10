import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { evaluateQuizAttempt, refreshAndBroadcastLeaderboard } from "@/lib/scoring";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await context.params;
    let finalAnswers: Array<{ questionId: string; selectedOptionId: string }> = [];

    try {
      const body = await req.json();
      if (body && Array.isArray(body.answers)) {
        finalAnswers = body.answers;
      }
    } catch {
      // Body is optional if relying on already saved answers
    }

    await connectToDatabase();

    // Find the attempt - must belong to student and not already completed
    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      studentId: session.studentId,
      isCompleted: false,
    });

    if (!attempt) {
      // Check if it was already completed (prevent duplicate submission)
      const alreadyCompleted = await QuizAttempt.findOne({
        _id: attemptId,
        studentId: session.studentId,
        isCompleted: true,
      });

      if (alreadyCompleted) {
        return NextResponse.json({
          success: true,
          message: "Quiz was already submitted",
          alreadyCompleted: true,
          score: alreadyCompleted.score,
          attemptId: alreadyCompleted._id,
        });
      }

      return NextResponse.json({ error: "Active attempt not found" }, { status: 404 });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = await Question.find({ quizId: attempt.quizId }).lean();

    // Merge any answers sent in submit request with savedAnswers
    const mergedMap = new Map<string, string>();
    for (const ans of attempt.savedAnswers || []) {
      mergedMap.set(String(ans.questionId), String(ans.selectedOptionId));
    }
    for (const ans of finalAnswers) {
      if (ans.questionId && ans.selectedOptionId) {
        mergedMap.set(String(ans.questionId), String(ans.selectedOptionId));
      }
    }

    const mergedAnswers = Array.from(mergedMap.entries()).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId,
    }));

    // Server-Authoritative Timing
    const now = new Date();
    const serverDeadlineMs = new Date(attempt.serverDeadline).getTime();
    const graceMs = 15000; // 15s grace for network latency

    let submissionTime = now;
    if (now.getTime() > serverDeadlineMs + graceMs) {
      // Clamped to deadline if late
      submissionTime = new Date(serverDeadlineMs);
    }

    // Evaluate answers
    const evalResult = evaluateQuizAttempt(
      quiz,
      questions,
      mergedAnswers,
      attempt.startTime,
      submissionTime
    );

    // Atomic update to mark completed and set score
    const updatedAttempt = await QuizAttempt.findOneAndUpdate(
      { _id: attemptId, isCompleted: false },
      {
        $set: {
          isCompleted: true,
          submittedAt: submissionTime,
          savedAnswers: mergedAnswers,
          score: evalResult.score,
          totalPossibleMarks: evalResult.totalPossibleMarks,
          correctCount: evalResult.correctCount,
          incorrectCount: evalResult.incorrectCount,
          unansweredCount: evalResult.unansweredCount,
          completionTimeSeconds: evalResult.completionTimeSeconds,
          answersDetail: evalResult.answersDetail,
        },
      },
      { new: true }
    );

    if (!updatedAttempt) {
      return NextResponse.json({
        success: true,
        message: "Attempt was finalized concurrently",
        alreadyCompleted: true,
      });
    }

    // Broadcast updated ranking to Admin Leaderboard via Pusher (resilient, non-blocking)
    try {
      await refreshAndBroadcastLeaderboard(String(quiz._id));
    } catch (pushErr) {
      console.warn("Pusher broadcast error (submission preserved):", pushErr);
    }

    // PRIVACY: Return ONLY student's own score and result summary
    return NextResponse.json({
      success: true,
      message: "Quiz submitted successfully!",
      result: {
        attemptId: updatedAttempt._id,
        score: updatedAttempt.score,
        totalPossibleMarks: updatedAttempt.totalPossibleMarks,
        correctCount: updatedAttempt.correctCount,
        incorrectCount: updatedAttempt.incorrectCount,
        unansweredCount: updatedAttempt.unansweredCount,
        completionTimeSeconds: updatedAttempt.completionTimeSeconds,
        submittedAt: updatedAttempt.submittedAt,
        allowReviewAnswers: quiz.allowReviewAnswers,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
