import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAction extends Document {
    point: any;
    user: string;
    create_at: Date;
}

const schema = new Schema<IAction>({
    point: Object,
    user: String,
    create_at: Date
}, {
    collection: 'actions'
});

const Action: Model<IAction> = mongoose.models.Action || mongoose.model<IAction>('Action', schema);
export default Action;
