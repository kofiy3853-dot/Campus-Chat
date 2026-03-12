import mongoose, { Schema, Document } from 'mongoose';

export interface IPollReport extends Document {
  _id: mongoose.Types.ObjectId;
  poll: mongoose.Types.ObjectId;
  reported_by: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes?: string;
  created_at: Date;
}

const pollReportSchema = new Schema<IPollReport>(
  {
    poll: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    reported_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['inappropriate_content', 'spam', 'harassment', 'misleading', 'other'],
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
pollReportSchema.index({ poll: 1 });
pollReportSchema.index({ reported_by: 1 });
pollReportSchema.index({ status: 1, created_at: -1 });

// TTL index to auto-delete resolved reports after 30 days
pollReportSchema.index(
  { created_at: 1 },
  { 
    expireAfterSeconds: 2592000,
    partialFilterExpression: { status: 'resolved' }
  }
);

const PollReport = mongoose.model<IPollReport>('PollReport', pollReportSchema);
export default PollReport;
