import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
console.log('[User Model] bcrypt type:', typeof bcrypt);
console.log('[User Model] bcrypt has compare:', typeof bcrypt?.compare === 'function');

export interface IUser extends Document {
  name: string;
  email: string;
  student_id: string;
  department: string;
  level: string;
  profile_picture: string;
  password_hash: string;
  status: 'online' | 'offline';
  last_seen: Date;
  role: 'user' | 'admin';
  isBanned: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  student_id: { type: String, required: true, unique: true },
  department: { type: String },
  level: { type: String },
  profile_picture: { type: String, default: '' },
  password_hash: { type: String, required: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  last_seen: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password_hash);
};

export default mongoose.model<IUser>('User', UserSchema);
