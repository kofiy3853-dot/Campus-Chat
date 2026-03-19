import express, { Response } from 'express';
import { AuthRequest } from '../types/express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getConversations,
  getConversationById,
  getMessages, 
  sendMessage, 
  createConversation, 
  searchMessages, 
  editMessage, 
  deleteMessage, 
  addMessageReaction, 
  blockUser, 
  getBlockedUsers, 
  markMessagesAsRead, 
  getUnreadCount,
  deleteConversation 
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';
import { messageRateLimiter, searchRateLimiter } from '../middleware/rateLimitMiddleware';

import { uploadToFirebaseStorage } from '../services/cloudinaryService';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// Media upload – returns { url, type }
router.post('/upload', protect, upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    console.log(`[Upload] File received: ${req.file.originalname}, size: ${req.file.size}, ext: ${ext}`);
    
    let type: 'image' | 'voice' | 'file' = 'file';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'image';
    else if (['.mp3', '.ogg', '.wav', '.webm', '.m4a', '.mp4', '.aac'].includes(ext)) type = 'voice';

    console.log(`[Upload] Detected type: ${type}`);

    // Upload to Cloudinary
    const folder = type === 'image' ? 'chat/images' : (type === 'voice' ? 'chat/voice' : 'chat/files');
    console.log(`[Upload] Target folder: ${folder}`);
    console.log(`[Upload] Using bucket env: ${process.env.FIREBASE_STORAGE_BUCKET}`);
    
    const url = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, folder);
    console.log(`[Upload] Success! URL: ${url}`);

    res.json({ url, type, originalName: req.file.originalname });
  } catch (error: any) {
    console.error('[Upload] Chat media upload error:', error);
    // Log full error details for debugging
    res.status(500).json({ 
      message: 'Failed to upload media to Firebase Storage',
      error: error.message || String(error),
      details: error.response?.data || error
    });
  }
});

router.get('/test', (req, res) => res.json({ message: 'Chat routes are working' }));
router.get('/conversations', protect, getConversations);

// Get single conversation by ID
router.get('/conversations/:conversationId', protect, getConversationById);
router.post('/conversations', protect, createConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/send', protect, messageRateLimiter, sendMessage);
router.get('/search', protect, searchRateLimiter, searchMessages);
router.put('/messages/:messageId', protect, editMessage);
router.delete('/messages/:id', protect, deleteMessage);
router.post('/messages/:messageId/reaction', protect, addMessageReaction);
router.post('/block/:userId', protect, blockUser);
router.get('/blocked-users', protect, getBlockedUsers);
router.post('/conversations/:conversationId/read', protect, markMessagesAsRead);
router.delete('/conversations/:conversationId', protect, deleteConversation);
router.get('/unread-count', protect, getUnreadCount);

export default router;

