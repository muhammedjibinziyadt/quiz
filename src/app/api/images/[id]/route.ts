import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ImageFile } from "@/models/ImageFile";
import mongoose from "mongoose";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await connectToDatabase();

    // Check if id is a valid Mongo ObjectId or filename
    let imageDoc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      imageDoc = await ImageFile.findById(id).lean();
    }
    if (!imageDoc) {
      imageDoc = await ImageFile.findOne({ filename: id }).lean();
    }

    if (!imageDoc || !imageDoc.data) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    // Convert Buffer/BSON binary to Buffer
    let buffer: Buffer;
    const rawData = imageDoc.data as unknown;
    if (Buffer.isBuffer(rawData)) {
      buffer = rawData;
    } else if (rawData && typeof rawData === "object" && "buffer" in (rawData as Record<string, unknown>)) {
      buffer = Buffer.from((rawData as { buffer: ArrayBuffer }).buffer);
    } else {
      buffer = Buffer.from(rawData as any);
    }

    const contentType = imageDoc.contentType || "image/png";

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image from MongoDB:", error);
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
