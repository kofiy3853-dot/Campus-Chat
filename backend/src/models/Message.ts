import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversation_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  media_url?: string;
  delivery_status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String },
  message_type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
  media_url: { type: String },
  delivery_status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
