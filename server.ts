import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import dbConnect from "./lib/db";
import Point from "./models/Point";
import Action from "./models/Action";
import UserSession from "./models/UserSession";
import { AppErrorCode } from "./lib/err";
import { z } from "zod";
import * as dotenv from 'dotenv';
dotenv.config();

console.log("Environment Variables:", {
  MONGO_URI: process.env.MONGO_URI,
  DRAW_DELAY_MS: process.env.DRAW_DELAY_MS,
  CANVAS_WIDTH: process.env.CANVAS_WIDTH,
  CANVAS_HEIGHT: process.env.CANVAS_HEIGHT,
});

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const DrawDataSchema = z.object({
  x: z.number().min(0).max(parseInt(process.env.CANVAS_WIDTH || "-1", 10) - 1),
  y: z.number().min(0).max(parseInt(process.env.CANVAS_HEIGHT || "-1", 10) - 1),
  w: z.number().min(1).max(1),
  h: z.number().min(1).max(1),
  c: z.string().min(7).max(7), // color code like #ffffff
});
type DrawData = z.infer<typeof DrawDataSchema>;

const DrawRequestSchema = z.object({
  token: z.string().min(1),
  data: DrawDataSchema,
});
type DrawRequest = z.infer<typeof DrawRequestSchema>;

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

function validateDrawRequest(obj: any): DrawRequest | null {
  const result = DrawRequestSchema.safeParse(obj);
  if (result.success) {
    return result.data;
  } else {
    console.error("Invalid draw request:", result.error);
    return null;
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  // Rate limiting map
  const rateLimits = new Map<string, number>();

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
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("draw", async (params, cb) => {
      const { token, data } = validateDrawRequest(params) || {};

      if (!token || !data) {
        console.error("Invalid draw parameters");
        if (cb) cb(AppErrorCode.InvalidRequest);
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
            if (cb) cb(AppErrorCode.InvalidToken);
            return;
          }
        } catch (e) {
          console.error("Token verification error", e);
          if (cb) cb(AppErrorCode.UnknownError);
          return;
        }
      } else {
        console.error("No token provided");
        if (cb) cb(AppErrorCode.InvalidRequest);
        return;
      }

      // console.log(
      //   `Draw action from user ${user.id}, token ${user.token}:`,
      //   data,
      // );

      // Rate limit check
      const lastTime = rateLimits.get(user.token) || 0;
      const now = Date.now();
      // console.log(
      //   `Last draw time for user ${user.id}: ${lastTime} (now: ${now})`,
      // );
      const delay = process.env.DRAW_DELAY_MS
        ? parseInt(process.env.DRAW_DELAY_MS)
        : 5000;
      if (now - lastTime < delay) {
        if (cb) cb(Math.ceil((delay - (now - lastTime)) / 1000)); // return remaining seconds
        return;
      }
      rateLimits.set(user.token, now);
      // console.log(`Updated last draw time for user ${user.id} to ${now}`);

      // Broadcast to others(including self)
      socket.broadcast.emit("draw", data);

      if (cb) cb(AppErrorCode.Success);

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
