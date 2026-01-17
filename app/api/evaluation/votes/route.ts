import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import { getUserFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    
    // We allow fetching all votes without auth, but need auth for myVotes
    // If not authenticated, myVotes will be empty, which is fine
    
    await dbConnect();

    // Fetch all votes for the heatmap
    // Projecting only necessary fields to reduce payload size if there are many votes
    const allVotes = await Vote.find({}, { x: 1, y: 1, width: 1, height: 1, _id: 0 }).lean();

    let myVotes: any[] = [];
    if (userId) {
      myVotes = await Vote.find({ userId }).sort({ voteIndex: 1 }).lean();
    }

    return NextResponse.json({
      myVotes,
      allVotes
    });

  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
