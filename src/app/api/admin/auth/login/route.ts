import { NextRequest, NextResponse } from "next/server";
import {
  AdminLoginSchema,
} from "@/lib/validation";
import {
  verifyAdminPassword,
  signAdminToken,
  ADMIN_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = checkRateLimit(`admin-login-${ip}`, 8, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.waitSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = AdminLoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = parse.data;
    const configuredUsername = process.env.ADMIN_USERNAME || "admin";

    if (username.trim() !== configuredUsername.trim()) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyAdminPassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signAdminToken(username);

    // Record audit log
    try {
      await connectToDatabase();
      await AuditLog.create({
        action: "admin_login_success",
        performedBy: username,
        ipAddress: ip,
        timestamp: new Date(),
      });
    } catch (e) {
      console.warn("Could not save audit log:", e);
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      admin: { username },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
