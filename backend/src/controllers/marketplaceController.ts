import { Response } from 'express';
import { AuthRequest } from '../types/express';
import MarketplaceItem from '../models/MarketplaceItem';
import mongoose from 'mongoose';

export const createListing = async (req: AuthRequest, res: Response) => {
  const { title, description, price, image_url, category } = req.body;

  try {
    const item = await MarketplaceItem.create({
      title,
      description,
      price,
      image_url,
      category,
      seller_id: req.user.id,
    });

    const populatedItem = await MarketplaceItem.findById(item._id).populate('seller_id', 'name profile_picture status');
    res.status(201).json(populatedItem);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getListings = async (req: AuthRequest, res: Response) => {
  const { category, search } = req.query;
  const filter: any = { status: 'available' };

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
    const items = await MarketplaceItem.find(filter)
      .populate('seller_id', 'name profile_picture status')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const items = await MarketplaceItem.find({ seller_id: req.user.id })
      .populate('seller_id', 'name profile_picture status')
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
    const item = await MarketplaceItem.findOneAndUpdate(
      { _id: id, seller_id: req.user.id },
      { status },
      { returnDocument: 'after' }
    ).populate('seller_id', 'name profile_picture status');

    if (!item) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const item = await MarketplaceItem.findOneAndDelete({ _id: id, seller_id: req.user.id });
    if (!item) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
