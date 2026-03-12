import { Request, Response } from 'express';
import Announcement from '../models/Announcement';

export const createAnnouncement = async (req: any, res: Response) => {
  const { title, content } = req.body;

  try {
    const announcement = await Announcement.create({
      title,
      content,
      posted_by: req.user.id,
    });

    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .populate('posted_by', 'name profile_picture')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
