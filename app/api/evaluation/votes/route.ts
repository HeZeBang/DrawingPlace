import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import VoteLike from "@/models/VoteLike";
import { getUserFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);

    // We allow fetching all votes without auth, but need auth for myVotes
    // If not authenticated, myVotes will be empty, which is fine

    await dbConnect();

    // Fetch all votes for the heatmap
    // Include _id so frontend can reference for liking
    const allVotes = await Vote.find(
      {},
      { x: 1, y: 1, width: 1, height: 1, comment: 1, likes: 1, _id: 1 },
    ).lean();

    let myVotes: any[] = [];
    let myLikedVoteIds: string[] = [];

    if (userId) {
      myVotes = await Vote.find(
        { userId },
        {
          voteIndex: 1,
          x: 1,
          y: 1,
          width: 1,
          height: 1,
          comment: 1,
          likes: 1,
          _id: 1,
        },
      )
        .sort({ voteIndex: 1 })
        .lean();

      // Get all votes this user has liked
      const likes = await VoteLike.find(
        { oderId: userId },
        { voteId: 1, _id: 0 },
      ).lean();
      myLikedVoteIds = likes.map((l) => l.voteId);
    }

    return NextResponse.json({
      myVotes,
      allVotes,
      myLikedVoteIds,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
