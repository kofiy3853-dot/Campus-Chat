import mongoose, { Schema, Document } from 'mongoose';

export interface IPollVote extends Document {
  _id: mongoose.Types.ObjectId;
  poll: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  selected_option: string; // Index of the selected option
  created_at: Date;
}

const pollVoteSchema = new Schema<IPollVote>(
  {
    poll: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    selected_option: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Unique constraint: One vote per user per poll
pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
pollVoteSchema.index({ poll: 1 });
pollVoteSchema.index({ user: 1 });

const PollVote = mongoose.model<IPollVote>('PollVote', pollVoteSchema);
export default PollVote;
