import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Product from '../models/Product';
import mongoose from 'mongoose';

export const createListing = async (req: AuthRequest, res: Response) => {
  const { title, price, category } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  if (!image) {
    return res.status(400).json({ message: 'Image upload is required' });
  }

  try {
    const item = await Product.create({
      title,
      price,
      image,
      category,
      sellerId: req.user.id,
    });

    const populatedItem = await Product.findById(item._id).populate('sellerId', 'name profile_picture status');
    res.status(201).json(populatedItem);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getListings = async (req: AuthRequest, res: Response) => {
  const { category, search } = req.query;
  const filter: any = {}; // Removed 'available' status filter as it's not in the new schema yet

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
    let items = await Product.find(filter)
      .populate('sellerId', 'name profile_picture status')
      .sort({ createdAt: -1 });

    // Seed "Banku and egg" if no items exist (for demo purposes)
    if (items.length === 0 && !category && !search) {
       const User = mongoose.model('User');
       const seller = await User.findOne(); // Get any user as seller
       if (seller) {
         const seeded = await Product.create({
           title: "Banku and egg",
           price: 200,
           category: "Food",
           image: "/uploads/banku.jpg",
           sellerId: seller._id
         });
         const populated = await Product.findById(seeded._id).populate('sellerId', 'name profile_picture status');
         if (populated) items = [populated];
       }
    }

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const items = await Product.find({ sellerId: req.user.id })
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
      { _id: id, sellerId: req.user.id },
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
    const item = await Product.findOneAndDelete({ _id: id, sellerId: req.user.id });
    if (!item) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
