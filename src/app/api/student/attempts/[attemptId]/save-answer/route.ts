import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttempt } from "@/models/QuizAttempt";

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
    const body = await req.json();
    const { questionId, selectedOptionId } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: "Question ID and Selected Option ID are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      studentId: session.studentId,
      isCompleted: false,
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Active attempt not found or already completed" },
        { status: 404 }
      );
    }

    // Check deadline with small 10s grace
    const now = Date.now();
    const deadlineMs = new Date(attempt.serverDeadline).getTime() + 10000;
    if (now > deadlineMs) {
      return NextResponse.json(
        { error: "Time has expired. Answers can no longer be modified." },
        { status: 400 }
      );
    }

    // Upsert answer in savedAnswers array
    const existingIndex = attempt.savedAnswers.findIndex(
      (ans) => String(ans.questionId) === String(questionId)
    );

    if (existingIndex > -1) {
      attempt.savedAnswers[existingIndex].selectedOptionId = selectedOptionId;
      attempt.savedAnswers[existingIndex].savedAt = new Date();
    } else {
      attempt.savedAnswers.push({
        questionId: String(questionId),
        selectedOptionId: String(selectedOptionId),
        savedAt: new Date(),
      });
    }

    await attempt.save();

    return NextResponse.json({
      success: true,
      savedCount: attempt.savedAnswers.length,
    });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
