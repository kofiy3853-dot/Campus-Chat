import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getLeaderboards } from '../controllers/leaderboardController';

const router = express.Router();

router.get('/', protect, getLeaderboards);

export default router;
