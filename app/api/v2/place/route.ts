import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Point from "@/models/Point";
import Action from "@/models/Action";
import { PlaceResponseSchema } from "@/lib/schemas";

export async function GET() {
  await dbConnect();

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
    const rawPoints = await Point.find({}).select("x y c").lean();
    const actionCount = await Action.countDocuments();

    const points = rawPoints.map((p) => ({
      x: p.x,
      y: p.y,
      c: p.c,
    }));

    return NextResponse.json(
      PlaceResponseSchema.parse({
        status: true,
        data: {
          points,
          colors,
          delay: process.env.DRAW_DELAY_MS
            ? parseInt(process.env.DRAW_DELAY_MS) / 1000
            : 5,
          actionCount,
        },
      }
      ));
  } catch (error) {
    return NextResponse.json(
      PlaceResponseSchema.parse(
        { status: false, error: error.message }
      ),
      { status: 500 },
    );
  }
}
