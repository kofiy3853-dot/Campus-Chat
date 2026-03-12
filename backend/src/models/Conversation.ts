import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  last_message?: mongoose.Types.ObjectId;
  last_message_time: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  last_message: { type: Schema.Types.ObjectId, ref: 'Message' },
  last_message_time: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
