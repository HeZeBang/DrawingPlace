import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import dbConnect from "./lib/db";
import Point from "./models/Point";
import Action from "./models/Action";
import UserSession from "./models/UserSession";
import { AppError, AppErrorCode } from "./lib/err";
import { DrawRequestSchema } from "./lib/schemas";
import * as dotenv from "dotenv";
dotenv.config();

const serverConfig = {
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI: process.env.MONGO_URI,
  REDIS_URI: process.env.REDIS_URI,
  DRAW_DELAY_MS: process.env.DRAW_DELAY_MS,
  DRAW_MAX_POINTS: process.env.DRAW_MAX_POINTS,
  CANVAS_WIDTH: process.env.CANVAS_WIDTH,
  CANVAS_HEIGHT: process.env.CANVAS_HEIGHT,
};

console.log("Environment Variables:", serverConfig);

const dev = serverConfig.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// 初始化数据库连接
dbConnect()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err: any) => {
    console.error("MongoDB connection error:", err);
  });

async function savePoint(params: any) {
  const { x, y, w, h, c, user } = params;
  try {
    let data = await Point.findOne({ x, y });
    if (data) {
      data.w = w;
      data.h = h;
      data.c = c;
      data.user = user;
      data.update_at = new Date();
      await data.save();
    } else {
      await Point.create({
        x,
        y,
        w,
        h,
        c,
        user: user,
        create_at: new Date(),
        update_at: new Date(),
      });
    }
  } catch (e) {
    console.error("Error saving point:", e);
  }
}

async function createAction(params: any) {
  const { point, user } = params;
  try {
    await Action.create({
      point: point,
      user: user,
      create_at: new Date(),
    });
  } catch (e) {
    console.error("Error creating action:", e);
  }
}

// Global state for statistics
// let onlineClientsCount = 0;

async function connectRedis(retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connecting to Redis at ${serverConfig.REDIS_URI || "redis://redis:6379"} for Socket.io adapter... (attempt ${i + 1}/${retries})`);
      const pubClient = createClient({
        url: serverConfig.REDIS_URI || "redis://redis:6379",
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
          connectTimeout: 5000,
        }
      });

      // Create sub client separately
      const subClient = createClient({
        url: serverConfig.REDIS_URI || "redis://redis:6379",
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
          connectTimeout: 5000,
        }
      });
      
      // Use pubClient as redisClient instead of duplicate
      const redisClient = pubClient;

      // Connect in sequence, not in parallel, to avoid connection pool issues
      await pubClient.connect();
      console.log("✓ pubClient connected");
      
      await subClient.connect();
      console.log("✓ subClient connected");
      
      console.log("✓ Connected to Redis for Socket.io adapter");
      return { pubClient, subClient, redisClient };
    } catch (error) {
      console.error(`✗ Redis connection failed (attempt ${i + 1}/${retries}):`, error instanceof Error ? error.message : error);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error("Failed to connect to Redis after multiple retries");
}

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  let pubClient, subClient, redisClient;
  try {
    ({ pubClient, subClient, redisClient } = await connectRedis());
    io.adapter(createAdapter(pubClient, subClient));
  } catch (error) {
    console.error("Failed to initialize Redis adapter:", error);
    console.warn("Redis adapter not available. Socket.IO will use in-memory adapter (single-server only)");
    // Continue without Redis adapter - will work but only on single server
  }

  // Rate limiting map
  // const lastPointUpdates = new Map<string, number>();
  // const lastPoints = new Map<string, number>();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        let cachedUserId: string | null = null;
        
        // Try Redis cache first (if available)
        if (redisClient) {
          try {
            cachedUserId = await redisClient.get(`draw:token:${token}`);
          } catch (error) {
            console.error("Redis cache lookup failed:", error);
          }
        }
        
        if (cachedUserId) {
          socket.data.token = token;
          socket.data.userId = cachedUserId;
        } else {
          // Fall back to MongoDB query
          const session = await UserSession.findOne({ token });
          if (session) {
            socket.data.token = token;
            socket.data.userId = session.userId;
            // Cache in Redis for 24 hours (if available)
            if (redisClient) {
              try {
                await redisClient.setEx(`draw:token:${token}`, 86400, session.userId);
              } catch (error) {
                console.error("Failed to cache token in Redis:", error);
              }
            }
          }
        }
      } catch (e) {
        console.error("Auth error", e);
      }
    } else {
      console.error("No token provided in handshake");
    }
    next();
  });

  io.on("connection", async (socket) => {
    console.log("Client connected");

    // Increment connected clients count (only if Redis is available)
    if (redisClient) {
      try {
        const onlineClientsCount = await redisClient.incr("draw:online_count");
        console.log(`Connected clients: ${onlineClientsCount}`);
        io.emit("onlineClientsUpdated", { count: onlineClientsCount });
      } catch (error) {
        console.error("Failed to update online count:", error);
      }
    }

    // set token to roomId
    const roomId = socket.data.token;
    if (roomId) {
      socket.join(roomId);
      console.log(`Socket joined room: ${roomId}`);
      socket.emit("authenticated", { success: true });
    }

    socket.on("draw", async (params, cb: (result: AppError) => void) => {
      const parseResult = DrawRequestSchema.safeParse(params);
      if (!parseResult.success) {
        console.error("Error while parsing: ", parseResult.error);
        if (cb)
          cb({
            code: AppErrorCode.InvalidRequest,
            message: parseResult.error.message || "Error while parsing",
          });
        return;
      }
      const { token, data } = parseResult.data;

      if (!token || !data) {
        console.error("Invalid draw parameters");
        if (cb)
          cb({
            code: AppErrorCode.InvalidRequest,
            message: "Invalid draw parameters",
          });
        return;
      }

      // Auth check - verify token from message
      let user: { id: string; token: string } | null = null;
      if (token) {
        try {
          let cachedUserId: string | null = null;
          
          // Try Redis cache first (if available)
          if (redisClient) {
            try {
              cachedUserId = await redisClient.get(`draw:token:${token}`);
            } catch (error) {
              console.error("Redis cache lookup failed:", error);
            }
          }
          
          if (cachedUserId) {
            user = { id: cachedUserId.toString(), token: token };
          } else {
            // Fall back to MongoDB query
            const session = await UserSession.findOne({ token });
            if (session) {
              user = { id: session.userId, token: token };
              // Cache in Redis for 24 hours (if available)
              if (redisClient) {
                try {
                  await redisClient.setEx(`draw:token:${token}`, 86400, session.userId);
                } catch (error) {
                  console.error("Failed to cache token in Redis:", error);
                }
              }
            }
          }
          
          if (!user) {
            if (cb)
              cb({ code: AppErrorCode.InvalidToken, message: "Invalid token" });
            return;
          }
        } catch (e) {
          console.error("Token verification error", e);
          if (cb)
            cb({ code: AppErrorCode.UnknownError, message: "Unknown error" });
          return;
        }
      } else {
        console.error("No token provided");
        if (cb)
          cb({
            code: AppErrorCode.InvalidRequest,
            message: "No token provided",
          });
        return;
      }

      if (
        data.x > parseInt(serverConfig.CANVAS_WIDTH || "1000") - 1 ||
        data.y > parseInt(serverConfig.CANVAS_HEIGHT || "1000") - 1
      ) {
        console.error("Draw position out of bounds");
        if (cb)
          cb({
            code: AppErrorCode.InvalidPosition,
            message: "Draw position out of bounds",
          });
        return;
      }

      // Rate limit check: updated for pack system
      const maxPoints = serverConfig.DRAW_MAX_POINTS
        ? parseInt(serverConfig.DRAW_MAX_POINTS)
        : 24;
      const now = Date.now();

      let lastPointUpdate = now;
      let lastPoint = maxPoints;

      // Try to get from Redis cache (if available)
      if (redisClient) {
        try {
          const lastPointUpdateStr = await redisClient.get(`draw:user:${user.id}:last_update`);
          const lastPointStr = await redisClient.get(`draw:user:${user.id}:points`);
          
          if (lastPointUpdateStr) lastPointUpdate = parseInt(lastPointUpdateStr.toString());
          if (lastPointStr) lastPoint = parseInt(lastPointStr.toString());
        } catch (error) {
          console.error("Failed to get rate limit from Redis:", error);
        }
      }

      let timePassed = now - lastPointUpdate;
      const delay = serverConfig.DRAW_DELAY_MS
        ? parseInt(serverConfig.DRAW_DELAY_MS)
        : 5000;

      const recoverPoints = Math.floor(timePassed / delay);

      let rawCurrentPoints = lastPoint + recoverPoints;
      let currentPoints = Math.min(maxPoints, rawCurrentPoints);

      let newUpdatedAt = now;
      if (currentPoints <= 0) {
        const nextAvailableIn = delay - (timePassed % delay);
        console.log(
          `User ${user.id} has no points left. Next point in ${nextAvailableIn}ms`,
        );
        if (cb)
          cb({
            code: AppErrorCode.InsufficientPoints,
            message: "Insufficient points",
            pointsLeft: 0,
            lastUpdate: lastPointUpdate,
          });
        return;
      } else {
        currentPoints -= 1;
        if (rawCurrentPoints < maxPoints) {
          newUpdatedAt = now - (timePassed % delay);
        }
        // Update Redis (if available)
        if (redisClient) {
          try {
            await redisClient.set(`draw:user:${user.id}:points`, currentPoints.toString());
            await redisClient.set(`draw:user:${user.id}:last_update`, newUpdatedAt.toString());
          } catch (error) {
            console.error("Failed to update rate limit in Redis:", error);
          }
        }
      }

      // Broadcast to others(including self)
      socket.broadcast.emit("draw", data);

      // Sync status
      io.to(roomId).emit("sync", {
        pointsLeft: currentPoints,
        lastUpdate: newUpdatedAt,
      });

      if (cb)
        cb({
          code: AppErrorCode.Success,
          message: "Draw successful",
          pointsLeft: currentPoints,
          lastUpdate: newUpdatedAt,
        });

      // Save to DB
      const username = user.id;

      createAction({
        point: data,
        user: username,
      });

      savePoint({
        ...data,
        user: username,
      });
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected");

      // Decrement connected clients count (only if Redis is available)
      if (redisClient) {
        try {
          const onlineClientsCount = await redisClient.decr("draw:online_count");
          console.log(`Connected clients: ${onlineClientsCount}`);
          io.emit("onlineClientsUpdated", { count: onlineClientsCount });
        } catch (error) {
          console.error("Failed to update online count:", error);
        }
      }
    });
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
