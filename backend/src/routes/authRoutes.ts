import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { register, login, getProfile, updateProfile, searchUsers, uploadProfilePicture, getUserProfile, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Multer config for Cloudinary (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/profile-picture', protect, upload.single('image'), uploadProfilePicture);
router.get('/search', protect, searchUsers);

export default router;
