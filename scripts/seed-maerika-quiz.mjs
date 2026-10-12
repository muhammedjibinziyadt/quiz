#!/usr/bin/env node
import mongoose from "mongoose";
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

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/maerika_quiz_2026";
  const dbName = process.env.MONGODB_DB || "Maerika";
  console.log("Connecting to live MongoDB for seeding:", uri.substring(0, 30) + "...");

  let conn;
  try {
    conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      dbName,
    });
    console.log("Connected to MongoDB database:", dbName);
  } catch (err) {
    console.warn("Could not connect to specified MongoDB directly (" + err.message + "). Booting mongodb-memory-server...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create({ instance: { dbName } });
    conn = await mongoose.connect(mongod.getUri(), { dbName });
    console.log("Connected to MongoMemoryServer at:", mongod.getUri());
  }

  const db = conn.connection.db;

  // 1. STORE ALL IMAGES DIRECTLY IN MONGODB DATABASE
  console.log("🖼️ Storing all festival images in MongoDB collection 'imagefiles'...");
  const imageFilesCollection = db.collection("imagefiles");

  const imagesToSeed = [
    {
      filename: "maerika-arts-fest-logo.png",
      path: path.join(process.cwd(), "public", "images", "maerika-arts-fest-logo.png"),
      contentType: "image/png",
    },
    {
      filename: "nattarivu-quiz-logo.png",
      path: path.join(process.cwd(), "public", "images", "nattarivu-quiz-logo.png"),
      contentType: "image/png",
    },
    {
      filename: "nattarivu-quiz-logo-green.png",
      path: path.join(process.cwd(), "public", "images", "nattarivu-quiz-logo-green.png"),
      contentType: "image/png",
    },
    {
      filename: "nattarivu-quiz-logo-white.png",
      path: path.join(process.cwd(), "public", "images", "nattarivu-quiz-logo-white.png"),
      contentType: "image/png",
    },
  ];

  const imageIdMap = {};

  for (const img of imagesToSeed) {
    if (fs.existsSync(img.path)) {
      const fileBuffer = fs.readFileSync(img.path);
      const existing = await imageFilesCollection.findOne({ filename: img.filename });
      if (existing) {
        await imageFilesCollection.updateOne(
          { _id: existing._id },
          {
            $set: {
              data: fileBuffer,
              size: fileBuffer.length,
              contentType: img.contentType,
              updatedAt: new Date(),
            },
          }
        );
        imageIdMap[img.filename] = String(existing._id);
        console.log(`  ✓ Updated image in MongoDB: ${img.filename} (${fileBuffer.length} bytes) -> /api/images/${existing._id}`);
      } else {
        const insertRes = await imageFilesCollection.insertOne({
          filename: img.filename,
          contentType: img.contentType,
          size: fileBuffer.length,
          data: fileBuffer,
          uploadedBy: "system_seed",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        imageIdMap[img.filename] = String(insertRes.insertedId);
        console.log(`  ✓ Inserted image in MongoDB: ${img.filename} (${fileBuffer.length} bytes) -> /api/images/${insertRes.insertedId}`);
      }
    } else {
      console.warn(`  ⚠️ Image file not found locally: ${img.path}`);
    }
  }

  // Clear existing collections for a clean live state
  await db.collection("quizzes").deleteMany({});
  await db.collection("questions").deleteMany({});

  console.log("🌱 Creating Official Live Competitions in MongoDB...");

  // 1. Text-based Malayalam Cultural Quiz: "നാട്ടറിവ് QUIZ 2026"
  const nattarivuCover = imageIdMap["nattarivu-quiz-logo.png"]
    ? `/api/images/${imageIdMap["nattarivu-quiz-logo.png"]}`
    : "/api/images/nattarivu-quiz-logo.png";

  const nattarivuQuizResult = await db.collection("quizzes").insertOne({
    title: "നാട്ടറിവ് QUIZ 2026 (Kerala Heritage & Folklore)",
    description: "MAERIKA 2K26 Arts Fest presents 'നാട്ടറിവ് QUIZ 2026'. Explore the timeless folklore, traditional arts, native flora, and heritage of God's Own Country.",
    instructions: "1. Total 5 questions.\n2. Time limit is 5 minutes (300 seconds).\n3. Each question carries 1 mark.\n4. Negative marking of 0.25 marks for wrong answers.\n5. Answer before the countdown timer expires.",
    coverImage: nattarivuCover,
    quizType: "text",
    durationSeconds: 300,
    timeLimitPerQuestion: 60,
    marksPerQuestion: 1,
    negativeMarks: 0.25,
    negativeMarkingEnabled: true,
    maxAttempts: 1,
    status: "published",
    unansweredZero: true,
    allowReviewAnswers: true,
    version: 1,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const nattarivuQuizId = nattarivuQuizResult.insertedId;

  // Insert Malayalam questions
  const nattarivuQuestions = [
    {
      quizId: nattarivuQuizId,
      order: 1,
      questionText: "കേരളത്തിന്റെ ഔദ്യോഗിക വൃക്ഷം ഏതാണ്? (Which is the official state tree of Kerala?)",
      options: [
        { id: "opt_1", text: "പ്ലാവ് (Jackfruit Tree)" },
        { id: "opt_2", text: "തെങ്ങ് (Coconut Palm)" },
        { id: "opt_3", text: "കണിക്കൊന്ന (Golden Shower)" },
        { id: "opt_4", text: "ആൽമരം (Banyan Tree)" },
      ],
      correctOptionId: "opt_2",
      explanation: "കേരളത്തിന്റെ ഔദ്യോഗിക വൃക്ഷം തെങ്ങ് (Cocos nucifera) ആണ്.",
      marks: 1,
      negativeMarks: 0.25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: nattarivuQuizId,
      order: 2,
      questionText: "വള്ളംകളിയിൽ സാധാരണയായി പാടുന്ന നാടൻ പാട്ടുകൾ ഏത് പേരിലാണ് അറിയപ്പെടുന്നത്?",
      options: [
        { id: "opt_1", text: "തോറ്റം പാട്ടുകൾ" },
        { id: "opt_2", text: "വഞ്ചിപ്പാട്ട്" },
        { id: "opt_3", text: "വടക്കൻ പാട്ടുകൾ" },
        { id: "opt_4", text: "പുല്ലുവൻ പാട്ട്" },
      ],
      correctOptionId: "opt_2",
      explanation: "ആറന്മുള, നെഹ്‌റു ട്രോഫി തുടങ്ങിയ വള്ളംകളികളിൽ വഞ്ചിപ്പാട്ടുകളാണ് പാടുന്നത്.",
      marks: 1,
      negativeMarks: 0.25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: nattarivuQuizId,
      order: 3,
      questionText: "പൂതവും തിറയും ഏത് ജില്ലയിലെ പരമ്പരാഗത അനുഷ്ഠാന കലാരൂപമാണ്?",
      options: [
        { id: "opt_1", text: "പാലക്കാട് / മലപ്പുറം" },
        { id: "opt_2", text: "തിരുവനന്തപുരം" },
        { id: "opt_3", text: "ആലപ്പുഴ" },
        { id: "opt_4", text: "ഇടുക്കി" },
      ],
      correctOptionId: "opt_1",
      explanation: "വള്ളുവനാടൻ പ്രദേശങ്ങളായ പാലക്കാട്, മലപ്പുറം ജില്ലകളിലാണ് പൂതനും തിറയും ഉത്സവങ്ങളോടനുബന്ധിച്ച് അവതരിപ്പിക്കപ്പെടുന്നത്.",
      marks: 1,
      negativeMarks: 0.25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: nattarivuQuizId,
      order: 4,
      questionText: "കഥകളിയുടെ വേഷങ്ങളിൽ ധീരരും സദാചാരികളുമായ നായകന്മാർക്ക് നൽകുന്ന വേഷം ഏതാണ്?",
      options: [
        { id: "opt_1", text: "കത്തി വേഷം" },
        { id: "opt_2", text: "പച്ച വേഷം" },
        { id: "opt_3", text: "താടി വേഷം" },
        { id: "opt_4", text: "കരി വേഷം" },
      ],
      correctOptionId: "opt_2",
      explanation: "സാത്വികരും ധീരരുമായ ഉത്തമ കഥാപാത്രങ്ങൾക്ക് (ഉദാ: രാമൻ, അർജ്ജുനൻ) പച്ച വേഷമാണ് നൽകുന്നത്.",
      marks: 1,
      negativeMarks: 0.25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: nattarivuQuizId,
      order: 5,
      questionText: "വിഷുക്കണിയിൽ വയ്ക്കുന്ന കേരളത്തിന്റെ ഔദ്യോഗിക പുഷ്പം ഏതാണ്?",
      options: [
        { id: "opt_1", text: "താമര" },
        { id: "opt_2", text: "ചെമ്പരത്തി" },
        { id: "opt_3", text: "കണിക്കൊന്ന" },
        { id: "opt_4", text: "മുല്ല" },
      ],
      correctOptionId: "opt_3",
      explanation: "കേരളത്തിന്റെ സംസ്ഥാന പുഷ്പമായ കണിക്കൊന്ന (Cassia fistula) ആണ് വിഷുക്കണിയിലെ പ്രധാന ഘടകം.",
      marks: 1,
      negativeMarks: 0.25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection("questions").insertMany(nattarivuQuestions);
  console.log("✅ Created 'നാട്ടറിവ് QUIZ 2026' with 5 questions in MongoDB.");

  // 2. Image-based Arts Fest Quiz: "MAERIKA 2K26 Visual Arts & Symbols Challenge"
  const maerikaCover = imageIdMap["maerika-arts-fest-logo.png"]
    ? `/api/images/${imageIdMap["maerika-arts-fest-logo.png"]}`
    : "/api/images/maerika-arts-fest-logo.png";

  const visualQuizResult = await db.collection("quizzes").insertOne({
    title: "MAERIKA 2K26 Visual Arts & Symbols Challenge",
    description: "Identify Kerala classical dance forms, traditional instruments, and visual festival emblems.",
    instructions: "1. Carefully examine each question image.\n2. Choose the correct matching option.\n3. Each question carries 1 mark.\n4. No negative marking for this round.",
    coverImage: maerikaCover,
    quizType: "image",
    durationSeconds: 240,
    timeLimitPerQuestion: 60,
    marksPerQuestion: 1,
    negativeMarks: 0,
    negativeMarkingEnabled: false,
    maxAttempts: 1,
    status: "published",
    unansweredZero: true,
    allowReviewAnswers: true,
    version: 1,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const visualQuizId = visualQuizResult.insertedId;

  const festLogoImg = imageIdMap["maerika-arts-fest-logo.png"]
    ? `/api/images/${imageIdMap["maerika-arts-fest-logo.png"]}`
    : "/api/images/maerika-arts-fest-logo.png";

  const nattarivuLogoImg = imageIdMap["nattarivu-quiz-logo.png"]
    ? `/api/images/${imageIdMap["nattarivu-quiz-logo.png"]}`
    : "/api/images/nattarivu-quiz-logo.png";

  const visualQuestions = [
    {
      quizId: visualQuizId,
      order: 1,
      questionText: "Identify the emblem: Which official arts fest banner is represented in the image?",
      questionImage: festLogoImg,
      options: [
        { id: "opt_1", text: "MAERIKA 2K26 Arts Fest" },
        { id: "opt_2", text: "State Youth Festival 2025" },
        { id: "opt_3", text: "Kerala Kalamandalam Golden Jubilee" },
        { id: "opt_4", text: "Sahitya Akademi Fest" },
      ],
      correctOptionId: "opt_1",
      explanation: "This is the official emblem of MAERIKA 2K26 Arts Fest featuring the arched portal, eternal flame, and victory sword.",
      marks: 1,
      negativeMarks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: visualQuizId,
      order: 2,
      questionText: "Identify the regional folklore quiz identity presented below:",
      questionImage: nattarivuLogoImg,
      options: [
        { id: "opt_1", text: "വിജ്ഞാനോത്സവം 2026" },
        { id: "opt_2", text: "നാട്ടറിവ് QUIZ 2026" },
        { id: "opt_3", text: "കേരളോത്സവം ക്വിസ്" },
        { id: "opt_4", text: "സാഹിത്യോത്സവ്" },
      ],
      correctOptionId: "opt_2",
      explanation: "This is the signature logo of നാട്ടറിവ് QUIZ 2026.",
      marks: 1,
      negativeMarks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      quizId: visualQuizId,
      order: 3,
      questionText: "Which traditional art identity is shown in this emerald edition insignia?",
      questionImage: imageIdMap["nattarivu-quiz-logo-green.png"]
        ? `/api/images/${imageIdMap["nattarivu-quiz-logo-green.png"]}`
        : "/api/images/nattarivu-quiz-logo-green.png",
      options: [
        { id: "opt_1", text: "നാട്ടറിവ് ഗ്രീൻ എഡിഷൻ (Folklore & Ecology Round)" },
        { id: "opt_2", text: "കഥകളി പ്രദർശനം" },
        { id: "opt_3", text: "കളരിപ്പയറ്റ് ചലഞ്ച്" },
        { id: "opt_4", text: "മേളോത്സവം" },
      ],
      correctOptionId: "opt_1",
      explanation: "This is the Folklore & Ecology insignia for the special visual round.",
      marks: 1,
      negativeMarks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection("questions").insertMany(visualQuestions);
  console.log("✅ Created 'MAERIKA 2K26 Visual Arts & Symbols Challenge' with image questions in MongoDB.");

  console.log("\n=======================================================");
  console.log("🎉 ALL LIVE DATA & IMAGES SUCCESSFULLY SAVED IN MONGODB");
  console.log("=======================================================");
  console.log(`- Database Name: ${dbName}`);
  console.log(`- Images collection 'imagefiles': ${Object.keys(imageIdMap).length} images persisted`);
  console.log(`- Quizzes: 2 published competitions`);
  console.log(`- Questions: 8 questions with Malayalam options & images`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
