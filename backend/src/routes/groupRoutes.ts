import express from 'express';
import { 
  createGroup, 
  getGroups, 
  joinGroup, 
  getGroupMessages, 
  sendGroupMessage,
  discoverGroups,
  searchGroups,
  addGroupMessageReaction
} from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/discover', protect, discoverGroups);
router.get('/search', protect, searchGroups);
router.post('/join', protect, joinGroup);
router.get('/messages/:groupId', protect, getGroupMessages);
router.post('/send', protect, sendGroupMessage);
router.post('/messages/:messageId/reaction', protect, addGroupMessageReaction);

export default router;
