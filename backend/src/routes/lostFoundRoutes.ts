import express, { Response } from 'express';
import { AuthRequest } from '../types/express';
import multer from 'multer';
import path from 'path';
import {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  reportPost,
  incrementContactCount,
  resolvePost,
} from '../controllers/lostFoundController';
import { protect } from '../middleware/authMiddleware';
import { messageRateLimiter } from '../middleware/rateLimitMiddleware';
import { uploadToFirebaseStorage } from '../services/cloudinaryService';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// All routes are protected
router.use(protect);

// Upload endpoint
router.post('/upload', upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    // Upload to Cloudinary
    const url = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'lost-found');
    res.json({ url, originalName: req.file.originalname });
  } catch (error: any) {
    console.error('Lost & Found upload error:', error);
    res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
  }
});

// CRUD operations
router.post('/', messageRateLimiter, createPost); // Create post
router.get('/feed', getAllPosts); // Get all posts (with filters)
router.get('/user/:userId', getUserPosts); // Get user's posts
router.get('/:postId', getPost); // Get single post
router.put('/:postId', updatePost); // Update post
router.delete('/:postId', deletePost); // Delete post

// Interaction endpoints
router.post('/:postId/contact', messageRateLimiter, incrementContactCount); // Record contact
router.post('/:postId/resolve', protect, (req: AuthRequest, res: Response) => resolvePost(req, res));
router.post('/:postId/report', messageRateLimiter, reportPost); // Report post

export default router;
