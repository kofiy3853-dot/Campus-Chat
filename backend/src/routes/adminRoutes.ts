import express, { RequestHandler } from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import { getAllUsers, deleteUser, banUser, promoteUser, getStats } from '../controllers/adminController';

const router = express.Router();

router.use(protect as RequestHandler, adminOnly as RequestHandler);

router.get('/users', getAllUsers as RequestHandler);
router.get('/stats', getStats as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);
router.patch('/users/:id/ban', banUser as RequestHandler);
router.patch('/users/:id/promote', promoteUser as RequestHandler);

export default router;
