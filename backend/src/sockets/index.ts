import { Server, Socket } from 'socket.io';
import redisClient from '../config/redis';
import User from '../models/User';
import Notification from '../models/Notification';

export const setupSockets = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    try {
      const userId = socket.handshake.query.userId as string;

      if (userId && userId !== 'null' && userId !== 'undefined') {
        console.log(`[Socket] User ${userId} connecting...`);
        
        // Use a timeout for Redis to prevent hanging
        const redisOp = redisClient.set(`user_status:${userId}`, 'online').catch(e => {
          console.error('[Socket] Redis Status Update Error:', e.message);
        });
        
        const mongoOp = User.findByIdAndUpdate(userId, { status: 'online', last_seen: new Date() }).catch(e => {
          console.error('[Socket] Mongo Status Update Error:', e.message);
        });

        await Promise.all([redisOp, mongoOp]);
        
        console.log(`[Socket] Shared presence updated for ${userId}`);
        socket.broadcast.emit('user_online', userId);
      }

      socket.on('join_room', (roomId: string) => {
        if (!roomId || roomId === 'null') return;
        socket.join(roomId);
        console.log(`[Socket] joined room: ${roomId}`);
      });

      socket.on('typing_start', (data: { roomId: string, userId: string }) => {
        if (data.roomId) socket.to(data.roomId).emit('typing_start', data);
      });

      socket.on('typing_stop', (data: { roomId: string, userId: string }) => {
        if (data.roomId) socket.to(data.roomId).emit('typing_stop', data);
      });

      socket.on('send_message', (data: any) => {
        if (data.roomId) socket.to(data.roomId).emit('receive_message', data);
      });

      socket.on('send_group_message', (data: any) => {
        if (data.roomId) socket.to(data.roomId).emit('receive_group_message', data);
      });

      // New: Message reaction
      socket.on('message_reaction', (data: { messageId: string, emoji: string, roomId: string }) => {
        if (data.roomId) {
          socket.to(data.roomId).emit('message_reaction', data);
        }
      });

      // New: Message edit
      socket.on('message_edited', (data: { messageId: string, message_text: string, roomId: string }) => {
        if (data.roomId) {
          socket.to(data.roomId).emit('message_edited', data);
        }
      });

      // New: Message delete
      socket.on('message_deleted', (data: { messageId: string, roomId: string }) => {
        if (data.roomId) {
          socket.to(data.roomId).emit('message_deleted', data);
        }
      });

      // New: Notification broadcast
      socket.on('new_notification', (data: { userId: string, notification: any }) => {
        io.to(`notification:${data.userId}`).emit('notification', data.notification);
      });

      // New: Poll events
      socket.on('poll_created', (data: { poll: any }) => {
        socket.broadcast.emit('new_poll', data.poll);
      });

      socket.on('poll_voted', (data: { pollId: string, poll: any }) => {
        socket.broadcast.emit('poll_updated', { pollId: data.pollId, poll: data.poll });
      });

      socket.on('poll_deleted', (data: { pollId: string }) => {
        socket.broadcast.emit('poll_removed', { pollId: data.pollId });
      });

      // Join notification room
      if (userId && userId !== 'null' && userId !== 'undefined') {
        socket.join(`notification:${userId}`);
        console.log(`[Socket] User ${userId} joined notification room`);
      }

      socket.on('disconnect', async () => {
        if (userId && userId !== 'null' && userId !== 'undefined') {
          console.log(`[Socket] User ${userId} disconnected`);
          redisClient.set(`user_status:${userId}`, 'offline').catch(() => {});
          User.findByIdAndUpdate(userId, { status: 'offline', last_seen: new Date() }).catch(() => {});
          socket.broadcast.emit('user_offline', userId);
        }
      });
    } catch (err: any) {
      console.error('[Socket] Connection Handler Error:', err.message);
      console.error(err.stack);
    }
  });
};
