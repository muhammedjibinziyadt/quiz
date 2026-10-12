import mongoose, { Schema, Document, Model } from "mongoose";

export type QuizType = "text" | "image" | "mixed";
export type QuizStatus = "draft" | "published" | "archived";

export interface IQuiz extends Document {
  title: string;
  description?: string;
  instructions?: string;
  coverImage?: string;
  quizType: QuizType;
  startTime?: Date;
  endTime?: Date;
  durationSeconds: number;
  timeLimitPerQuestion: number; // Seconds per question (e.g. 10s). All questions countdown each 10s
  marksPerQuestion: number;
  negativeMarks: number;
  negativeMarkingEnabled: boolean;
  maxAttempts: number;
  status: QuizStatus;
  unansweredZero: boolean;
  allowReviewAnswers: boolean;
  version: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema: Schema<IQuiz> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "1. All questions are multiple choice.\n2. Do not refresh or close the tab during the quiz.\n3. The quiz will auto-submit once the timer expires.",
    },
    coverImage: {
      type: String,
      default: null,
    },
    quizType: {
      type: String,
      default: "text",
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    timeLimitPerQuestion: {
      type: Number,
      default: 10, // 10 seconds per question default
      min: 1,
    },
    marksPerQuestion: {
      type: Number,
      default: 1,
      min: 0.1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    negativeMarkingEnabled: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    unansweredZero: {
      type: Boolean,
      default: true,
    },
    allowReviewAnswers: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production") {
  if (mongoose.models.Quiz) {
    delete (mongoose.models as Record<string, unknown>).Quiz;
  }
  if (mongoose.connection?.models?.Quiz) {
    delete (mongoose.connection.models as Record<string, unknown>).Quiz;
  }
}

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
