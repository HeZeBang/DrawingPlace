import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import { z } from "zod";

// Validation schema
const MAX_CANVAS_SIZE = 5000;

const VoteSchema = z.object({
  userId: z.string().min(1),
  voteIndex: z.number().min(0).max(2),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive().max(MAX_CANVAS_SIZE),
  height: z.number().positive().max(MAX_CANVAS_SIZE),
  comment: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = VoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const { userId, voteIndex, x, y, width, height, comment } = result.data;

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const indexParam = searchParams.get("index");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

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
