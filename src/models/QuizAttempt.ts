import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedAnswer {
  questionId: string;
  selectedOptionId: string;
  savedAt?: Date;
}

export interface IAnswerResult {
  questionId: string;
  questionText: string;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  attemptNumber: number;
  startTime: Date;
  serverDeadline: Date;
  submittedAt?: Date;
  isCompleted: boolean;
  savedAnswers: ISavedAnswer[];
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  completionTimeSeconds: number;
  answersDetail?: IAnswerResult[];
  createdAt: Date;
  updatedAt: Date;
}

const SavedAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AnswerResultSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, default: "" },
    selectedOptionId: { type: String, default: null },
    correctOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const QuizAttemptSchema: Schema<IQuizAttempt> = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serverDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    savedAnswers: {
      type: [SavedAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      index: true,
    },
    totalPossibleMarks: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    completionTimeSeconds: {
      type: Number,
      default: 0,
      index: true,
    },
    answersDetail: {
      type: [AnswerResultSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Crucial compound index for atomic leaderboards:
// 1) Higher score first (-1)
// 2) Lower completion time first (1)
// 3) Earlier submission time first (1)
QuizAttemptSchema.index({
  quizId: 1,
  isCompleted: 1,
  score: -1,
  completionTimeSeconds: 1,
  submittedAt: 1,
});

// Single active attempt per student check
QuizAttemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
