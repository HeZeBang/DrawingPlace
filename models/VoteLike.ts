import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVoteLike extends Document {
  oderId: string;
  voteId: string; // Reference to the Vote._id being liked
  createdAt: Date;
}

const schema = new Schema<IVoteLike>(
  {
    oderId: { type: String, required: true },
    voteId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "vote_likes",
  },
);

// Ensure user can only like a vote once
schema.index({ oderId: 1, voteId: 1 }, { unique: true });
// Index for fast lookup of likes per vote
schema.index({ voteId: 1 });

const VoteLike: Model<IVoteLike> =
  mongoose.models.VoteLike || mongoose.model<IVoteLike>("VoteLike", schema);

export default VoteLike;
