import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  sender_id?: mongoose.Types.ObjectId;
  type: 'message' | 'group_invite' | 'announcement' | 'event_update';
  title: string;
  body: string;
  data: {
    conversation_id?: string;
    group_id?: string;
    announcement_id?: string;
    event_id?: string;
  };
  read: boolean;
  read_at?: Date;
  created_at: Date;
}

const NotificationSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['message', 'group_invite', 'announcement', 'event_update'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: {
    conversation_id: { type: String },
    group_id: { type: String },
    announcement_id: { type: String },
    event_id: { type: String },
  },
  read: { type: Boolean, default: false },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now, index: true, expires: 2592000 }, // Auto-delete after 30 days
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
