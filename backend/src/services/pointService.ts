import PointLog from '../models/PointLog';
import { io } from '../server';
import mongoose from 'mongoose';

export const awardPoints = async (
  userId: string | mongoose.Types.ObjectId,
  points: number,
  action: 'DAILY_LOGIN' | 'RESOURCE_POST' | 'GROUP_JOIN' | 'HELPFUL_ANSWER',
  metadata: any = {}
) => {
  try {
    const log = await PointLog.create({
      userId,
      points,
      action,
      metadata
    });

    // Emit real-time update to the user
    io.to(userId.toString()).emit('points_updated', {
      points,
      action,
      totalPoints: await getTotalPoints(userId.toString())
    });

    // Also emit a general leaderboard update event
    io.emit('leaderboard_update', { action, userId });

    return log;
  } catch (error: any) {
    console.error(`[PointService] Error awarding points:`, error.message);
  }
};

export const getTotalPoints = async (userId: string) => {
  const result = await PointLog.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  return result[0]?.total || 0;
};

export const checkDailyLogin = async (userId: string) => {
  const lastLoginPoint = await PointLog.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    action: 'DAILY_LOGIN'
  }).sort({ createdAt: -1 });

  if (!lastLoginPoint) return true;

  const now = new Date();
  const lastDate = new Date(lastLoginPoint.createdAt);
  
  // Check if 24 hours have passed
  return (now.getTime() - lastDate.getTime()) > (24 * 60 * 60 * 1000);
};
