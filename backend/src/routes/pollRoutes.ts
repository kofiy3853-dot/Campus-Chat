import express, { RequestHandler } from 'express';
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
router.use(protect as RequestHandler);

// Poll CRUD operations
router.post('/', messageRateLimiter as RequestHandler, createPoll as RequestHandler); // Create poll
router.get('/feed', getPollFeed as RequestHandler); // Get feed of polls
router.get('/user/:userId', getUserPolls as RequestHandler); // Get user's polls
router.get('/:pollId', getPoll as RequestHandler); // Get single poll

// Voting and results
router.post('/:pollId/vote', messageRateLimiter as RequestHandler, votePoll as RequestHandler); // Vote on poll
router.get('/:pollId/results', getPollResults as RequestHandler); // Get poll results

// Reporting and moderation
router.post('/:pollId/report', messageRateLimiter as RequestHandler, reportPoll as RequestHandler); // Report poll
router.delete('/:pollId', deletePoll as RequestHandler); // Delete poll (creator or admin)

export default router;
