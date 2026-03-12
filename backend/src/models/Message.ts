import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessage extends Document {
  conversation_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  media_url?: string;
  media_thumbnail?: string; // Thumbnail for images
  delivery_status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  reactions: IMessageReaction[];
}

const MessageSchema: Schema = new Schema({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String },
  message_type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
  media_url: { type: String },
  media_thumbnail: { type: String }, // Thumbnail for images
  delivery_status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  timestamp: { type: Date, default: Date.now },
  edited_at: { type: Date },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
