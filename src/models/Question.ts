import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface IQuestion extends Document {
  quizId: mongoose.Types.ObjectId;
  order: number;
  questionText: string;
  questionImage?: string;
  options: IOption[];
  correctOptionId: string;
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
      validate: [
        (val: IOption[]) => val.length >= 2,
        "A question must have at least 2 options",
      ],
    },
    correctOptionId: {
      type: String,
      required: [true, "Correct option ID must be specified"],
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

export const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);
