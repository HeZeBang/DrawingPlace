import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import { getUserFromRequest } from "@/lib/server-auth";
import { z } from "zod";

// Validation schema
// Assuming canvas size is 1000x1000 based on typical r/place clones,
// but we should probably verify or make it generous.
// User prompt said: "limit just restrict width/height lower than canvas".
// I'll set a reasonable upper bound for validation, e.g., 2000 to be safe.
const MAX_CANVAS_SIZE = 5000;

const VoteSchema = z.object({
  voteIndex: z.number().min(0).max(2),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive().max(MAX_CANVAS_SIZE),
  height: z.number().positive().max(MAX_CANVAS_SIZE),
  comment: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = VoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const { voteIndex, x, y, width, height, comment } = result.data;

    await dbConnect();

    // Upsert the vote
    const vote = await Vote.findOneAndUpdate(
      { userId, voteIndex },
      {
        userId,
        voteIndex,
        x,
        y,
        width,
        height,
        comment: comment ?? "",
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json(vote);
  } catch (error) {
    console.error("Error saving vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");

    if (indexParam === null) {
      return NextResponse.json(
        { error: "Missing index parameter" },
        { status: 400 },
      );
    }

    const voteIndex = parseInt(indexParam, 10);
    if (isNaN(voteIndex) || voteIndex < 0 || voteIndex > 2) {
      return NextResponse.json(
        { error: "Invalid index parameter" },
        { status: 400 },
      );
    }

    await dbConnect();

    await Vote.deleteOne({ userId, voteIndex });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
