import mongoose, { Schema, Document } from 'mongoose';

export interface IConfessionReaction extends Document {
  confessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'report';
}

const ConfessionReactionSchema: Schema = new Schema({
  confessionId: { type: Schema.Types.ObjectId, ref: 'Confession', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'report'], required: true },
}, { timestamps: true });

// One reaction per user per confession per type
ConfessionReactionSchema.index({ confessionId: 1, userId: 1, type: 1 }, { unique: true });

export default mongoose.model<IConfessionReaction>('ConfessionReaction', ConfessionReactionSchema);
