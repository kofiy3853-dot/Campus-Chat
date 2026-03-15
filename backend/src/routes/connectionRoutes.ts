import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  sendConnectionRequest, 
  respondToConnectionRequest, 
  getIncomingRequests,
  getConnectionStatus
} from '../controllers/connectionController';

const router = express.Router();

router.post('/request', protect, sendConnectionRequest);
router.post('/respond', protect, respondToConnectionRequest);
router.get('/incoming', protect, getIncomingRequests);
router.get('/status/:userId', protect, getConnectionStatus);

export default router;
