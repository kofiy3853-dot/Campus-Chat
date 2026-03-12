import { Server, Socket } from 'socket.io';
import redisClient from '../config/redis';
import User from '../models/User';

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
