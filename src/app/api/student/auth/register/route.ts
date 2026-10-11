import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { signStudentToken, STUDENT_COOKIE_NAME } from "@/lib/auth";
import { StudentSelfRegisterSchema } from "@/lib/validation";
import { AuditLog } from "@/models/AuditLog";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = StudentSelfRegisterSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, phone, place } = parse.data;
    await connectToDatabase();

    // Check if a student with this normalized phone already registered
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const phoneDigits = cleanPhone.slice(-10);

    let student = await Student.findOne({
      phone: { $regex: new RegExp(`.*${phoneDigits}$`, "i") },
    });

    if (student) {
      // Existing student: refresh name/place and ensure active
      student.name = name;
      student.place = place;
      student.isActive = true;
      await student.save();
    } else {
      // Create new student record with internal unique identifier
      const internalKey = crypto.randomUUID();
      student = await Student.create({
        name,
        phone,
        place,
        accessCodeHash: internalKey,
        accessCodePrefix: "REG",
        isActive: true,
        notes: "Self-registered participant",
      });

      await AuditLog.create({
        action: "student_self_registered",
        performedBy: "self",
        details: {
          studentId: student._id,
          name: student.name,
          phone: student.phone,
          place: student.place,
        },
        timestamp: new Date(),
      });
    }

    // Sign student JWT session
    const token = signStudentToken(student);

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful! Entering quiz...",
        student: {
          id: String(student._id),
          name: student.name,
          place: student.place,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only session cookie
    response.cookies.set({
      name: STUDENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
