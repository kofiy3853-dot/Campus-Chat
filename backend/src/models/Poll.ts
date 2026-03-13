import mongoose, { Schema, Document } from 'mongoose';

interface PollOption {
  _id?: string;
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  options: PollOption[];
  creator: mongoose.Types.ObjectId;
  created_at: Date;
  expires_at?: Date | null;
  is_anonymous: boolean;
  hide_results_until_voted: boolean;
  is_deleted: boolean;
  total_votes: number;
  status: 'active' | 'expired' | 'closed';
}

const pollSchema = new Schema<IPoll>(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      minlength: [5, 'Question must be at least 5 characters'],
      maxlength: [200, 'Question cannot exceed 200 characters'],
      trim: true,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          minlength: 1,
          maxlength: 100,
          trim: true,
        },
        votes: {
          type: Number,
          default: 0,
        },
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    hide_results_until_voted: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    total_votes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for faster queries
pollSchema.index({ creator: 1, created_at: -1 });
pollSchema.index({ created_at: -1 });

// TTL index to auto-delete expired polls after 90 days
pollSchema.index(
  { expires_at: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);

const Poll = mongoose.model<IPoll>('Poll', pollSchema);
export default Poll;
