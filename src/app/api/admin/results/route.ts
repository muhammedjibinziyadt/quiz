import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttempt } from "@/models/QuizAttempt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    const exportCsv = searchParams.get("export") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { isCompleted: true };
    if (quizId && quizId !== "all") {
      filter.quizId = quizId;
    }

    if (exportCsv) {
      const allAttempts = await QuizAttempt.find(filter)
        .populate("studentId", "name phone place accessCodePrefix")
        .populate("quizId", "title")
        .sort({ score: -1, completionTimeSeconds: 1, submittedAt: 1 })
        .lean();

      const headers = [
        "Rank",
        "Student Name",
        "Phone",
        "Place",
        "Access Prefix",
        "Quiz Title",
        "Score",
        "Max Marks",
        "Correct Count",
        "Incorrect Count",
        "Unanswered Count",
        "Time Taken (s)",
        "Submitted At",
      ];

      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = allAttempts.map((att, idx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = att.studentId as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = att.quizId as any;
        return [
          escapeCsv(idx + 1),
          escapeCsv(s?.name || "Unknown"),
          escapeCsv(s?.phone || ""),
          escapeCsv(s?.place || ""),
          escapeCsv(s?.accessCodePrefix || ""),
          escapeCsv(q?.title || "Quiz"),
          escapeCsv(att.score),
          escapeCsv(att.totalPossibleMarks),
          escapeCsv(att.correctCount),
          escapeCsv(att.incorrectCount),
          escapeCsv(att.unansweredCount),
          escapeCsv(att.completionTimeSeconds),
          escapeCsv(att.submittedAt ? new Date(att.submittedAt).toISOString() : ""),
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="maerika-quiz-results-${Date.now()}.csv"`,
        },
      });
    }

    // Run count and attempts listing in parallel, excluding heavy answer subdocuments
    const [total, attempts] = await Promise.all([
      QuizAttempt.countDocuments(filter),
      QuizAttempt.find(filter)
        .select("-savedAnswers -answersDetail")
        .populate("studentId", "name phone place accessCodePrefix")
        .populate("quizId", "title")
        .sort({ score: -1, completionTimeSeconds: 1, submittedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      {
        attempts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
