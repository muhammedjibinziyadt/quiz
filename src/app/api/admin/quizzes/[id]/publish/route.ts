import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { AuditLog } from "@/models/AuditLog";

export async function POST(
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

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.status === "published") {
      // Toggle to draft
      quiz.status = "draft";
      await quiz.save();
      await AuditLog.create({
        action: "quiz_unpublished",
        performedBy: session.username,
        details: { quizId: id },
        timestamp: new Date(),
      });
      return NextResponse.json({ success: true, status: "draft", message: "Quiz unpublished" });
    } else {
      // Check if quiz has questions before publishing
      const questionCount = await Question.countDocuments({ quizId: id });
      if (questionCount === 0) {
        return NextResponse.json(
          { error: "Cannot publish a quiz with 0 questions. Please add questions first." },
          { status: 400 }
        );
      }

      quiz.status = "published";
      await quiz.save();
      await AuditLog.create({
        action: "quiz_published",
        performedBy: session.username,
        details: { quizId: id, questionsCount: questionCount },
        timestamp: new Date(),
      });
      return NextResponse.json({ success: true, status: "published", message: "Quiz published successfully" });
    }
  } catch (error) {
    console.error("Error toggling publish:", error);
    return NextResponse.json({ error: "Failed to toggle quiz publication" }, { status: 500 });
  }
}
