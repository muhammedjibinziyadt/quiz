import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, generateStudentAccessCode, hashAccessCode } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { QuizAttempt } from "@/models/QuizAttempt";
import { StudentCreateSchema } from "@/lib/validation";
import { AuditLog } from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "all";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { place: { $regex: search, $options: "i" } },
        { accessCodePrefix: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach participation summary for each student
    const studentIds = students.map((s) => s._id);
    const attempts = await QuizAttempt.aggregate([
      { $match: { studentId: { $in: studentIds }, isCompleted: true } },
      {
        $group: {
          _id: "$studentId",
          totalAttempts: { $sum: 1 },
          highestScore: { $max: "$score" },
          lastAttemptAt: { $max: "$submittedAt" },
        },
      },
    ]);

    const statsMap = new Map();
    for (const att of attempts) {
      statsMap.set(String(att._id), att);
    }

    const enrichedStudents = students.map((s) => {
      const stats = statsMap.get(String(s._id));
      return {
        ...s,
        totalAttempts: stats?.totalAttempts || 0,
        highestScore: stats?.highestScore ?? null,
        lastAttemptAt: stats?.lastAttemptAt || null,
      };
    });

    return NextResponse.json({
      students: enrichedStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parse = StudentCreateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { name, phone, place, notes } = parse.data;

    // Check duplicate phone
    const existing = await Student.findOne({ phone: phone.trim() });
    if (existing) {
      return NextResponse.json(
        { error: `A student with phone number ${phone} is already registered (${existing.name})` },
        { status: 409 }
      );
    }

    // Generate unique cryptographically secure access code
    let code = "";
    let codeHash = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      code = generateStudentAccessCode();
      codeHash = hashAccessCode(code);
      const collision = await Student.findOne({ accessCodeHash: codeHash });
      if (!collision) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Could not generate unique code. Please try again." },
        { status: 500 }
      );
    }

    const student = await Student.create({
      name,
      phone,
      place,
      notes: notes || "",
      accessCodeHash: codeHash,
      accessCodePrefix: code.slice(0, 7), // prefix for admin identification
      isActive: true,
    });

    await AuditLog.create({
      action: "student_registered",
      performedBy: session.username,
      details: { studentId: student._id, name: student.name, phone: student.phone },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student registered successfully",
        student,
        rawAccessCode: code, // Displayed once to admin to distribute
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to register student" }, { status: 500 });
  }
}
