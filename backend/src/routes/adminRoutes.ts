import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import { getAllUsers, deleteUser, banUser, promoteUser, getStats } from '../controllers/adminController';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.get('/stats', getStats);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/promote', promoteUser);

export default router;
