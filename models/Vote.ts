import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVote extends Document {
  userId: string;
  voteIndex: number; // 0, 1, or 2 (representing 1st, 2nd, 3rd choice)
  x: number;
  y: number;
  width: number;
  height: number;
  updatedAt: Date;
}

const schema = new Schema<IVote>(
  {
    userId: { type: String, required: true },
    voteIndex: { type: Number, required: true, min: 0, max: 2 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "votes",
    timestamps: { createdAt: true, updatedAt: true }
  },
);

// Ensure user can only have one vote per index
schema.index({ userId: 1, voteIndex: 1 }, { unique: true });

const Vote: Model<IVote> =
  mongoose.models.Vote || mongoose.model<IVote>("Vote", schema);

export default Vote;
