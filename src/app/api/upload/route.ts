import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ImageFile } from "@/models/ImageFile";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Only JPEG, PNG, WebP, GIF, and SVG are permitted." },
        { status: 400 }
      );
    }

    // Limit file size to 8MB
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "File exceeds 8MB limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension and unique filename
    const ext = path.extname(file.name) || ".png";
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const filename = `quiz-img-${uniqueId}${ext}`;

    // Connect to MongoDB
    await connectToDatabase();

    // 1. Save directly into MongoDB database
    const imageDoc = await ImageFile.create({
      filename,
      contentType: file.type || "image/png",
      size: buffer.length,
      data: buffer,
      uploadedBy: session.username,
    });

    // 2. Also keep local copy in public/uploads if accessible as static cache
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn("Local disk backup skipped (non-critical in serverless):", fsErr);
    }

    // Serve URL directly from MongoDB endpoint
    const mongoUrl = `/api/images/${imageDoc._id}`;

    return NextResponse.json({
      success: true,
      url: mongoUrl,
      id: String(imageDoc._id),
      filename,
      size: buffer.length,
      contentType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image to database" }, { status: 500 });
  }
}
