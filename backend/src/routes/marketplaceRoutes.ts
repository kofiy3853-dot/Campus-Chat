import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  createListing, 
  getListings, 
  getMyListings, 
  updateListingStatus, 
  deleteListing 
} from '../controllers/marketplaceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Standardizing to public/uploads/ as served in server.ts
    const uploadPath = path.join(process.cwd(), 'public/uploads/');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', protect, getListings);
router.get('/my', protect, getMyListings);
router.post('/', protect, upload.single('image'), createListing);
router.patch('/:id/status', protect, updateListingStatus);
router.delete('/:id', protect, deleteListing);

export default router;
