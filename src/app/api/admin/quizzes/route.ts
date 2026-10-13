import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { QuizCreateSchema } from "@/lib/validation";
import { AuditLog } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const quizzes = await Quiz.find({})
      .select(
        "title description quizType startTime endTime durationSeconds timeLimitPerQuestion marksPerQuestion negativeMarkingEnabled negativeMarks status isLocked createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();
    const quizIds = quizzes.map((q) => q._id);

    // Run question counts and attempt counts in parallel
    const [questionCounts, attemptCounts] = await Promise.all([
      Question.aggregate([
        { $match: { quizId: { $in: quizIds } } },
        { $group: { _id: "$quizId", count: { $sum: 1 } } },
      ]),
      QuizAttempt.aggregate([
        { $match: { quizId: { $in: quizIds } } },
        {
          $group: {
            _id: "$quizId",
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const questionMap = new Map();
    for (const qc of questionCounts) {
      questionMap.set(String(qc._id), qc.count);
    }

    const attemptMap = new Map();
    for (const ac of attemptCounts) {
      attemptMap.set(String(ac._id), ac);
    }

    const enriched = quizzes.map((q) => {
      const qId = String(q._id);
      const attemptsInfo = attemptMap.get(qId);
      return {
        ...q,
        questionsCount: questionMap.get(qId) || 0,
        totalAttempts: attemptsInfo?.total || 0,
        completedAttempts: attemptsInfo?.completed || 0,
      };
    });

    return NextResponse.json(
      { quizzes: enriched },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching quizzes:", error);
    const msg = error instanceof Error ? error.message : "Database connection error";
    return NextResponse.json(
      { error: `Failed to fetch quizzes: ${msg}`, quizzes: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parse = QuizCreateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const quizData = {
      ...parse.data,
      quizType: parse.data.quizType === "image" ? "image" : "text",
      status: "draft",
      version: 1,
      isLocked: false,
      startTime: parse.data.startTime ? new Date(parse.data.startTime) : null,
      endTime: parse.data.endTime ? new Date(parse.data.endTime) : null,
    };

    const quiz = await Quiz.create(quizData);

    await AuditLog.create({
      action: "quiz_created",
      performedBy: session.username,
      details: { quizId: quiz._id, title: quiz.title },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
