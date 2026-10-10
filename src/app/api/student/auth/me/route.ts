import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    student: {
      id: session.studentId,
      name: session.name,
      place: session.place,
    },
  });
}
