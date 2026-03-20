import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  posted_by: mongoose.Types.ObjectId;
  image?: string;
  pinned: boolean;
  reactions: { user_id: mongoose.Types.ObjectId, emoji: string }[];
  cta?: string;
  type?: 'engagement' | 'marketplace' | 'social';
  priority?: 'low' | 'medium' | 'high';
  is_auto_generated: boolean;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  posted_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String },
  pinned: { type: Boolean, default: false },
  reactions: [
    {
      user_id: { type: Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String }
    }
  ],
  cta: { type: String },
  type: { type: String, enum: ['engagement', 'marketplace', 'social'], default: 'engagement' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  is_auto_generated: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
