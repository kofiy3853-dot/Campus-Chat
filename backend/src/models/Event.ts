import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  dateTime: Date;
  image: string;
  organizerId: mongoose.Types.ObjectId;
  category: 'Academic' | 'Social' | 'Sports' | 'Clubs' | 'Career';
  attendeesCount: number;
  maxAttendees?: number;
}

const EventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  dateTime: { type: Date, required: true },
  image: { type: String, default: '' },
  organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['Academic', 'Social', 'Sports', 'Clubs', 'Career'], 
    required: true 
  },
  attendeesCount: { type: Number, default: 0 },
  maxAttendees: { type: Number },
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);
