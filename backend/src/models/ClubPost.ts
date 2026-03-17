import mongoose, { Schema, Document } from 'mongoose';

export interface IClubPost extends Document {
  club_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  image?: string;
  posted_by: mongoose.Types.ObjectId;
  type: 'announcement' | 'post';
  reactions: { user_id: mongoose.Types.ObjectId, emoji: string }[];
}

const ClubPostSchema: Schema = new Schema({
  club_id: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  posted_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['announcement', 'post'], default: 'post' },
  reactions: [
    {
      user_id: { type: Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String }
    }
  ],
}, { timestamps: true });

export default mongoose.model<IClubPost>('ClubPost', ClubPostSchema);
