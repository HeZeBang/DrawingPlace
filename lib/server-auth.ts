import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import UserSession from "@/models/UserSession";

export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  await dbConnect();
  
  // Find session by token
  const session = await UserSession.findOne({ token });
  
  if (!session) {
    return null;
  }
  
  return session.userId;
}
