import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';
import {
  getInternships,
  createInternship,
  toggleSaveInternship,
  getSavedInternships,
  deleteInternship,
  applyToInternship
} from '../controllers/internshipController';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', protect, getInternships);
router.post('/create', protect, createInternship);
router.post('/save/:id', protect, toggleSaveInternship);
router.get('/saved', protect, getSavedInternships);
router.post('/apply/:id', protect, upload.single('resume'), applyToInternship);
router.delete('/:id', protect, deleteInternship);

export default router;
