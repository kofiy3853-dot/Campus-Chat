import mongoose, { Schema, Document } from 'mongoose';

export interface ILostFoundReport extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  reported_by: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes?: string;
  created_at: Date;
}

const lostFoundReportSchema = new Schema<ILostFoundReport>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'LostFoundPost',
      required: true,
    },
    reported_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'false_info', 'harassment', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    admin_notes: {
      type: String,
      maxlength: 500,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for reports
lostFoundReportSchema.index({ post: 1 });
lostFoundReportSchema.index({ reported_by: 1 });
lostFoundReportSchema.index({ status: 1, created_at: -1 });

// TTL index to auto-delete resolved reports after 30 days
lostFoundReportSchema.index(
  { created_at: 1 },
  { 
    expireAfterSeconds: 2592000,
    partialFilterExpression: { status: 'resolved' }
  }
);

const LostFoundReport = mongoose.model<ILostFoundReport>('LostFoundReport', lostFoundReportSchema);
export default LostFoundReport;
