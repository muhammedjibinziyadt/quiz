import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServerUri?: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
    };

    cached.promise = (async () => {
      let uri = process.env.MONGODB_URI;

      // If no URI provided or points to local and we need memory fallback
      if (!uri || uri.includes("127.0.0.1") || uri.includes("localhost")) {
        try {
          // Attempt connecting to the configured URI first
          const testConn = await mongoose.connect(uri || "mongodb://127.0.0.1:27017/maerika_quiz_2026", {
            ...opts,
            serverSelectionTimeoutMS: 2000,
          });
          console.log("Connected to local/custom MongoDB instance successfully.");
          return testConn;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn("⚠️ Local MongoDB instance not reachable (" + errMsg + "). Falling back to in-memory MongoDB for local execution.");
          
          if (!cached.memoryServerUri) {
            try {
              const { MongoMemoryServer } = await import("mongodb-memory-server");
              const mongod = await MongoMemoryServer.create({
                instance: {
                  dbName: "maerika_quiz_2026",
                },
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

      const conn = await mongoose.connect(uri!, opts);
      console.log("MongoDB connection established.");
      return conn;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
