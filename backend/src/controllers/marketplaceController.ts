import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Product from '../models/Product';
import mongoose from 'mongoose';
import { uploadToFirebaseStorage } from '../services/cloudinaryService';

export const createListing = async (req: AuthRequest, res: Response) => {
  const { title, price, category } = req.body;
  
  try {
    console.log('[MARKETPLACE DEBUG] Request body:', { title, price, category });
    console.log('[MARKETPLACE DEBUG] File exists:', !!req.file);
    console.log('[MARKETPLACE DEBUG] User ID:', req.user._id);

    if (!req.file) {
      console.log('[MARKETPLACE DEBUG] No file uploaded');
      return res.status(400).json({ message: 'Image upload is required' });
    }

    console.log('[MARKETPLACE DEBUG] Starting file upload...');
    // Upload to Cloudinary
    const image = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'marketplace');
    console.log('[MARKETPLACE DEBUG] File uploaded successfully:', image);

    console.log('[MARKETPLACE DEBUG] Creating product...');
    const item = await Product.create({
      title,
      price,
      image,
      category,
      sellerId: req.user._id,
    });
    console.log('[MARKETPLACE DEBUG] Product created:', item._id);

    console.log('[MARKETPLACE DEBUG] Populating seller...');
    const populatedItem = await Product.findById(item._id).populate('sellerId', 'name profile_picture status');
    console.log('[MARKETPLACE DEBUG] Item populated successfully');
    
    res.status(201).json(populatedItem);
  } catch (error: any) {
    console.error('[MARKETPLACE ERROR]', error);
    res.status(500).json({ message: error.message });
  }
};

export const getListings = async (req: AuthRequest, res: Response) => {
  const { category, search } = req.query;
  const filter: any = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const items = await Product.find(filter)
      .populate('sellerId', 'name profile_picture status')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const items = await Product.find({ sellerId: req.user._id })
      .populate('sellerId', 'name profile_picture status')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateListingStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Note: status is not in the user's schema, so this might need updating or adding to ProductSchema
    const item = await Product.findOneAndUpdate(
      { _id: id, sellerId: req.user._id },
      { status },
      { returnDocument: 'after' }
    ).populate('sellerId', 'name profile_picture status');

    if (!item) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const item = await Product.findOneAndDelete({ _id: id, sellerId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
