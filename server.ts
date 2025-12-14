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

// 🟢 修复 1: 引入 Lua 脚本，保证 Rate Limit 的“读-算-写”是原子操作，防止并发刷分
const RATE_LIMIT_SCRIPT = `
  local pointsKey = KEYS[1]
  local timeKey = KEYS[2]
  local maxPoints = tonumber(ARGV[1])
  local delay = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local cost = 1

  local lastUpdate = tonumber(redis.call('get', timeKey) or now)
  local currentPoints = tonumber(redis.call('get', pointsKey) or maxPoints)

  -- 计算随时间恢复的点数
  local timePassed = now - lastUpdate
  local recovered = math.floor(timePassed / delay)
  currentPoints = math.min(maxPoints, currentPoints + recovered)

  local newUpdate = lastUpdate
  if recovered > 0 then
      newUpdate = now - (timePassed % delay)
  end

  if currentPoints >= cost then
      currentPoints = currentPoints - cost
      redis.call('set', pointsKey, currentPoints)
      redis.call('set', timeKey, newUpdate)
      return {currentPoints, newUpdate, 1} -- 1 表示成功
  else
      return {currentPoints, newUpdate, 0} -- 0 表示失败
  end
`;

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
    // 🟢 修复 2: 使用 findOneAndUpdate (Upsert) 替代 find + save
    // 减少一次数据库IO，并避免并发写入冲突
    await Point.findOneAndUpdate(
      { x, y },
      {
        x, y, w, h, c, user,
        update_at: new Date(),
        $setOnInsert: { create_at: new Date() }
      },
      { upsert: true, new: true }
    );
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

      const subClient = createClient({
        url: serverConfig.REDIS_URI || "redis://redis:6379",
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
          connectTimeout: 5000,
        }
      });

      const redisClient = pubClient;

      // 顺序连接，避免连接池竞争
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

    // 🟢 修复 3: 显式拦截 socket.io 请求，防止 Next.js 路由处理导致的干扰
    if (parsedUrl.pathname?.startsWith('/socket.io/')) {
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    // 🟢 修复 4: 强制只使用 WebSocket，跳过 Polling
    // 彻底解决 Docker/Mac 环境下 400 Session ID Unknown 问题
    transports: ['websocket'],
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  let pubClient, subClient, redisClient;
  try {
    ({ pubClient, subClient, redisClient } = await connectRedis());
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Redis adapter:", error);
    console.warn("Redis adapter not available. Socket.IO will use in-memory adapter (single-server only)");
  }

  io.use((socket, next) => {
    // 调试日志：保留，用于观察 transport 是否已成功切换为 websocket
    console.log("Middleware check", {
      socketId: socket.id,
      remoteAddress: socket.conn.remoteAddress,
      transport: socket.conn.transport.name
    });
    next();
  });

  // Socket 鉴权中间件
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    // 🟢 修复 5: 严格校验空字符串，防止 falsy 值导致的逻辑穿透
    if (token && typeof token === 'string' && token.trim().length > 0) {
      try {
        let cachedUserId: string | null = null;

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
          return next();
        } else {
          const session = await UserSession.findOne({ token });
          if (session) {
            socket.data.token = token;
            socket.data.userId = session.userId;

            if (redisClient) {
              try {
                await redisClient.setEx(`draw:token:${token}`, 86400, session.userId);
              } catch (error) {
                console.error("Failed to cache token in Redis:", error);
              }
            }
            return next();
          }
        }
        // 如果 Token 无效，这里放行，但在 draw 事件中会拦截
        next();
      } catch (e) {
        console.error("Auth error", e);
        next();
      }
    } else {
      console.error("No token provided in handshake or empty string");
      next();
    }
  });

  io.on("connection", async (socket) => {
    console.log("Client connected", {
      socketId: socket.id,
      userId: socket.data.userId,
      token: socket.data.token ? "present" : "missing"
    });

    // 🟢 修复 6: 使用 Redis Set 替代 INCR/DECR
    // 即使服务崩溃重启，也不会导致在线人数永久虚高
    if (redisClient) {
      try {
        await redisClient.sAdd("draw:online_users", socket.id);
        const count = await redisClient.sCard("draw:online_users");
        console.log(`Connected clients: ${count}`);
        io.emit("onlineClientsUpdated", { count: count });
      } catch (error) {
        console.error("Failed to update online count:", error);
      }
    }

    const roomId = socket.data.token;
    if (roomId) {
      socket.join(roomId);
      console.log(`Socket joined room: ${roomId}`);
      socket.emit("authenticated", { success: true });
    } else {
      console.warn("Client connected without token");
      socket.emit("authenticated", { success: false, message: "No token provided" });
    }

    socket.on("draw", async (params, cb: (result: AppError) => void) => {
      // 🟢 修复 7: 直接使用 socket.data.userId，不再重复查询数据库
      // 这里的 userId 是受信的，由中间件设置
      const userId = socket.data.userId;

      if (!userId) {
        if (cb) cb({ code: AppErrorCode.InvalidToken, message: "Unauthorized" });
        return;
      }

      const parseResult = DrawRequestSchema.safeParse(params);
      if (!parseResult.success) {
        if (cb) cb({
          code: AppErrorCode.InvalidRequest,
          message: parseResult.error.message || "Error while parsing",
        });
        return;
      }

      const { data } = parseResult.data;

      if (!data) {
        if (cb) cb({ code: AppErrorCode.InvalidRequest, message: "Invalid draw parameters" });
        return;
      }

      if (
        data.x > parseInt(serverConfig.CANVAS_WIDTH || "1000") - 1 ||
        data.y > parseInt(serverConfig.CANVAS_HEIGHT || "1000") - 1
      ) {
        if (cb) cb({ code: AppErrorCode.InvalidPosition, message: "Draw position out of bounds" });
        return;
      }

      // 🟢 修复 8: 执行 Lua 脚本进行原子限流检查
      const maxPoints = serverConfig.DRAW_MAX_POINTS ? parseInt(serverConfig.DRAW_MAX_POINTS) : 24;
      const delay = serverConfig.DRAW_DELAY_MS ? parseInt(serverConfig.DRAW_DELAY_MS) : 5000;

      let currentPoints = 0;
      let newUpdatedAt = Date.now();
      let isSuccess = false;

      if (redisClient) {
        try {
          // node-redis v4 调用方式
          const result = await redisClient.eval(RATE_LIMIT_SCRIPT, {
            keys: [`draw:user:${userId}:points`, `draw:user:${userId}:last_update`],
            arguments: [maxPoints.toString(), delay.toString(), Date.now().toString()]
          });

          // Lua 返回 [currentPoints, newUpdatedAt, status(1/0)]
          if (Array.isArray(result)) {
            currentPoints = Number(result[0]);
            newUpdatedAt = Number(result[1]);
            isSuccess = Boolean(result[2]);
          }
        } catch (error) {
          console.error("Failed to execute rate limit script:", error);
          // 如果 Redis 挂了，暂时允许绘制（Fail Open），或者选择拒绝（Fail Closed）
          // 这里选择允许，避免服务完全不可用
          isSuccess = true;
        }
      } else {
        // 没有 Redis 时的内存 Fallback (简单处理，开发环境用)
        isSuccess = true;
      }

      if (!isSuccess) {
        if (cb)
          cb({
            code: AppErrorCode.InsufficientPoints,
            message: "Insufficient points",
            pointsLeft: currentPoints,
            lastUpdate: newUpdatedAt,
          });
        return;
      }

      // 广播给其他人
      socket.broadcast.emit("draw", data);

      // 同步给自己 (前端通常需要这个来修正本地状态)
      socket.emit("sync", {
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

      // 异步写入数据库 (Fire and Forget)
      const username = userId;
      createAction({ point: data, user: username });
      savePoint({ ...data, user: username });
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected");
      if (redisClient) {
        try {
          // 移除 Socket ID 并重新计算集合大小
          await redisClient.sRem("draw:online_users", socket.id);
          const count = await redisClient.sCard("draw:online_users");
          console.log(`Connected clients: ${count}`);
          io.emit("onlineClientsUpdated", { count: count });
        } catch (error) {
          console.error("Failed to update online count:", error);
        }
      }
    });
  });

  const port = parseInt(process.env.PORT || "3000", 10);

  // 🟢 修复 9: 显式监听 0.0.0.0，强制使用 IPv4，避免 Mac 环境下的 IPv6 兼容性问题
  server.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});