import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getEvents, createEvent, joinEvent, leaveEvent } from '../controllers/eventController';

const router = express.Router();

router.get('/', protect, getEvents);
router.post('/', protect, createEvent);
router.post('/:id/join', protect, joinEvent);
router.post('/:id/leave', protect, leaveEvent);

export default router;
