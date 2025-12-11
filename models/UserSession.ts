import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserSession extends Document {
    userId: string;
    token: string;
    updatedAt: Date;
}

const schema = new Schema<IUserSession>({
    userId: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'user_sessions'
});

const UserSession: Model<IUserSession> = mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', schema);
export default UserSession;
