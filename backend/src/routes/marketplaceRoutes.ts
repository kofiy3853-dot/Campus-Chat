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

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', protect, getListings);
router.get('/my', protect, getMyListings);
router.post('/', protect, upload.single('image'), createListing);
router.patch('/:id/status', protect, updateListingStatus);
router.delete('/:id', protect, deleteListing);

export default router;
