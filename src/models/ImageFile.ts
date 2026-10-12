import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImageFile extends Document {
  filename: string;
  contentType: string;
  size: number;
  data: Buffer;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImageFileSchema: Schema<IImageFile> = new Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      default: "image/png",
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    data: {
      type: Buffer,
      required: true,
    },
    uploadedBy: {
      type: String,
      default: "admin",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent stale Mongoose model in development hot-reloading
if (process.env.NODE_ENV !== "production") {
  if (mongoose.models.ImageFile) {
    delete (mongoose.models as Record<string, unknown>).ImageFile;
  }
  if (mongoose.connection?.models?.ImageFile) {
    delete (mongoose.connection.models as Record<string, unknown>).ImageFile;
  }
}

export const ImageFile: Model<IImageFile> =
  mongoose.models.ImageFile ||
  mongoose.model<IImageFile>("ImageFile", ImageFileSchema);
