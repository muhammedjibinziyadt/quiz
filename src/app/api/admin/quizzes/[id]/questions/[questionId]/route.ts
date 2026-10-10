import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { Quiz } from "@/models/Quiz";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await context.params;
    const body = await req.json();

    await connectToDatabase();

    const question = await Question.findOneAndUpdate(
      { _id: questionId, quizId: id },
      { $set: body },
      { new: true }
    );

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Bump quiz version
    await Quiz.findByIdAndUpdate(id, { $inc: { version: 1 } });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await context.params;
    await connectToDatabase();

    const deleted = await Question.findOneAndDelete({
      _id: questionId,
      quizId: id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Bump quiz version
    await Quiz.findByIdAndUpdate(id, { $inc: { version: 1 } });

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
