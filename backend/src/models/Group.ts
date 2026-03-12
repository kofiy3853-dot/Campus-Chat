import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  group_name: string;
  description: string;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  created_by: mongoose.Types.ObjectId;
  last_message?: mongoose.Types.ObjectId;
  last_message_time: Date;
}

const GroupSchema: Schema = new Schema({
  group_name: { type: String, required: true },
  description: { type: String, default: '' },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  last_message: { type: Schema.Types.ObjectId, ref: 'Message' },
  last_message_time: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IGroup>('Group', GroupSchema);
