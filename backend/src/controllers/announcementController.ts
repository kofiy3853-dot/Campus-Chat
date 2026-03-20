import { Request, Response } from 'express';
import { AuthRequest } from '../types/express';
import Announcement from '../models/Announcement';

import { io } from '../server';

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  const { title, content, image, pinned } = req.body;

  try {
    const announcement = await Announcement.create({
      title,
      content,
      image,
      pinned: pinned || false,
      posted_by: req.user.id,
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('posted_by', 'name profile_picture');

    // Broadcast the new announcement to all users
    io.emit('new_announcement', populatedAnnouncement);

    res.status(201).json(populatedAnnouncement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .populate('posted_by', 'name profile_picture')
      .sort({ pinned: -1, createdAt: -1 });

    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if the user is the one who posted it or an admin or special user
    const isKofi = req.user.email === 'nharnahyhaw19@gmail.com';
    const isAdmin = req.user.role === 'admin';
    const isAuthor = announcement.posted_by.toString() === req.user._id.toString();

    if (!isAuthor && !isAdmin && !isKofi) {
      return res.status(403).json({ message: 'Unauthorized to delete this announcement' });
    }

    await Announcement.findByIdAndDelete(id);
    
    // Broadcast deletion
    io.emit('announcement_deleted', { id });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

