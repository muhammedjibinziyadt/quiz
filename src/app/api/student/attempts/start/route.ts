import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Student } from "@/models/Student";
import { evaluateQuizAttempt, refreshAndBroadcastLeaderboard } from "@/lib/scoring";

export const dynamic = "force-dynamic";

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

    // High-performance parallel fetch for initial validation
    const [student, quiz, activeAttemptRaw, completedAttemptsCount] = await Promise.all([
      Student.findById(session.studentId).select("isActive").lean(),
      Quiz.findOne({ _id: quizId, status: "published" }).lean(),
      QuizAttempt.findOne({
        quizId,
        studentId: session.studentId,
        isCompleted: false,
      }),
      QuizAttempt.countDocuments({
        quizId,
        studentId: session.studentId,
        isCompleted: true,
      }),
    ]);

    if (!student || !student.isActive) {
      return NextResponse.json({ error: "Student account inactive" }, { status: 403 });
    }

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

    let activeAttempt = activeAttemptRaw;

    // If there is an active attempt, check if its deadline has already passed
    if (activeAttempt) {
      const gracePeriodMs = 15000;
      if (now.getTime() > new Date(activeAttempt.serverDeadline).getTime() + gracePeriodMs) {
        // Auto-finalize the expired attempt
        const questionsFull = await Question.find({ quizId }).lean();
        const evalResult = evaluateQuizAttempt(
          quiz,
          questionsFull,
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

        // Broadcast leaderboard update non-blockingly
        refreshAndBroadcastLeaderboard(String(quiz._id)).catch((err) =>
          console.warn("Leaderboard broadcast failed:", err)
        );

        activeAttempt = null; // Expired attempt handled
      }
    }

    // Fast projected query: fetch ONLY student-visible fields (never loads correct answers from DB)
    const questions = await Question.find({ quizId })
      .sort({ order: 1 })
      .select("_id order questionType minWords questionText questionImage options marks timeLimitSeconds")
      .lean();

    if (questions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions available." }, { status: 400 });
    }

    const sanitizedQuestions = questions.map((q) => ({
      _id: q._id,
      order: q.order,
      questionType: q.questionType || "mcq",
      minWords: q.minWords ?? 20,
      questionText: q.questionText,
      questionImage: q.questionImage,
      options: q.options,
      marks: q.marks ?? quiz.marksPerQuestion,
      timeLimitSeconds: q.timeLimitSeconds ?? quiz.timeLimitPerQuestion ?? 10,
    }));

    // If active attempt is still valid, return it immediately to resume
    if (activeAttempt) {
      return NextResponse.json(
        {
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
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    // Check maximum attempts
    if (completedAttemptsCount >= quiz.maxAttempts) {
      return NextResponse.json(
        {
          error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
        },
        { status: 403 }
      );
    }

    // Create new attempt
    const perQSeconds = quiz.timeLimitPerQuestion || 10;
    const totalAllocatedSeconds =
      questions.reduce((sum, q) => {
        const qTime = q.timeLimitSeconds || perQSeconds;
        return sum + qTime;
      }, 0) + 120; // 2 minutes grace buffer for network latency

    const startTime = new Date();
    const serverDeadline = new Date(startTime.getTime() + totalAllocatedSeconds * 1000);
    const attemptNumber = completedAttemptsCount + 1;

    const [newAttempt] = await Promise.all([
      QuizAttempt.create({
        quizId,
        studentId: session.studentId,
        attemptNumber,
        startTime,
        serverDeadline,
        isCompleted: false,
        savedAnswers: [],
        score: 0,
        completionTimeSeconds: 0,
      }),
      !quiz.isLocked
        ? Quiz.updateOne({ _id: quiz._id, isLocked: false }, { $set: { isLocked: true } })
        : Promise.resolve(),
    ]);

    return NextResponse.json(
      {
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
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Error starting attempt:", error);
    return NextResponse.json({ error: "Failed to start quiz attempt" }, { status: 500 });
  }
}
