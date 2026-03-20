import { Response } from 'express';
import { AuthRequest } from '../types/express';
import User from '../models/User';
import mongoose from 'mongoose';
import { createDailyAnnouncement } from '../services/announcementEngine';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { student_id: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).select('-password_hash').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User "${user.name}" deleted successfully` });
  } catch {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ message: 'You cannot ban your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ message: `User "${user.name}" ${user.isBanned ? 'banned' : 'unbanned'} successfully`, isBanned: user.isBanned });
  } catch {
    res.status(500).json({ message: 'Failed to update ban status' });
  }
};

export const promoteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.json({ message: `User "${user.name}" is now ${user.role}`, role: user.role });
  } catch {
    res.status(500).json({ message: 'Failed to update role' });
  }
};

export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, bannedUsers, adminUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ role: 'admin' }),
    ]);

    res.json({ totalUsers, bannedUsers, adminUsers });
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

export const triggerAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'engagement' } = req.body;
    
    if (!['engagement', 'marketplace', 'social'].includes(type)) {
      return res.status(400).json({ message: 'Invalid announcement type' });
    }

    const announcement = await createDailyAnnouncement(type as any);
    
    if (!announcement) {
      return res.status(500).json({ message: 'Failed to generate announcement (AI providers might be down)' });
    }

    res.json({ 
      message: `Manual ${type} announcement triggered successfully`,
      announcement 
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error triggering announcement', error: err.message });
  }
};
