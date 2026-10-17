import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/maerika_quiz_2026";
const targetDatabases = [process.env.MONGODB_DB || "Maerika", "test"];

async function clearAllData() {
  console.log("Connecting to MongoDB to remove all data, placeholder, and mock data...");
  const client = new MongoClient(uri);
  await client.connect();

  const collectionsToClear = [
    "students",
    "quizattempts",
    "auditlogs",
    "questions",
    "quizzes",
    "imagefiles",
  ];

  for (const dbName of targetDatabases) {
    const db = client.db(dbName);
    const existingCollections = await db.listCollections().toArray();
    const existingColNames = existingCollections
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."));

    console.log(`\n--- Cleaning Database [${dbName}] ---`);

    // Combine predefined collections with any dynamically found collections
    const allCols = Array.from(new Set([...collectionsToClear, ...existingColNames]));

    for (const colName of allCols) {
      if (existingColNames.includes(colName)) {
        const res = await db.collection(colName).deleteMany({});
        console.log(`  ✓ [${dbName}.${colName}] Deleted ${res.deletedCount} documents.`);
      }
    }
  }

  await client.close();

  // Clear uploaded placeholder/mock image files in public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedUploadsCount = 0;
    for (const file of files) {
      if (file === ".gitkeep") continue;
      const filePath = path.join(uploadsDir, file);
      try {
        fs.unlinkSync(filePath);
        deletedUploadsCount++;
      } catch (err) {
        console.warn(`Could not delete upload file ${filePath}:`, err.message);
      }
    }
    console.log(`\n  ✓ [public/uploads] Removed ${deletedUploadsCount} mock/uploaded files.`);
  }

  console.log("\n✅ All data, mock data, and placeholder data successfully removed from database and disk.");
}

clearAllData().catch((err) => {
  console.error("Failed to clear data:", err);
  process.exit(1);
});
