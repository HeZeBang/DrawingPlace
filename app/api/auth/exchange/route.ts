import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserSession from "@/models/UserSession";
import crypto from "crypto";

// Server-side Casdoor config
const serverConfig = {
  serverUrl: process.env.CASDOOR_SERVER_URL || "https://door.casdoor.com",
  clientId: process.env.CASDOOR_CLIENT_ID || "",
  clientSecret: process.env.CASDOOR_CLIENT_SECRET || "",
  appName: process.env.CASDOOR_APP_NAME || "",
  organizationName: process.env.CASDOOR_ORGANIZATION_NAME || "",
  drawMaxPoints: parseInt(process.env.DRAW_MAX_POINTS || "5", 10),
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify Casdoor token and get user info via OIDC userinfo endpoint
    const userinfoUrl = `${serverConfig.serverUrl}/api/userinfo`;

    let userId: string | null = null;

    try {
      const userInfoResponse = await fetch(userinfoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        // OIDC userinfo returns 'sub' as the unique identifier
        userId = userInfo.sub || userInfo.id || userInfo.name;
      }
    } catch (e) {
      console.error("Failed to fetch userinfo", e);
    }

    if (!userId) {
      // Fallback: try /api/get-account which is Casdoor specific
      try {
        const accountUrl = `${serverConfig.serverUrl}/api/get-account`;
        const accountResponse = await fetch(accountUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.status === "ok" && accountData.data) {
            userId = accountData.data.id || accountData.data.name;
          }
        }
      } catch (e) {
        console.error("Failed to fetch account info", e);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid Casdoor token" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Generate draw token
    const drawToken = crypto.randomBytes(32).toString("hex");

    // Check token creation frequency and cleanup old sessions atomically
    const existingSession = await UserSession.findOne({ userId: userId });

    if (existingSession) {
      const now = Date.now();
      const createdAt = new Date(existingSession.createdAt).getTime();
      const timeSinceCreation = now - createdAt;

      console.log(
        `Token check for user ${userId}: last token created ${timeSinceCreation}ms ago`,
      );

      if (timeSinceCreation < 10 * 1000) {
        const waitTime = Math.ceil((10 * 1000 - timeSinceCreation) / 1000);
        console.log(`Token creation too frequent. User must wait ${waitTime}s`);
        return NextResponse.json(
          {
            error:
              "Token creation too frequent. Please wait before trying again.",
            timeSinceCreation: timeSinceCreation / 1000,
            retryAfter: waitTime,
          },
          { status: 429, headers: { "Retry-After": waitTime.toString() } },
        );
      }

      // Delete old session using atomic operation
      await UserSession.findOneAndDelete({ userId: userId });
    }

    // Create new session
    await UserSession.create({
      userId: userId,
      token: drawToken,
      createdAt: new Date(),
    });

    console.log(`Generated new token for user ${userId}: ${drawToken}`);
    return NextResponse.json({ token: drawToken });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
