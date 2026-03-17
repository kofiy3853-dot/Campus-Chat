import { Response } from 'express';
import { AuthRequest } from '../types/express';
import PointLog from '../models/PointLog';
import mongoose from 'mongoose';

export const getLeaderboards = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Campus Leader (All-time)
    const allTime = await PointLog.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          'user.name': 1,
          'user.profile_picture': 1,
          'user.department': 1
        }
      }
    ]);

    // 2. Weekly Leaderboard
    const weekly = await PointLog.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          'user.name': 1,
          'user.profile_picture': 1,
          'user.department': 1
        }
      }
    ]);

    // 3. Study Helpers (Filtered by action HELPFUL_ANSWER)
    const helpers = await PointLog.aggregate([
      {
        $match: {
          action: 'HELPFUL_ANSWER'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          'user.name': 1,
          'user.profile_picture': 1,
          'user.department': 1
        }
      }
    ]);

    res.json({
      allTime,
      weekly,
      helpers
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
