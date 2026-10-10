import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { QuizAttempt } from "@/models/QuizAttempt";
import { StudentUpdateSchema } from "@/lib/validation";
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

    const student = await Student.findById(id).lean();
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch student's complete quiz history
    const attempts = await QuizAttempt.find({ studentId: id })
      .populate("quizId", "title durationSeconds quizType")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      student,
      attempts,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
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
    const parse = StudentUpdateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check duplicate phone if updating phone
    if (parse.data.phone) {
      const existing = await Student.findOne({
        phone: parse.data.phone.trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Phone number is already used by another student (${existing.name})` },
          { status: 409 }
        );
      }
    }

    const updated = await Student.findByIdAndUpdate(id, { $set: parse.data }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await AuditLog.create({
      action: "student_updated",
      performedBy: session.username,
      details: { studentId: id, updates: parse.data },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
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

    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Also remove their attempts
    await QuizAttempt.deleteMany({ studentId: id });

    await AuditLog.create({
      action: "student_deleted",
      performedBy: session.username,
      details: { studentId: id, name: student.name },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: "Student and records deleted" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
