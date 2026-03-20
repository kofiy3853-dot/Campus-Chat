
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { createDailyAnnouncement } from './src/services/announcementEngine';
import User from './src/models/User';
import Announcement from './src/models/Announcement';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not found in environment');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Triggering manual announcement (engagement)...');
    const result = await createDailyAnnouncement('engagement');
    
    if (result) {
      console.log('SUCCESS: Announcement created:', (result as any).title);
    } else {
      console.log('FAILURE: Announcement not created (returned null/undefined)');
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

test();
