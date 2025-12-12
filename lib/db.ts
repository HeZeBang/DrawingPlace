import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGO_URI_CLIENT ||
  process.env.MONGO_URI ||
  "mongodb://mongo/place";

if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGO_URI or MONGO_URI environment variable",
  );
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Connecting to MongoDB:", MONGO_URI);

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection failed:", error);
        cached.promise = null; // 重置 promise 以允许重试
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // 重置 promise 以允许重试
    throw error;
  }
}

export default dbConnect;
