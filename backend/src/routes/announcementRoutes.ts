import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', protect, createAnnouncement);
router.get('/', getAnnouncements);

export default router;
