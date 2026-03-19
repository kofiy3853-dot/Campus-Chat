import express from 'express';
import multer from 'multer';
import { 
  createListing, 
  getListings, 
  getMyListings, 
  updateListingStatus, 
  deleteListing 
} from '../controllers/marketplaceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  console.log('[MARKETPLACE TEST] Route is working');
  res.json({ message: 'Marketplace routes are working' });
});

// Multer config for multiple file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB max, up to 5 files
});

router.get('/', protect, getListings);
router.get('/my', protect, getMyListings);
router.post('/', protect, upload.array('images', 5), createListing);
router.patch('/:id/status', protect, updateListingStatus);
router.delete('/:id', protect, deleteListing);

export default router;
