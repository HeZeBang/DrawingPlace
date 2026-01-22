import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import VoteLike from "@/models/VoteLike";
import { z } from "zod";

const LikeSchema = z.object({
  userId: z.string().min(1),
  voteId: z.string().min(1),
});

// POST - Like a vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = LikeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const { userId, voteId } = result.data;
    const oderId = userId; // oderId is the liker's userId

    await dbConnect();

    // Check if vote exists
    const vote = await Vote.findById(voteId);
    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await VoteLike.findOne({ oderId, voteId });
    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    // Create like and increment vote likes count
    await VoteLike.create({ oderId, voteId });
    await Vote.findByIdAndUpdate(voteId, { $inc: { likes: 1 } });

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    console.error("Error liking vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE - Unlike a vote
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const voteId = searchParams.get("voteId");
    const oderId = userId; // oderId is the liker's userId

    if (!oderId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!voteId) {
      return NextResponse.json(
        { error: "Missing voteId parameter" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Check if like exists
    const existingLike = await VoteLike.findOne({ oderId, voteId });
    if (!existingLike) {
      return NextResponse.json({ error: "Not liked" }, { status: 404 });
    }

    // Remove like and decrement vote likes count
    await VoteLike.deleteOne({ oderId, voteId });
    await Vote.findByIdAndUpdate(voteId, { $inc: { likes: -1 } });

    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    console.error("Error unliking vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
