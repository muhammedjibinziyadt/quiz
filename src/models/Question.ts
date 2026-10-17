import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface IQuestion extends Document {
  quizId: mongoose.Types.ObjectId;
  order: number;
  questionType?: "mcq" | "short_answer";
  minWords?: number;
  questionText: string;
  questionImage?: string;
  options: IOption[];
  correctOptionId?: string;
  correctAnswerText?: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  timeLimitSeconds?: number | null; // null means inherit quiz's timeLimitPerQuestion
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
  },
  { _id: false }
);

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "short_answer"],
      default: "mcq",
    },
    minWords: {
      type: Number,
      default: 20,
    },
    questionText: {
      type: String,
      trim: true,
      default: "",
    },
    questionImage: {
      type: String,
      default: null,
    },
    options: {
      type: [OptionSchema],
      default: [],
    },
    correctOptionId: {
      type: String,
      default: "",
    },
    correctAnswerText: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    marks: {
      type: Number,
      default: null, // null means inherit quiz's marksPerQuestion
    },
    negativeMarks: {
      type: Number,
      default: null, // null means inherit quiz's negativeMarks
    },
    timeLimitSeconds: {
      type: Number,
      default: null, // null means inherit quiz's timeLimitPerQuestion (e.g. 10s)
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ quizId: 1, order: 1 });

if (mongoose.models.Question) {
  delete (mongoose.models as Record<string, unknown>).Question;
}

export const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);
