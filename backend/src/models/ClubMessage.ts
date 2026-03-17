import mongoose, { Schema, Document } from 'mongoose';

export interface IClubMessage extends Document {
  club_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  message_text?: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  media_url?: string;
  timestamp: Date;
  reactions: {
    userId: mongoose.Types.ObjectId;
    emoji: string;
  }[];
  reply_to?: mongoose.Types.ObjectId | IClubMessage;
}

const ClubMessageSchema: Schema = new Schema({
  club_id: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String },
  message_type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
  media_url: { type: String },
  timestamp: { type: Date, default: Date.now },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
  reply_to: { type: Schema.Types.ObjectId, ref: 'ClubMessage' },
}, { timestamps: true });

export default mongoose.model<IClubMessage>('ClubMessage', ClubMessageSchema);
