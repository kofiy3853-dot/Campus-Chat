import mongoose, { Schema, Document } from 'mongoose';

export interface IConfessionComment extends Document {
  confessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const ConfessionCommentSchema: Schema = new Schema({
  confessionId: { type: Schema.Types.ObjectId, ref: 'Confession', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 300 },
}, { timestamps: true });

// Strip userId from comments too
ConfessionCommentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.userId;
    return ret;
  }
});

export default mongoose.model<IConfessionComment>('ConfessionComment', ConfessionCommentSchema);
