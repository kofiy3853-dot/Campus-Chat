import mongoose, { Schema, Document } from 'mongoose';

export interface IClubEvent extends Document {
  club_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  location: string;
  image?: string;
  created_by: mongoose.Types.ObjectId;
}

const ClubEventSchema: Schema = new Schema({
  club_id: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  image: { type: String },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IClubEvent>('ClubEvent', ClubEventSchema);
