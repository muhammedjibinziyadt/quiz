import { z } from "zod";

export const StudentCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  place: z.string().min(2, "Place or location must be at least 2 characters").max(100),
  notes: z.string().max(500).optional(),
});

export const StudentSelfRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  place: z.string().trim().min(2, "Place must be at least 2 characters").max(100),
});

export const StudentUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .min(7)
    .max(15)
    .regex(/^[0-9+\-\s()]+$/)
    .optional(),
  place: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const QuizCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  coverImage: z.string().nullable().optional(),
  quizType: z.enum(["text", "image", "mixed"]).default("text"),
  durationSeconds: z.coerce.number().min(10, "Duration must be at least 10 seconds").max(86400),
  marksPerQuestion: z.coerce.number().min(0.1, "Marks must be at least 0.1").default(1),
  negativeMarks: z.coerce.number().min(0).default(0),
  negativeMarkingEnabled: z.boolean().default(false),
  maxAttempts: z.coerce.number().min(1).default(1),
  unansweredZero: z.boolean().default(true),
  allowReviewAnswers: z.boolean().default(false),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
});

export const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text cannot be empty"),
  imageUrl: z.string().nullable().optional(),
});

export const QuestionCreateSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  order: z.number().int().min(0).default(0),
  questionText: z.string().optional().default(""),
  questionImage: z.string().nullable().optional(),
  options: z.array(OptionSchema).min(2, "At least two options are required"),
  correctOptionId: z.string().min(1, "Correct option must be selected"),
  explanation: z.string().optional(),
  marks: z.number().nullable().optional(),
  negativeMarks: z.number().nullable().optional(),
});

export const StudentLoginSchema = z.object({
  accessCode: z.string().min(4, "Access code is required"),
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
