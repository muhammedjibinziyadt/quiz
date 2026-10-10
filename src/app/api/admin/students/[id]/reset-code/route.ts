import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, generateStudentAccessCode, hashAccessCode } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
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

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const newCode = generateStudentAccessCode();
    const newHash = hashAccessCode(newCode);

    student.accessCodeHash = newHash;
    student.accessCodePrefix = newCode.slice(0, 7);
    await student.save();

    await AuditLog.create({
      action: "student_code_reset",
      performedBy: session.username,
      details: { studentId: id, name: student.name },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Access code successfully regenerated",
      rawAccessCode: newCode,
      accessCodePrefix: student.accessCodePrefix,
    });
  } catch (error) {
    console.error("Error resetting code:", error);
    return NextResponse.json({ error: "Failed to regenerate access code" }, { status: 500 });
  }
}
