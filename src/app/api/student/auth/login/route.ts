import { NextRequest, NextResponse } from "next/server";
import { StudentLoginSchema } from "@/lib/validation";
import {
  hashAccessCode,
  signStudentToken,
  STUDENT_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = checkRateLimit(`student-login-${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.waitSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = StudentLoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Please enter a valid student access code" },
        { status: 400 }
      );
    }

    const code = parse.data.accessCode.trim().toUpperCase();
    const codeHash = hashAccessCode(code);

    await connectToDatabase();
    const student = await Student.findOne({ accessCodeHash: codeHash });

    if (!student) {
      return NextResponse.json(
        { error: "Invalid access code. Please verify your code and try again." },
        { status: 401 }
      );
    }

    if (!student.isActive) {
      return NextResponse.json(
        { error: "Your access has been deactivated. Please contact the Arts Fest organizers." },
        { status: 403 }
      );
    }

    const token = signStudentToken(student);

    const response = NextResponse.json({
      success: true,
      message: "Student verified successfully",
      student: {
        id: String(student._id),
        name: student.name,
        place: student.place,
      },
    });

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
    console.error("Student login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
