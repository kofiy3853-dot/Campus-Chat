import mongoose, { Schema, Document } from 'mongoose';

export interface IClub extends Document {
  name: string;
  category: string;
  description: string;
  profile_image: string;
  visibility: 'public' | 'private';
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  created_by: mongoose.Types.ObjectId;
}

const ClubSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  profile_image: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IClub>('Club', ClubSchema);
