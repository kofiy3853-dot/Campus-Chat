import { Queue, Worker } from 'bullmq';

const getRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      maxRetriesPerRequest: null,
    };
  } catch (err) {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
};

const connection = getRedisConnection();

export const messageQueue = new Queue('messages', { connection: connection as any });

export const messageWorker = new Worker('messages', async (job: any) => {
  const { sender_id, recipientId, message_text, message_type, media_url, conversationId } = job.data;
  console.log(`Processing message from ${sender_id} to ${recipientId}`);
}, { connection: connection as any });
