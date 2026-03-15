import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import LostFoundPost from '../models/LostFoundPost';
import LostFoundReport from '../models/LostFoundReport';
import User from '../models/User';

// Create a lost/found post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, status, location, date, image_url, image_thumbnail } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !description || !category || !status || !location?.building || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['electronics', 'stationery', 'personal', 'miscellaneous'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (!['lost', 'found'].includes(status)) {
      return res.status(400).json({ message: 'Status must be lost or found' });
    }

    // Validate date is not in future
    if (new Date(date) > new Date()) {
      return res.status(400).json({ message: 'Date cannot be in the future' });
    }

    const post = await LostFoundPost.create({
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      location: {
        building: location.building.trim(),
        room: location.room ? location.room.trim() : undefined,
      },
      date: new Date(date),
      image_url: image_url || null,
      image_thumbnail: image_thumbnail || null,
      creator: userId,
    });

    const populatedPost = await LostFoundPost.findById(post._id).populate('creator', 'name profile_picture');

    res.status(201).json(populatedPost);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: error.message || 'Failed to create post' });
  }
};

// Get all posts (paginated, with filters)
export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');
    const statusFilter = (req.query.status as string) || '';
    const categoryFilter = (req.query.category as string) || '';
    const searchFilter = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const query: any = { is_deleted: false };

    if (statusFilter && ['lost', 'found'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    if (categoryFilter && ['electronics', 'stationery', 'personal', 'miscellaneous'].includes(categoryFilter)) {
      query.category = categoryFilter;
    }

    if (searchFilter) {
      query.$or = [
        { title: { $regex: searchFilter, $options: 'i' } },
        { description: { $regex: searchFilter, $options: 'i' } },
        { 'location.building': { $regex: searchFilter, $options: 'i' } },
      ];
    }

    const posts = await LostFoundPost.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profile_picture');

    const total = await LostFoundPost.countDocuments(query);

    res.json({
      data: posts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch posts' });
  }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await LostFoundPost.findById(postId).populate('creator', 'name profile_picture');

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error: any) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch post' });
  }
};

// Update post
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { title, description, category, status, location, date, image_url, image_thumbnail, is_resolved } = req.body;
    const userId = req.user._id;

    const post = await LostFoundPost.findById(postId);
    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is creator or admin
    const isCreator = (post.creator as any).toString() === userId.toString();
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only post creator or admin can update' });
    }

    // Validate inputs if provided
    if (category && !['electronics', 'stationery', 'personal', 'miscellaneous'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (status && !['lost', 'found'].includes(status)) {
      return res.status(400).json({ message: 'Status must be lost or found' });
    }

    if (date && new Date(date) > new Date()) {
      return res.status(400).json({ message: 'Date cannot be in the future' });
    }

    // Update fields
    if (title) post.title = title.trim();
    if (description) post.description = description.trim();
    if (category) post.category = category;
    if (status) post.status = status;
    if (location) {
      post.location.building = location.building?.trim() || post.location.building;
      post.location.room = location.room ? location.room.trim() : post.location.room;
    }
    if (date) post.date = new Date(date);
    if (image_url !== undefined) post.image_url = image_url;
    if (image_thumbnail !== undefined) post.image_thumbnail = image_thumbnail;

    // Handle resolution
    if (is_resolved !== undefined) {
      post.is_resolved = is_resolved;
      if (is_resolved) {
        post.resolved_date = new Date();
      } else {
        post.resolved_date = undefined;
      }
    }

    await post.save();
    const updatedPost = await LostFoundPost.findById(postId).populate('creator', 'name profile_picture');

    res.json(updatedPost);
  } catch (error: any) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: error.message || 'Failed to update post' });
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await LostFoundPost.findById(postId);
    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is creator or admin
    const isCreator = (post.creator as any).toString() === userId.toString();
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only post creator or admin can delete' });
    }

    post.is_deleted = true;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: error.message || 'Failed to delete post' });
  }
};

// Get user's posts
export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page_str = (req.query.page as string) || '1';
    const limit_str = (req.query.limit as string) || '10';
    const skip = (parseInt(page_str) - 1) * parseInt(limit_str);

    const posts = await LostFoundPost.find({ creator: userId, is_deleted: false })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit_str))
      .populate('creator', 'name profile_picture');

    const total = await LostFoundPost.countDocuments({ creator: userId, is_deleted: false });

    res.json({
      data: posts,
      pagination: {
        current_page: parseInt(page_str),
        total_pages: Math.ceil(total / parseInt(limit_str)),
        total_count: total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch user posts' });
  }
};

// Report a post
export const reportPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;

    const post = await LostFoundPost.findById(postId);
    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already reported this post
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const existingReport = await LostFoundReport.findOne({ 
      post: postIdStr, 
      reported_by: userId 
    });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    const report = await LostFoundReport.create({
      post: postIdStr,
      reported_by: userId,
      reason,
      description,
    });

    res.status(201).json({ message: 'Post reported successfully', report });
  } catch (error: any) {
    console.error('Error reporting post:', error);
    res.status(500).json({ message: error.message || 'Failed to report post' });
  }
};

// Increment contact count
export const incrementContactCount = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;

    const post = await LostFoundPost.findByIdAndUpdate(
      postIdStr,
      { $inc: { contact_count: 1 } },
      { new: true }
    ).populate('creator', 'name profile_picture email');

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      message: 'Contact recorded',
      post,
      poster_email: (post.creator as any).email,
    });
  } catch (error: any) {
    console.error('Error incrementing contact:', error);
    res.status(500).json({ message: error.message || 'Failed to record contact' });
  }
};

// Resolve a post
export const resolvePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await LostFoundPost.findById(postId);
    if (!post || post.is_deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is creator or admin
    const isCreator = (post.creator as any).toString() === userId.toString();
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only post creator or admin can resolve' });
    }

    post.is_resolved = true;
    post.resolved_date = new Date();
    await post.save();

    res.json({ message: 'Post marked as resolved', post });
  } catch (error: any) {
    console.error('Error resolving post:', error);
    res.status(500).json({ message: error.message || 'Failed to resolve post' });
  }
};



