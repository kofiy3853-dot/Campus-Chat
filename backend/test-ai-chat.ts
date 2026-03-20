
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { handleAIResponse, ensureAIUser } from './src/services/aiChatService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected.');

    const aiUser = await ensureAIUser();
    console.log('AI User ID:', aiUser._id);

    const testUserId = '69b3f7453b7c168b823926e8'; // Ofosu Stephen
    const testConversationId = '69bd99c0d4a1b2c3e4f5a6b7'; // Dummy or find one

    console.log('Triggering AI response...');
    // We'll use a real conversation ID from the DB if possible
    const Message = require('./src/models/Message').default;
    const Conversation = require('./src/models/Conversation').default;

    let conversation = await Conversation.findOne({ participants: testUserId });
    if (!conversation) {
        console.log('No conversation found for test user, creating one...');
        const { getAIConversation } = require('./src/services/aiChatService');
        conversation = await getAIConversation(testUserId);
    }

    console.log('Conversation ID:', conversation._id);

    const result = await handleAIResponse(conversation._id.toString(), "Hello, can you help me with my math?", testUserId);
    
    console.log('AI Response Saved:', result.message_text);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

test();
