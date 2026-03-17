import mongoose, { Schema, Document } from 'mongoose';

export interface IPointLog extends Document {
  userId: mongoose.Types.ObjectId;
  points: number;
  action: 'DAILY_LOGIN' | 'RESOURCE_POST' | 'GROUP_JOIN' | 'HELPFUL_ANSWER';
  metadata: {
    groupId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    resourceId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
}

const PointLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  points: { type: Number, required: true },
  action: { 
    type: String, 
    enum: ['DAILY_LOGIN', 'RESOURCE_POST', 'GROUP_JOIN', 'HELPFUL_ANSWER'],
    required: true 
  },
  metadata: {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    messageId: { type: Schema.Types.ObjectId, ref: 'GroupMessage' },
    resourceId: { type: Schema.Types.ObjectId },
  }
}, { timestamps: true });

// Index for weekly aggregation
PointLogSchema.index({ createdAt: -1 });
PointLogSchema.index({ action: 1 });

export default mongoose.model<IPointLog>('PointLog', PointLogSchema);
