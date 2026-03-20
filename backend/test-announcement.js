
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { createDailyAnnouncement } = require('./dist/services/announcementEngine');
const User = require('./dist/models/User').default;
const Announcement = require('./dist/models/Announcement').default;

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Triggering manual announcement (engagement)...');
    const result = await createDailyAnnouncement('engagement');
    
    if (result) {
      console.log('SUCCESS: Announcement created:', result.title);
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
