import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getConfessions,
  postConfession,
  toggleLike,
  reportConfession,
  getComments,
  addComment,
  deleteConfession,
  banUser,
} from '../controllers/confessionController';

const router = express.Router();

router.get('/', protect, getConfessions);
router.post('/', protect, postConfession);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/report', protect, reportConfession);
router.get('/:id/comments', protect, getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deleteConfession);
router.post('/:id/ban', protect, banUser);

export default router;
