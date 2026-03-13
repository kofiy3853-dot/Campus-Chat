import express, { Response } from 'express';
import { AuthRequest } from '../types/express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

const router = express.Router();

// Ensure media uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/lost-found');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// All routes are protected
router.use(protect);

// Upload endpoint
router.post('/upload', upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return res.status(400).json({ message: 'Only image files are allowed' });
  }

  const url = `/uploads/lost-found/${req.file.filename}`;
  res.json({ url, originalName: req.file.originalname });
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
