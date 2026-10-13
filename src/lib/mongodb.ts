import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServerUri?: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var mongooseListenersAttached: boolean | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function attachConnectionListeners() {
  if (global.mongooseListenersAttached) return;
  global.mongooseListenersAttached = true;

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB connection disconnected. Resetting connection cache.");
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on("close", () => {
    console.warn("⚠️ MongoDB connection closed. Resetting connection cache.");
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on("error", (err) => {
    console.error("⚠️ MongoDB connection error:", err?.message || err);
    if (mongoose.connection.readyState !== 1) {
      cached.conn = null;
      cached.promise = null;
    }
  });
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  attachConnectionListeners();

  // If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in a closed/broken state (0=disconnected, 3=disconnecting), reset stale cache
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const isProduction = process.env.NODE_ENV === "production";
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0, // Serverless best practice: don't keep idle sockets open
      serverSelectionTimeoutMS: 5000, // 5s fast timeout
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
    };

    cached.promise = (async () => {
      let uri = process.env.MONGODB_URI;

      if (isProduction && !uri) {
        throw new Error(
          "Missing MONGODB_URI environment variable! Please configure MONGODB_URI in your Vercel Project Settings."
        );
      }

      // Fallback for local memory testing in development if URI is localhost or missing
      if (!isProduction && (!uri || uri.includes("127.0.0.1") || uri.includes("localhost"))) {
        try {
          const testConn = await mongoose.connect(uri || "mongodb://127.0.0.1:27017/maerika_quiz_2026", {
            ...opts,
            serverSelectionTimeoutMS: 2000,
          });
          console.log("Connected to local MongoDB instance successfully.");
          return testConn;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn("⚠️ Local MongoDB instance not reachable (" + errMsg + "). Falling back to in-memory MongoDB.");

          if (!cached.memoryServerUri) {
            try {
              const { MongoMemoryServer } = await import("mongodb-memory-server");
              const mongod = await MongoMemoryServer.create({
                instance: { dbName: "maerika_quiz_2026" },
              });
              cached.memoryServerUri = mongod.getUri();
              console.log("🚀 In-Memory MongoDB started at:", cached.memoryServerUri);
            } catch (memErr) {
              console.error("Failed to initialize MongoMemoryServer fallback:", memErr);
              throw err;
            }
          }
          uri = cached.memoryServerUri;
        }
      }

      // If connection state was stuck in half-open state, clean disconnect first
      if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 1) {
        try {
          await mongoose.disconnect();
        } catch {
          // ignore disconnect error
        }
      }

      const conn = await mongoose.connect(uri!, opts);
      console.log("MongoDB connection established successfully.");
      return conn;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Crucial: always clear cached.promise and cached.conn on failure so subsequent requests retry freshly
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}
