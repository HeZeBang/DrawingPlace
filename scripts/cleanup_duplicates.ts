
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Point from "../models/Point";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/place";

async function cleanup() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  console.log("Finding duplicates...");
  
  // 1. 查找所有重复的坐标组
  const duplicates = await Point.aggregate([
    {
      $group: {
        _id: { x: "$x", y: "$y" },
        count: { $sum: 1 },
        ids: { $push: "$_id" }, // 收集所有 ID
        dates: { $push: "$update_at" } // 收集更新时间用于调试（可选）
      }
    },
    {
      $match: {
        count: { $gt: 1 } // 只保留有重复的
      }
    }
  ]);

  console.log(`Found ${duplicates.length} coordinates with duplicate points.`);

  let deletedCount = 0;

  for (const group of duplicates) {
    const { x, y } = group._id;
    
    // 2. 查询该坐标的所有点，按更新时间倒序排列（最新的在前面）
    // 如果没有 update_at，可以用 _id (创建时间) 倒序
    const points = await Point.find({ x, y }).sort({ update_at: -1, _id: -1 });

    // 3. 保留第一个（最新的），删除剩下的
    const toDelete = points.slice(1);
    
    if (toDelete.length > 0) {
      const deleteIds = toDelete.map(p => p._id);
      await Point.deleteMany({ _id: { $in: deleteIds } });
      deletedCount += deleteIds.length;
      // console.log(`Cleaned up (${x}, ${y}): kept 1, deleted ${deleteIds.length}`);
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} duplicate points.`);
  
  console.log("Creating unique index...");
  try {
    // 尝试创建索引
    await Point.collection.createIndex({ x: 1, y: 1 }, { unique: true });
    console.log("Unique index created successfully.");
  } catch (e) {
    console.error("Failed to create index:", e);
  }

  await mongoose.disconnect();
}

cleanup().catch(console.error);
