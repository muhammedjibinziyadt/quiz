import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { AuditLog } from "@/models/AuditLog";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectToDatabase();

    const quiz = await Quiz.findById(id).lean();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = await Question.find({ quizId: id }).sort({ order: 1 }).lean();

    return NextResponse.json({ quiz, questions });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    await connectToDatabase();

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // If quiz is locked and has active/completed attempts, guard core parameters
    if (quiz.isLocked) {
      const activeAttempts = await QuizAttempt.countDocuments({ quizId: id });
      if (activeAttempts > 0 && body.marksPerQuestion && body.marksPerQuestion !== quiz.marksPerQuestion) {
        return NextResponse.json(
          { error: "Cannot change scoring marks while student attempts exist for this quiz." },
          { status: 400 }
        );
      }
    }

    // Apply updates
    Object.assign(quiz, body);
    quiz.version = (quiz.version || 1) + 1;
    await quiz.save();

    await AuditLog.create({
      action: "quiz_updated",
      performedBy: session.username,
      details: { quizId: id, updates: body },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectToDatabase();

    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await Question.deleteMany({ quizId: id });
    await QuizAttempt.deleteMany({ quizId: id });

    await AuditLog.create({
      action: "quiz_deleted",
      performedBy: session.username,
      details: { quizId: id, title: quiz.title },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: "Quiz and related data removed" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
