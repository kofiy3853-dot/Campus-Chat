import mongoose, { Schema, Document } from 'mongoose';

export interface IEventAttendee extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EventAttendeeSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure a user can only RSVP once per event
EventAttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IEventAttendee>('EventAttendee', EventAttendeeSchema);
