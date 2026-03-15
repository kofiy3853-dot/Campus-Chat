import mongoose, { Schema, Document } from 'mongoose';

export interface ILostFoundPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'electronics' | 'stationery' | 'personal' | 'miscellaneous';
  status: 'lost' | 'found';
  location: {
    building: string;
    room?: string;
  };
  date: Date;
  image_url?: string;
  image_thumbnail?: string;
  creator: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  is_resolved: boolean;
  resolved_date?: Date;
  is_deleted: boolean;
  contact_count: number;
  contact_number?: string;
}

const lostFoundPostSchema = new Schema<ILostFoundPost>(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['electronics', 'stationery', 'personal', 'miscellaneous'],
      required: true,
    },
    status: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    location: {
      building: {
        type: String,
        required: true,
        trim: true,
      },
      room: {
        type: String,
        trim: true,
      },
    },
    date: {
      type: Date,
      required: true,
    },
    image_url: {
      type: String,
      default: null,
    },
    image_thumbnail: {
      type: String,
      default: null,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    is_resolved: {
      type: Boolean,
      default: false,
    },
    resolved_date: {
      type: Date,
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    contact_count: {
      type: Number,
      default: 0,
    },
    contact_number: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Indices for efficient queries
lostFoundPostSchema.index({ creator: 1, created_at: -1 });
lostFoundPostSchema.index({ status: 1, created_at: -1 });
lostFoundPostSchema.index({ category: 1, status: 1 });
lostFoundPostSchema.index({ created_at: -1 });
lostFoundPostSchema.index({ is_resolved: 1 });

// TTL index to auto-delete resolved posts after 90 days
lostFoundPostSchema.index(
  { resolved_date: 1 },
  { 
    expireAfterSeconds: 7776000,
    partialFilterExpression: { is_resolved: true }
  }
);

const LostFoundPost = mongoose.model<ILostFoundPost>('LostFoundPost', lostFoundPostSchema);
export default LostFoundPost;
