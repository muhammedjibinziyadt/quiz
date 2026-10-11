import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "maerika_2k26_arts_fest_super_secure_jwt_session_secret_key_987654321";

export const ADMIN_COOKIE_NAME = "maerika_admin_token";
export const STUDENT_COOKIE_NAME = "maerika_student_token";

export interface AdminSession {
  role: "admin";
  username: string;
  iat?: number;
  exp?: number;
}

export interface StudentSession {
  role: "student";
  studentId: string;
  name: string;
  phone: string;
  place: string;
  iat?: number;
  exp?: number;
}

/**
 * Generates a clean 4-digit numeric student access code (e.g. 4829, 7501).
 * 4 numbers only as required for easy student entry.
 */
export function generateStudentAccessCode(): string {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * Creates a deterministic HMAC-SHA256 hash of an access code for secure database storage.
 */
export function hashAccessCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return crypto.createHmac("sha256", SESSION_SECRET).update(normalized).digest("hex");
}

/**
 * Verify admin password against the environment ADMIN_PASSWORD_HASH
 */
export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminHash) {
    // If none set, check against default admin123 hash
    const defaultHash = "$2b$10$tSzQLgqBE6Edeukb8nyHqOb4t5VsZefmC8883KxBzg99oLmaP1UjS";
    return bcrypt.compare(inputPassword, defaultHash);
  }
  return bcrypt.compare(inputPassword, adminHash);
}

/**
 * Sign JWT for Admin (valid for 24 hours)
 */
export function signAdminToken(username: string): string {
  return jwt.sign(
    { role: "admin", username },
    SESSION_SECRET,
    { expiresIn: "24h" }
  );
}

/**
 * Sign JWT for Student (valid for 12 hours)
 */
export function signStudentToken(student: {
  _id: string | unknown;
  name: string;
  phone: string;
  place: string;
}): string {
  return jwt.sign(
    {
      role: "student",
      studentId: String(student._id),
      name: student.name,
      phone: student.phone,
      place: student.place,
    },
    SESSION_SECRET,
    { expiresIn: "12h" }
  );
}

/**
 * Verify Admin session from Request cookie or Next.js headers
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, SESSION_SECRET) as AdminSession;
    if (decoded && decoded.role === "admin") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify Student session from Request cookie or Next.js headers
 */
export async function getStudentSession(): Promise<StudentSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, SESSION_SECRET) as StudentSession;
    if (decoded && decoded.role === "student") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * In-memory login rate limiter for protection against brute-force attempts
 */
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (now - entry.firstAttempt > windowMs) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    const waitSeconds = Math.ceil((windowMs - (now - entry.firstAttempt)) / 1000);
    return { allowed: false, waitSeconds };
  }

  entry.count++;
  return { allowed: true };
}
