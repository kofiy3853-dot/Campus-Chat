import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMessage extends Document {
  group_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  message_text?: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  media_url?: string;
  timestamp: Date;
  reactions: {
    userId: mongoose.Types.ObjectId;
    emoji: string;
  }[];
}

const GroupMessageSchema: Schema = new Schema({
  group_id: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String },
  message_type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
  media_url: { type: String },
  timestamp: { type: Date, default: Date.now },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
}, { timestamps: true });

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
