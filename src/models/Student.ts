import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  name: string;
  phone: string;
  place: string;
  accessCodeHash?: string | null;
  accessCodePrefix?: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema<IStudent> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },
    place: {
      type: String,
      required: [true, "Place or location is required"],
      trim: true,
      maxlength: 120,
    },
    accessCodeHash: {
      type: String,
      required: false,
      sparse: true,
      default: null,
      index: true,
    },
    accessCodePrefix: {
      type: String,
      required: false,
      default: "REG",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast student search across fields
StudentSchema.index({ name: "text", place: "text", phone: "text" });

// Prevent Mongoose model caching stale schema in development
if (process.env.NODE_ENV !== "production") {
  if (mongoose.models.Student) {
    delete (mongoose.models as Record<string, unknown>).Student;
  }
  if (mongoose.connection?.models?.Student) {
    delete (mongoose.connection.models as Record<string, unknown>).Student;
  }
}

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
