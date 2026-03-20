import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment');
  process.exit(1);
}

async function clearAll() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    const collections = [
      'marketplaceitems',
      'announcements',
      'confessions',
      'lostfoundposts',
      'events',
      'polls',
      'clubposts',
      'internships',
      'pollvotes',
      'pollreports',
      'eventattendees'
    ];

    for (const colName of collections) {
      console.log(`Clearing collection: ${colName}...`);
      try {
        await mongoose.connection.db?.collection(colName).deleteMany({});
        console.log(`Cleared ${colName}.`);
      } catch (err: any) {
        console.log(`Error clearing ${colName}:`, err.message);
      }
    }

    console.log('All targeted collections cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

clearAll();
