import express, { Response } from 'express';
import { AuthRequest } from '../types/express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getConversations, getMessages, sendMessage, createConversation, searchMessages, editMessage, deleteMessage, addMessageReaction, blockUser, getBlockedUsers, markMessagesAsRead } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';
import { messageRateLimiter, searchRateLimiter } from '../middleware/rateLimitMiddleware';

const router = express.Router();

// Ensure media uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/media');
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// Media upload – returns { url, type }
router.post('/upload', protect, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  let type: 'image' | 'audio' | 'file' = 'file';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'image';
  else if (['.mp3', '.ogg', '.wav', '.webm', '.m4a'].includes(ext)) type = 'audio';

  const url = `/uploads/media/${req.file.filename}`;
  res.json({ url, type, originalName: req.file.originalname });
});

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/send', protect, messageRateLimiter, sendMessage);
router.get('/search', protect, searchRateLimiter, searchMessages);
router.put('/messages/:messageId', protect, editMessage);
router.delete('/messages/:messageId', protect, deleteMessage);
router.post('/messages/:messageId/reaction', protect, addMessageReaction);
router.post('/block/:userId', protect, blockUser);
router.get('/blocked-users', protect, getBlockedUsers);
router.post('/conversations/:conversationId/read', protect, markMessagesAsRead);

export default router;

