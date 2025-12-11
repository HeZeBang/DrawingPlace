import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPoint extends Document {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  user: string;
  create_at: Date;
  update_at: Date;
}

const schema = new Schema<IPoint>(
  {
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    c: String,
    user: String,
    create_at: Date,
    update_at: Date,
  },
  {
    collection: "points",
  },
);

const Point: Model<IPoint> =
  mongoose.models.Point || mongoose.model<IPoint>("Point", schema);
export default Point;
