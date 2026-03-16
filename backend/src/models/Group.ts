import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  group_name: string;
  subject?: string;
  description: string;
  schedule?: string;
  max_members?: number;
  visibility: 'public' | 'private';
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  created_by: mongoose.Types.ObjectId;
  last_message?: mongoose.Types.ObjectId;
  last_message_time: Date;
  resources: {
    title: string;
    url: string;
    type: 'link' | 'file';
    added_by: mongoose.Types.ObjectId;
    timestamp: Date;
  }[];
  study_sessions: {
    title: string;
    description?: string;
    start_time: Date;
    end_time: Date;
    location?: string;
    created_by: mongoose.Types.ObjectId;
  }[];
}

const GroupSchema: Schema = new Schema({
  group_name: { type: String, required: true },
  subject: { type: String },
  description: { type: String, default: '' },
  schedule: { type: String },
  max_members: { type: Number, default: 50 },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  last_message: { type: Schema.Types.ObjectId, ref: 'Message' },
  last_message_time: { type: Date, default: Date.now },
  resources: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['link', 'file'], default: 'link' },
    added_by: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  study_sessions: [{
    title: { type: String, required: true },
    description: { type: String },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    location: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

export default mongoose.model<IGroup>('Group', GroupSchema);
