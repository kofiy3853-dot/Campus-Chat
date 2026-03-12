import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMessage extends Document {
  group_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  message_text: string;
  media_url?: string;
  timestamp: Date;
}

const GroupMessageSchema: Schema = new Schema({
  group_id: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String, required: true },
  media_url: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
