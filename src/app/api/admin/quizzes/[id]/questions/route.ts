import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { Quiz } from "@/models/Quiz";
import { QuestionCreateSchema } from "@/lib/validation";

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

    const questions = await Question.find({ quizId: id }).sort({ order: 1 }).lean();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

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
    const body = await req.json();

    const parse = QuestionCreateSchema.safeParse({ ...body, quizId: id });
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify quiz exists
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Determine order if not set
    let order = parse.data.order;
    if (order === 0) {
      const count = await Question.countDocuments({ quizId: id });
      order = count + 1;
    }

    const isShortAnswer = parse.data.questionType === "short_answer";
    const optionsToSave =
      isShortAnswer && (!parse.data.options || parse.data.options.length < 2)
        ? [
            { id: "opt_note_1", text: "Written Answer" },
            { id: "opt_note_2", text: "Reference Answer" },
          ]
        : parse.data.options || [];
    const correctIdToSave =
      isShortAnswer && !parse.data.correctOptionId
        ? "opt_note_1"
        : parse.data.correctOptionId || "";

    const question = await Question.create({
      quizId: id,
      order,
      questionType: parse.data.questionType || "mcq",
      minWords: parse.data.minWords ?? 20,
      questionText: parse.data.questionText || "",
      questionImage: parse.data.questionImage || null,
      options: optionsToSave,
      correctOptionId: correctIdToSave,
      correctAnswerText: parse.data.correctAnswerText || "",
      explanation: parse.data.explanation || "",
      marks: parse.data.marks ?? null,
      negativeMarks: parse.data.negativeMarks ?? null,
      timeLimitSeconds: parse.data.timeLimitSeconds ?? null,
    });

    // Bump quiz version
    quiz.version = (quiz.version || 1) + 1;
    await quiz.save();

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Bulk reorder questions: body is { orderedIds: string[] }
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
    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "Invalid orderedIds array" }, { status: 400 });
    }

    await connectToDatabase();

    const bulkOps = orderedIds.map((questionId, index) => ({
      updateOne: {
        filter: { _id: questionId, quizId: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await Question.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, message: "Questions reordered" });
  } catch (error) {
    console.error("Error reordering questions:", error);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}
