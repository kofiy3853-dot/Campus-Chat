import express from 'express';
import { 
  createListing, 
  getListings, 
  getMyListings, 
  updateListingStatus, 
  deleteListing 
} from '../controllers/marketplaceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getListings);
router.get('/my', protect, getMyListings);
router.post('/', protect, createListing);
router.patch('/:id/status', protect, updateListingStatus);
router.delete('/:id', protect, deleteListing);

export default router;
