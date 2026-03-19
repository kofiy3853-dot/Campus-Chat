import express, { RequestHandler } from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';
import {
  createClub,
  getClubs,
  getClubDetails,
  joinClub,
  createClubPost,
  getClubPosts,
  deleteClubPost,
  getClubMessages,
  sendClubMessage,
  createClubEvent,
  getClubEvents
} from '../controllers/clubController';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', protect as RequestHandler, getClubs as RequestHandler);
router.post('/create', protect as RequestHandler, upload.single('profile_image'), createClub as RequestHandler);
router.get('/:id', protect as RequestHandler, getClubDetails as RequestHandler);
router.post('/join/:id', protect as RequestHandler, joinClub as RequestHandler);
router.get('/:id/posts', protect as RequestHandler, getClubPosts as RequestHandler);
router.post('/:id/posts', protect as RequestHandler, upload.single('image'), createClubPost as RequestHandler);
router.delete('/:id/posts/:postId', protect as RequestHandler, deleteClubPost as RequestHandler);
router.get('/:id/messages', protect as RequestHandler, getClubMessages as RequestHandler);
router.post('/:id/messages', protect as RequestHandler, sendClubMessage as RequestHandler);
router.get('/:id/events', protect as RequestHandler, getClubEvents as RequestHandler);
router.post('/:id/events', protect as RequestHandler, upload.single('image'), createClubEvent as RequestHandler);

export default router;
