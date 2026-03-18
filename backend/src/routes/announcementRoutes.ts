import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController';
import { protect } from '../middleware/authMiddleware';

import multer from 'multer';
import { uploadToFirebaseStorage } from '../services/cloudinaryService';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', protect, createAnnouncement);
router.get('/', getAnnouncements);

router.post('/upload', protect, upload.single('image'), (async (req: any, res: any) => {
  try {
    if (!req.file) {
      console.warn('[Announcements] Upload attempted with no file');
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    console.log(`[Announcements] Uploading file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    const url = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'announcements');
    
    console.log('[Announcements] Upload successful:', url);
    res.json({ url });
  } catch (error: any) {
    console.error('[Announcements] Image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      details: error.message 
    });
  }
}) as any);

export default router;
