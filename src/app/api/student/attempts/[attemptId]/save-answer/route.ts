import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttempt } from "@/models/QuizAttempt";

export const dynamic = "force-dynamic";

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

    const qIdStr = String(questionId);
    const optIdStr = String(selectedOptionId);
    const now = new Date();
    // 15 seconds grace for network jitter
    const minDeadline = new Date(now.getTime() - 15000);

    // 1. Fast atomic update if answer for this question already exists in array
    const updateResult = await QuizAttempt.updateOne(
      {
        _id: attemptId,
        studentId: session.studentId,
        isCompleted: false,
        serverDeadline: { $gte: minDeadline },
        "savedAnswers.questionId": qIdStr,
      },
      {
        $set: {
          "savedAnswers.$.selectedOptionId": optIdStr,
          "savedAnswers.$.savedAt": now,
        },
      }
    );

    // 2. If question answer was not yet in savedAnswers array, push it atomically
    if (updateResult.matchedCount === 0) {
      const pushResult = await QuizAttempt.updateOne(
        {
          _id: attemptId,
          studentId: session.studentId,
          isCompleted: false,
          serverDeadline: { $gte: minDeadline },
        },
        {
          $push: {
            savedAnswers: {
              questionId: qIdStr,
              selectedOptionId: optIdStr,
              savedAt: now,
            },
          },
        }
      );

      if (pushResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "Active attempt not found or time expired" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
