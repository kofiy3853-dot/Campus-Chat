import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected to:', mongoose.connection.name);
  const collections = await mongoose.connection.db?.listCollections().toArray();
  console.log('Collections:', collections?.map(c => c.name));
  
  const count = await mongoose.connection.db?.collection('announcements').countDocuments();
  console.log('Announcement count in current DB:', count);
  process.exit(0);
}

check();
