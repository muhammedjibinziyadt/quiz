import mongoose, { Schema, Document, Model } from "mongoose";

export type QuizType = "text" | "image";
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
      enum: ["text", "image"],
      default: "text",
      required: true,
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
      required: [true, "Duration is required"],
      min: [10, "Duration must be at least 10 seconds"],
      default: 600, // 10 minutes default
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

QuizSchema.index({ status: 1, startTime: 1, endTime: 1 });

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
