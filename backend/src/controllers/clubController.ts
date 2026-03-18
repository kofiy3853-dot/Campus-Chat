import { Request, Response } from 'express';
import Club from '../models/Club';
import ClubPost from '../models/ClubPost';
import ClubMessage from '../models/ClubMessage';
import ClubEvent from '../models/ClubEvent';
import mongoose from 'mongoose';
import { io } from '../server';
import { uploadToFirebaseStorage } from '../services/cloudinaryService';

import { AuthRequest } from '../types/express';

export const createClub = async (req: AuthRequest, res: Response) => {
  const { name, category, description, visibility } = req.body;
  const userId = req.user?._id;

  try {
    let profile_image = '';
    if (req.file) {
      profile_image = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'clubs');
    }

    const club = await Club.create({
      name,
      category,
      description,
      visibility,
      profile_image,
      created_by: userId as any,
      admins: [userId] as any,
      members: [userId] as any
    });

    const populatedClub = await (club as any).populate('created_by', 'name profile_picture');
    io.emit('new_club', populatedClub);

    res.status(201).json(populatedClub);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClubs = async (req: Request, res: Response) => {
  const { category, search } = req.query;
  const query: any = { visibility: 'public' };

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const clubs = await Club.find(query)
      .populate('created_by', 'name profile_picture')
      .sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getClubDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const club = await Club.findById(id)
      .populate('admins', 'name profile_picture')
      .populate('members', 'name profile_picture')
      .populate('created_by', 'name profile_picture');

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json(club);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinClub = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  try {
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (club.members.includes(userId as any)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    club.members.push(userId as any);
    await club.save();

    res.json({ message: 'Joined successfully', club });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createClubPost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // club id
  const { title, content, type } = req.body;
  const userId = req.user?._id;

  try {
    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is member
    if (!club.members.includes(userId as any)) {
      return res.status(403).json({ message: 'Must be a member to post' });
    }

    let image = '';
    if (req.file) {
      image = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'club_posts');
    }

    const post = await ClubPost.create({
      club_id: id as any,
      title,
      content,
      type,
      image,
      posted_by: userId as any
    });

    const populatedPost = await (post as any).populate('posted_by', 'name profile_picture');
    
    // Emit to specific club room or globally for now if room logic not implemented
    io.emit(`new_club_post_${id}`, populatedPost);

    res.status(201).json(populatedPost);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClubPosts = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const posts = await ClubPost.find({ club_id: id })
      .populate('posted_by', 'name profile_picture')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClubPost = async (req: AuthRequest, res: Response) => {
  const { id, postId } = req.params;
  const userId = req.user?._id;

  try {
    const post = await ClubPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const club = await Club.findById(id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const isAuthor = post.posted_by.toString() === userId?.toString();
    const isAdmin = club.admins.some((a: any) => a.toString() === userId?.toString());

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await ClubPost.findByIdAndDelete(postId);
    io.emit(`delete_club_post_${id}`, { postId });

    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



export const getClubMessages = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  try {
    const club = await Club.findById(id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId as any)) {
      return res.status(403).json({ message: 'Must be a member to view chat' });
    }

    const messages = await ClubMessage.find({ club_id: id })
      .populate('sender_id', 'name profile_picture')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendClubMessage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message_text, message_type, media_url } = req.body;
  const userId = req.user?._id;

  try {
    const club = await Club.findById(id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId as any)) {
      return res.status(403).json({ message: 'Must be a member to chat' });
    }

    const message = await ClubMessage.create({
      club_id: id as any,
      sender_id: userId as any,
      message_text,
      message_type: message_type || 'text',
      media_url
    });

    const populatedMessage = await (message as any).populate('sender_id', 'name profile_picture');
    io.to(id).emit('receive_club_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createClubEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // club id
  const { title, description, date, location } = req.body;
  const userId = req.user?._id;

  try {
    const club = await Club.findById(id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Only admins can create events
    if (!club.admins.includes(userId as any)) {
      return res.status(403).json({ message: 'Only admins can create events' });
    }

    let image = '';
    if (req.file) {
      image = await uploadToFirebaseStorage(req.file.buffer, req.file.originalname, 'club_events');
    }

    const event = await ClubEvent.create({
      club_id: id as any,
      title,
      description,
      date,
      location,
      image,
      created_by: userId as any
    });

    const populatedEvent = await (event as any).populate('created_by', 'name profile_picture');
    io.emit(`new_club_event_${id}`, populatedEvent);

    res.status(201).json(populatedEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClubEvents = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const events = await ClubEvent.find({ club_id: id })
      .populate('created_by', 'name profile_picture')
      .sort({ date: 1 });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
