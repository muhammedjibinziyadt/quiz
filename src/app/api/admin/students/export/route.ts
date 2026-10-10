import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { QuizAttempt } from "@/models/QuizAttempt";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const students = await Student.find({}).sort({ name: 1 }).lean();
    const attempts = await QuizAttempt.find({ isCompleted: true })
      .populate("quizId", "title")
      .lean();

    const attemptsByStudent = new Map<string, typeof attempts>();
    for (const a of attempts) {
      const sId = String(a.studentId);
      if (!attemptsByStudent.has(sId)) {
        attemptsByStudent.set(sId, []);
      }
      attemptsByStudent.get(sId)!.push(a);
    }

    // Build CSV content
    const headers = [
      "Student ID",
      "Full Name",
      "Phone",
      "Place",
      "Access Code Prefix",
      "Status",
      "Registered Date",
      "Completed Quizzes Count",
      "Highest Score",
      "Total Time Spent (seconds)",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = students.map((s) => {
      const studentAttempts = attemptsByStudent.get(String(s._id)) || [];
      const highestScore = studentAttempts.length
        ? Math.max(...studentAttempts.map((a) => a.score))
        : 0;
      const totalTime = studentAttempts.reduce((acc, cur) => acc + (cur.completionTimeSeconds || 0), 0);

      return [
        escapeCsv(s._id),
        escapeCsv(s.name),
        escapeCsv(s.phone),
        escapeCsv(s.place),
        escapeCsv(s.accessCodePrefix),
        escapeCsv(s.isActive ? "Active" : "Inactive"),
        escapeCsv(new Date(s.createdAt).toISOString().split("T")[0]),
        escapeCsv(studentAttempts.length),
        escapeCsv(studentAttempts.length ? highestScore : "N/A"),
        escapeCsv(totalTime),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maerika-students-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Export error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
