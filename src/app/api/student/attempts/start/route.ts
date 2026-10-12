import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Student } from "@/models/Student";
import { evaluateQuizAttempt, refreshAndBroadcastLeaderboard } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { quizId } = body;

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Check student status
    const student = await Student.findById(session.studentId);
    if (!student || !student.isActive) {
      return NextResponse.json({ error: "Student account inactive" }, { status: 403 });
    }

    // Check quiz
    const quiz = await Quiz.findOne({ _id: quizId, status: "published" });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found or not published" }, { status: 404 });
    }

    const now = new Date();
    if (quiz.startTime && quiz.startTime > now) {
      return NextResponse.json({ error: "Quiz has not started yet" }, { status: 403 });
    }
    if (quiz.endTime && quiz.endTime < now) {
      return NextResponse.json({ error: "Quiz has already ended" }, { status: 403 });
    }

    // Check existing uncompleted attempt
    let activeAttempt = await QuizAttempt.findOne({
      quizId,
      studentId: session.studentId,
      isCompleted: false,
    });

    // If there is an active attempt, check if its deadline has already passed
    if (activeAttempt) {
      const gracePeriodMs = 15000;
      if (now.getTime() > new Date(activeAttempt.serverDeadline).getTime() + gracePeriodMs) {
        // Auto-finalize the expired attempt
        const questions = await Question.find({ quizId }).lean();
        const evalResult = evaluateQuizAttempt(
          quiz,
          questions,
          activeAttempt.savedAnswers || [],
          activeAttempt.startTime,
          new Date(activeAttempt.serverDeadline)
        );

        activeAttempt.isCompleted = true;
        activeAttempt.submittedAt = activeAttempt.serverDeadline;
        activeAttempt.score = evalResult.score;
        activeAttempt.totalPossibleMarks = evalResult.totalPossibleMarks;
        activeAttempt.correctCount = evalResult.correctCount;
        activeAttempt.incorrectCount = evalResult.incorrectCount;
        activeAttempt.unansweredCount = evalResult.unansweredCount;
        activeAttempt.completionTimeSeconds = evalResult.completionTimeSeconds;
        activeAttempt.answersDetail = evalResult.answersDetail;
        await activeAttempt.save();

        // Broadcast leaderboard update to admin
        await refreshAndBroadcastLeaderboard(String(quiz._id));

        activeAttempt = null; // Expired attempt handled
      }
    }

    // If active attempt is still valid, return it to resume
    if (activeAttempt) {
      const questions = await Question.find({ quizId }).sort({ order: 1 }).lean();
      // SECURITY: Strip correct answers
      const sanitizedQuestions = questions.map((q) => ({
        _id: q._id,
        order: q.order,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        marks: q.marks ?? quiz.marksPerQuestion,
        timeLimitSeconds: q.timeLimitSeconds ?? quiz.timeLimitPerQuestion ?? 10,
      }));

      return NextResponse.json({
        resumed: true,
        attempt: {
          id: activeAttempt._id,
          attemptNumber: activeAttempt.attemptNumber,
          startTime: activeAttempt.startTime,
          serverDeadline: activeAttempt.serverDeadline,
          savedAnswers: activeAttempt.savedAnswers || [],
        },
        quiz: {
          id: quiz._id,
          title: quiz.title,
          instructions: quiz.instructions,
          durationSeconds: quiz.durationSeconds,
          timeLimitPerQuestion: quiz.timeLimitPerQuestion ?? 10,
          marksPerQuestion: quiz.marksPerQuestion,
          negativeMarkingEnabled: quiz.negativeMarkingEnabled,
          negativeMarks: quiz.negativeMarks,
        },
        questions: sanitizedQuestions,
      });
    }

    // Check maximum attempts
    const completedAttemptsCount = await QuizAttempt.countDocuments({
      quizId,
      studentId: session.studentId,
      isCompleted: true,
    });

    if (completedAttemptsCount >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.` },
        { status: 403 }
      );
    }

    // Create new attempt
    const questions = await Question.find({ quizId }).sort({ order: 1 }).lean();
    if (questions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions available." }, { status: 400 });
    }

    const perQSeconds = quiz.timeLimitPerQuestion || 10;
    const totalAllocatedSeconds = Math.max(
      quiz.durationSeconds || 0,
      perQSeconds * questions.length + 60
    );

    const startTime = new Date();
    const serverDeadline = new Date(startTime.getTime() + totalAllocatedSeconds * 1000);
    const attemptNumber = completedAttemptsCount + 1;

    const newAttempt = await QuizAttempt.create({
      quizId,
      studentId: session.studentId,
      attemptNumber,
      startTime,
      serverDeadline,
      isCompleted: false,
      savedAnswers: [],
      score: 0,
      completionTimeSeconds: 0,
    });

    // Lock quiz modifications while attempt is in progress
    if (!quiz.isLocked) {
      quiz.isLocked = true;
      await quiz.save();
    }

    // SECURITY: Never return correctOptionId or explanation to student before completion
    const sanitizedQuestions = questions.map((q) => ({
      _id: q._id,
      order: q.order,
      questionText: q.questionText,
      questionImage: q.questionImage,
      options: q.options,
      marks: q.marks ?? quiz.marksPerQuestion,
      timeLimitSeconds: q.timeLimitSeconds ?? quiz.timeLimitPerQuestion ?? 10,
    }));

    return NextResponse.json({
      resumed: false,
      attempt: {
        id: newAttempt._id,
        attemptNumber,
        startTime,
        serverDeadline,
        savedAnswers: [],
      },
      quiz: {
        id: quiz._id,
        title: quiz.title,
        instructions: quiz.instructions,
        durationSeconds: quiz.durationSeconds,
        timeLimitPerQuestion: quiz.timeLimitPerQuestion ?? 10,
        marksPerQuestion: quiz.marksPerQuestion,
        negativeMarkingEnabled: quiz.negativeMarkingEnabled,
        negativeMarks: quiz.negativeMarks,
      },
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error("Error starting attempt:", error);
    return NextResponse.json({ error: "Failed to start quiz attempt" }, { status: 500 });
  }
}
