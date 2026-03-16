import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  internship: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  resume_url: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: Date;
}

const ApplicationSchema: Schema = new Schema({
  internship: { type: Schema.Types.ObjectId, ref: 'Internship', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resume_url: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  applied_at: { type: Date, default: Date.now }
});

// Prevent duplicate applications from same user to same internship
ApplicationSchema.index({ internship: 1, student: 1 }, { unique: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
