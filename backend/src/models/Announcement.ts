import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  posted_by: mongoose.Types.ObjectId;
  reactions: { user_id: mongoose.Types.ObjectId, emoji: string }[];
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  posted_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reactions: [
    {
      user_id: { type: Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String }
    }
  ],
}, { timestamps: true });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
