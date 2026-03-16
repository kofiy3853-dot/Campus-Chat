import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessage extends Document {
  conversation_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  recipient_id: mongoose.Types.ObjectId; // For compatibility
  receiver: mongoose.Types.ObjectId; // Explicitly requested
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  media_url?: string;
  media_thumbnail?: string; // Thumbnail for images
  delivery_status: 'sent' | 'delivered' | 'read';
  read: boolean; // Explicitly requested
  timestamp: Date;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  reactions: IMessageReaction[];
  reply_to?: mongoose.Types.ObjectId | IMessage;
}

const MessageSchema: Schema = new Schema({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient_id: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // For compatibility
  receiver: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Explicitly requested
  message_text: { type: String },
  message_type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'voice'], 
    default: 'text' 
  },
  media_url: { type: String },
  media_thumbnail: { type: String },
  delivery_status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  read: { type: Boolean, default: false, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  edited_at: { type: Date },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
  reply_to: { type: Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

MessageSchema.index({ conversation_id: 1, timestamp: -1 }); // Compound index for fast message loading

export default mongoose.model<IMessage>('Message', MessageSchema);
