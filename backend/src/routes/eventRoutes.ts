import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getEvents, createEvent, joinEvent, leaveEvent } from '../controllers/eventController';
import multer from 'multer';
import { uploadToSupabaseStorage } from '../services/supabaseStorageService';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', protect, getEvents);
router.post('/', protect, createEvent);
router.post('/:id/join', protect, joinEvent);
router.post('/:id/leave', protect, leaveEvent);

// Image upload for events
router.post('/upload', protect, upload.single('image'), (async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const url = await uploadToSupabaseStorage(req.file.buffer, req.file.originalname, 'events');
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image' });
  }
}) as any);

export default router;
