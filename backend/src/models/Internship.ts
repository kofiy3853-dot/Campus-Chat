import mongoose, { Schema, Document } from 'mongoose';

export interface IInternship extends Document {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  category: string;
  deadline: Date;
  apply_link?: string;
  posted_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipSchema: Schema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  location: { type: String, required: true },
  category: { type: String, required: true },
  deadline: { type: Date, required: true },
  apply_link: { type: String },
  posted_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IInternship>('Internship', InternshipSchema);
