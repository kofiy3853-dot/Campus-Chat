import mongoose, { Schema, Document } from 'mongoose';

export interface IConfession extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  reportCount: number;
  isDeleted: boolean;
  isHidden: boolean;
}

const ConfessionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

// Never expose userId in API responses
ConfessionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.userId;
    return ret;
  }
});

export default mongoose.model<IConfession>('Confession', ConfessionSchema);
