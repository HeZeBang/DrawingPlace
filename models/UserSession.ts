import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSession extends Document {
  userId: string;
  token: string;
  updatedAt: Date;
  createdAt: Date;
}

const schema = new Schema<IUserSession>(
  {
    userId: { type: String, required: true, index: { unique: true } },
    token: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: 0 },
  },
  {
    collection: "user_sessions",
  },
);

// Ensure unique index is created
schema.index({ userId: 1 }, { unique: true });

const UserSession: Model<IUserSession> =
  mongoose.models.UserSession ||
  mongoose.model<IUserSession>("UserSession", schema);

export default UserSession;
