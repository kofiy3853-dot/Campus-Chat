import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  device_type: 'web' | 'mobile' | 'desktop';
  is_active: boolean;
  created_at: Date;
  last_used: Date;
}

const DeviceTokenSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  device_type: { type: String, enum: ['web', 'mobile', 'desktop'], default: 'web' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  last_used: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
