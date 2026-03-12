import express from 'express';
import {
  createPoll,
  getPollFeed,
  getPoll,
  votePoll,
  getPollResults,
  reportPoll,
  deletePoll,
  getUserPolls,
} from '../controllers/pollController';
import { protect } from '../middleware/authMiddleware';
import { messageRateLimiter } from '../middleware/rateLimitMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

// Poll CRUD operations
router.post('/', messageRateLimiter, createPoll); // Create poll
router.get('/feed', getPollFeed); // Get feed of polls
router.get('/user/:userId', getUserPolls); // Get user's polls
router.get('/:pollId', getPoll); // Get single poll

// Voting and results
router.post('/:pollId/vote', messageRateLimiter, votePoll); // Vote on poll
router.get('/:pollId/results', getPollResults); // Get poll results

// Reporting and moderation
router.post('/:pollId/report', messageRateLimiter, reportPoll); // Report poll
router.delete('/:pollId', deletePoll); // Delete poll (creator or admin)

export default router;
