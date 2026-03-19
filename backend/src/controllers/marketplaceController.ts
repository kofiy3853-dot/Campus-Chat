import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Product from '../models/Product';
import mongoose from 'mongoose';
import { uploadToFirebaseStorage } from '../services/cloudinaryService';

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    console.log("=== CREATE LISTING START ===");
    console.log("USER AUTH CHECK:", req.user);
    
    if (!req.user) {
      console.log("❌ No user found in request");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    console.log("FILES:", req.files);

    if (!req.files || req.files.length === 0) {
      console.log("❌ No images uploaded");
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Upload all images to Firebase Storage
    const imageUrls = [];
    for (const file of (req.files as Express.Multer.File[])) {
      console.log("✅ Uploading image:", file.originalname);
      const imageUrl = await uploadToFirebaseStorage(file.buffer, file.originalname, 'marketplace');
      imageUrls.push(imageUrl);
    }
    console.log("✅ All images uploaded:", imageUrls);

    const listing = await Product.create({
      title: req.body.title,
      price: req.body.price,
      category: req.body.category,
      image: imageUrls, // Store array of image URLs
      sellerId: req.user._id,
    });

    console.log("✅ Listing created:", listing);

    // Populate seller info
    const populatedListing = await Product.findById(listing._id).populate('sellerId', 'name profile_picture status');
    console.log("✅ Listing populated:", populatedListing);

    res.status(201).json(populatedListing);
  } catch (error: any) {
    console.error("❌ CREATE LISTING ERROR:");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      message: "Failed to create listing",
      error: error.message,
    });
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
