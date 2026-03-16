import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController';
import { protect } from '../middleware/authMiddleware';

import multer from 'multer';
import { uploadToCloudinary } from '../services/cloudinaryService';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', protect, createAnnouncement);
router.get('/', getAnnouncements);

// Image upload for announcements
router.post('/upload', protect, upload.single('image'), (async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const url = await uploadToCloudinary(req.file.buffer, 'announcements');
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image' });
  }
}) as any);

export default router;
