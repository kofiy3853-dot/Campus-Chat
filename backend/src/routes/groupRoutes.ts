import express from 'express';
import { 
  createGroup, 
  getGroups, 
  joinGroup, 
  getGroupMessages, 
  sendGroupMessage,
  discoverGroups,
  searchGroups,
  addGroupMessageReaction,
  markGroupMessagesAsRead,
  deleteGroupMessage,
  addGroupResource,
  scheduleStudySession
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
router.post('/messages/:groupId/read', protect, markGroupMessagesAsRead);
router.delete('/messages/:id', protect, deleteGroupMessage);
router.post('/resources', protect, addGroupResource);
router.post('/sessions', protect, scheduleStudySession);
router.post('/messages/:messageId/react', protect, addGroupMessageReaction);

export default router;
