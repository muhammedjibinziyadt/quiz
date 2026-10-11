import { MongoClient } from "mongodb";
import fs from "fs";

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

async function clearDummyData() {
  console.log("Connecting to MongoDB to remove all dummy/mock data...");
  const client = new MongoClient(uri);
  await client.connect();

  const targetDatabases = ["test", process.env.MONGODB_DB || "Maerika"];

  for (const dbName of targetDatabases) {
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const colNames = collections.map((c) => c.name);

    if (colNames.includes("students")) {
      const res = await db.collection("students").deleteMany({});
      console.log(`[${dbName}] Removed ${res.deletedCount} dummy students.`);
    }

    if (colNames.includes("quizattempts")) {
      const res = await db.collection("quizattempts").deleteMany({});
      console.log(`[${dbName}] Removed ${res.deletedCount} dummy quiz attempts.`);
    }

    if (colNames.includes("auditlogs")) {
      const res = await db.collection("auditlogs").deleteMany({});
      console.log(`[${dbName}] Removed ${res.deletedCount} test/dummy audit logs.`);
    }

    if (colNames.includes("questions")) {
      const res = await db.collection("questions").deleteMany({});
      console.log(`[${dbName}] Removed ${res.deletedCount} questions.`);
    }

    if (colNames.includes("quizzes")) {
      const res = await db.collection("quizzes").deleteMany({});
      console.log(`[${dbName}] Removed ${res.deletedCount} quizzes.`);
    }
  }

  await client.close();
  console.log("✅ All dummy, placeholder, and mock data successfully removed from database.");
}

clearDummyData().catch((err) => {
  console.error("Failed to clear data:", err);
  process.exit(1);
});
