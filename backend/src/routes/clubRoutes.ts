import express from 'express';
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

router.get('/', protect, getClubs);
router.post('/create', protect, upload.single('profile_image'), createClub);
router.get('/:id', protect, getClubDetails);
router.post('/join/:id', protect, joinClub);
router.get('/:id/posts', protect, getClubPosts);
router.post('/:id/posts', protect, upload.single('image'), createClubPost);
router.delete('/:id/posts/:postId', protect, deleteClubPost);
router.get('/:id/messages', protect, getClubMessages);
router.post('/:id/messages', protect, sendClubMessage);
router.get('/:id/events', protect, getClubEvents);
router.post('/:id/events', protect, upload.single('image'), createClubEvent);

export default router;
