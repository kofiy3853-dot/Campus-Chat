import express, { RequestHandler } from 'express';
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
  scheduleStudySession,
  markMessageHelpful
} from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', protect as RequestHandler, createGroup as RequestHandler);
router.get('/', protect as RequestHandler, getGroups as RequestHandler);
router.get('/discover', protect as RequestHandler, discoverGroups as RequestHandler);
router.get('/search', protect as RequestHandler, searchGroups as RequestHandler);
router.post('/join', protect as RequestHandler, joinGroup as RequestHandler);
router.get('/messages/:groupId', protect as RequestHandler, getGroupMessages as RequestHandler);
router.post('/send', protect as RequestHandler, sendGroupMessage as RequestHandler);
router.post('/messages/:groupId/read', protect as RequestHandler, markGroupMessagesAsRead as RequestHandler);
router.delete('/messages/:id', protect as RequestHandler, deleteGroupMessage as RequestHandler);
router.post('/resources', protect as RequestHandler, addGroupResource as RequestHandler);
router.post('/sessions', protect as RequestHandler, scheduleStudySession as RequestHandler);
router.post('/messages/:messageId/react', protect as RequestHandler, addGroupMessageReaction as RequestHandler);
router.post('/messages/:messageId/helpful', protect as RequestHandler, markMessageHelpful as RequestHandler);

export default router;
