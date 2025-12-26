import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Point from "@/models/Point";
import Action from "@/models/Action";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();

  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get("since") || "0");

  const colors = [
    "000000",
    "ffffff",
    "aaaaaa",
    "555555",
    "fed3c7",
    "ffc4ce",
    "faac8e",
    "ff8b83",
    "f44336",
    "e91e63",
    "e2669e",
    "9c27b0",
    "673ab7",
    "3f51b5",
    "004670",
    "057197",
    "2196f3",
    "00bcd4",
    "3be5db",
    "97fddc",
    "167300",
    "37a93c",
    "89e642",
    "d7ff07",
    "fff6d1",
    "f8cb8c",
    "ffeb3b",
    "ffc107",
    "ff9800",
    "ff5722",
    "b83f27",
    "795548",
  ];
  try {
    const actionCount = await Action.countDocuments();
    const delay = process.env.DRAW_DELAY_MS
      ? parseInt(process.env.DRAW_DELAY_MS) / 1000
      : 5;

    let points: { x: number; y: number; c: string }[] = [];

    if (since > 0) {
      // Incremental update
      // Note: skip() can be slow for large datasets, but it's the only way without a sequence ID
      const actions = await Action.find().sort({ _id: 1 }).skip(since).lean();

      const pointMap = new Map<string, { x: number; y: number; c: string }>();
      for (const action of actions) {
        if (action.point) {
          // Ensure we handle both raw objects and potential mongoose docs (though lean() returns objects)
          const p = action.point;
          // Key by coordinates to deduplicate, keeping the latest action
          pointMap.set(`${p.x},${p.y}`, { x: p.x, y: p.y, c: p.c });
        }
      }
      points = Array.from(pointMap.values());
    } else {
      // Full load
      const rawPoints = await Point.find({}).select("x y c").lean();
      points = rawPoints.map((p) => ({
        x: p.x,
        y: p.y,
        c: p.c,
      }));
    }

    // Calculate buffer size
    // Header:
    // ActionCount (4 bytes) + Delay (4 bytes) + PaletteSize (1 byte) + Palette (size * 3 bytes) + PointsCount (4 bytes)
    // Points: count * 7 bytes (x:2, y:2, r:1, g:1, b:1)

    const paletteSize = colors.length;
    const headerSize = 4 + 4 + 1 + paletteSize * 3 + 4;
    const pointSize = 7;
    const totalSize = headerSize + points.length * pointSize;

    const buffer = Buffer.alloc(totalSize);
    let offset = 0;

    // 1. Action Count (Uint32)
    buffer.writeUInt32LE(actionCount, offset);
    offset += 4;

    // 2. Delay (Float32)
    buffer.writeFloatLE(delay, offset);
    offset += 4;

    // 3. Palette Size (Uint8)
    buffer.writeUInt8(paletteSize, offset);
    offset += 1;

    // 4. Palette Colors
    for (const color of colors) {
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      buffer.writeUInt8(r, offset++);
      buffer.writeUInt8(g, offset++);
      buffer.writeUInt8(b, offset++);
    }

    // 5. Points Count (Uint32)
    buffer.writeUInt32LE(points.length, offset);
    offset += 4;

    // 6. Points
    for (const p of points) {
      buffer.writeUInt16LE(p.x, offset);
      offset += 2;
      buffer.writeUInt16LE(p.y, offset);
      offset += 2;

      let hex = p.c;
      if (hex.startsWith("#")) hex = hex.substring(1);

      let r = 0,
        g = 0,
        b = 0;
      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }

      buffer.writeUInt8(r, offset++);
      buffer.writeUInt8(g, offset++);
      buffer.writeUInt8(b, offset++);
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error in v2/init:", error);
    return NextResponse.json(
      {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
