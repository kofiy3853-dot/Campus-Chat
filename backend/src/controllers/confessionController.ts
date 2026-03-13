import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/express';
import Confession from '../models/Confession';
import ConfessionComment from '../models/ConfessionComment';
import ConfessionReaction from '../models/ConfessionReaction';
import User from '../models/User';

// GET /api/confessions?page=1&sort=newest|top
export const getConfessions = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const sort = req.query.sort === 'top' ? { likesCount: -1 } : { createdAt: -1 };

    const confessions = await Confession.find({ isDeleted: false, isHidden: false })
      .sort(sort as any)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach whether current user has liked each confession
    const userId = req.user?._id;
    const ids = confessions.map(c => c._id);
    const myLikes = userId
      ? await ConfessionReaction.find({ confessionId: { $in: ids }, userId, type: 'like' }).lean()
      : [];
    const likedSet = new Set(myLikes.map(l => String(l.confessionId)));

    const result = confessions.map(c => ({
      ...c,
      userId: undefined, // ensure stripped even from lean()
      isLiked: likedSet.has(String(c._id)),
    }));

    const total = await Confession.countDocuments({ isDeleted: false, isHidden: false });

    res.json({ confessions: result, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/confessions
export const postConfession = async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ message: 'Confession must be at least 5 characters.' });
  }
  if (text.length > 500) {
    return res.status(400).json({ message: 'Confession must be 500 characters or less.' });
  }

  try {
    const confession = await Confession.create({ userId: req.user._id, text: text.trim() });
    // Return without userId
    const safe = confession.toJSON();
    res.status(201).json(safe);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/confessions/:id/like  (toggle)
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existing = await ConfessionReaction.findOne({ confessionId: id as any, userId, type: 'like' });

    if (existing) {
      await existing.deleteOne();
      await Confession.findByIdAndUpdate(id as any, { $inc: { likesCount: -1 } });
      return res.json({ liked: false });
    } else {
      await ConfessionReaction.create({ confessionId: id as any, userId, type: 'like' });
      await Confession.findByIdAndUpdate(id as any, { $inc: { likesCount: 1 } });
      return res.json({ liked: true });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/confessions/:id/report
export const reportConfession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existing = await ConfessionReaction.findOne({ confessionId: id as any, userId, type: 'report' });
    if (existing) return res.status(400).json({ message: 'You have already reported this.' });

    await ConfessionReaction.create({ confessionId: id as any, userId, type: 'report' });
    const confession = await Confession.findByIdAndUpdate(
      id as any,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    // Auto-hide if 5+ reports
    if (confession && confession.reportCount >= 5) {
      await Confession.findByIdAndUpdate(id, { isHidden: true });
    }

    res.json({ message: 'Reported successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/confessions/:id/comments
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const comments = await ConfessionComment.find({ confessionId: req.params.id as any })
      .sort({ createdAt: 1 })
      .lean();

    // Strip userId from each comment
    const safe = comments.map(({ userId: _uid, ...rest }) => rest);
    res.json(safe);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/confessions/:id/comments
export const addComment = async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text || text.trim().length < 1) return res.status(400).json({ message: 'Comment cannot be empty.' });
  if (text.length > 300) return res.status(400).json({ message: 'Comment must be 300 characters or less.' });

  try {
    await ConfessionComment.create({ confessionId: req.params.id as any, userId: req.user._id, text: text.trim() });
    await Confession.findByIdAndUpdate(req.params.id as any, { $inc: { commentsCount: 1 } });
    res.status(201).json({ message: 'Comment added.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/confessions/:id — admin only
export const deleteConfession = async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only.' });
  try {
    await Confession.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: 'Confession deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/confessions/:id/ban — admin only (ban the confession author)
export const banUser = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only.' });
  try {
    const confession = await Confession.findById(req.params.id).select('+userId');
    if (!confession) return res.status(404).json({ message: 'Confession not found.' });

    await User.findByIdAndUpdate((confession as any)._doc?.userId || confession.get('userId'), { isBanned: true });
    await Confession.findByIdAndUpdate(req.params.id, { isDeleted: true });

    res.json({ message: 'User banned and confession removed.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


