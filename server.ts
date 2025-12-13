import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  // Rate limiting map
  const lastPointUpdates = new Map<string, number>();
  const lastPoints = new Map<string, number>();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const session = await UserSession.findOne({ token });
        if (session) {
          socket.data.token = token;
        }
      } catch (e) {
        console.error("Auth error", e);
      }
    } else {
      console.error("No token provided in handshake");
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

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
          const session = await UserSession.findOne({ token });
          if (session) {
            user = { id: session.userId, token: token };
          } else {
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

      // Rate limit check: updated for pack system
      const maxPoints = serverConfig.DRAW_MAX_POINTS
        ? parseInt(serverConfig.DRAW_MAX_POINTS)
        : 24;
      const now = Date.now();
      const lastPointUpdate = lastPointUpdates.has(user.id)
        ? lastPointUpdates.get(user.id)
        : now; // if not found, then it is new user
      const lastPoint = lastPoints.has(user.id)
        ? lastPoints.get(user.id)
        : maxPoints; // default to max points
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
        lastPoints.set(user.id, currentPoints);
        lastPointUpdates.set(user.id, newUpdatedAt);
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

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
