import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/User';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const run = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}).limit(10);
    console.log('--- Users ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Has Password Hash: ${!!u.password_hash}`);
    });
    console.log('-------------');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
