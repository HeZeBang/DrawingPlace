import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Action from "@/models/Action";
import UserSession from "@/models/UserSession";

export async function GET() {
  try {
    await dbConnect();

    // Get total actions count
    const totalActions = await Action.countDocuments();

    // Get total unique users count
    const totalUsers = await UserSession.countDocuments();

    return NextResponse.json({
      status: true,
      data: {
        totalActions,
        totalUsers,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
