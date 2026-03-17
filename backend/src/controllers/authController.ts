import { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { awardPoints, checkDailyLogin } from '../services/pointService';
import { AuthRequest } from '../types/express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import path from 'path';
import fs from 'fs';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, student_id, password, department, level } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { student_id }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      student_id,
      password_hash: password, // Pre-save hook will hash this
      department,
      level,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        level: user.level,
        tick_color: user.tick_color,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log('[Auth] Login attempt started');
  console.log('[Auth] Headers:', req.headers);
  console.log('[Auth] Body Type:', typeof req.body);
  console.log('[Auth] Body Keys:', req.body ? Object.keys(req.body) : 'NONE');

  if (!req.body) {
    console.error('[Auth] Missing request body');
    return res.status(400).json({ message: 'Missing request body' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    console.error('[Auth] Missing email or password in body');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  console.log(`[Auth] Login attempt for: ${email}`);

  try {
    console.log('[Auth] Querying database for user...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`[Auth] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[Auth] User found: ${user.email}, comparing passwords...`);
    const isMatch = await user.comparePassword(password);
    console.log(`[Auth] Password match result: ${isMatch}`);

    if (isMatch) {
      console.log('[Auth] Generating token...');
      const userId = (user._id as any).toString();
      const token = generateToken(userId);
      console.log('[Auth] Token generated successfully');
      
      // Check for daily login points
      const shouldAwardLoginPoints = await checkDailyLogin(userId);
      if (shouldAwardLoginPoints) {
        await awardPoints(userId, 5, 'DAILY_LOGIN');
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        level: user.level,
        tick_color: user.tick_color,
        token,
      });
    } else {
      console.log('[Auth] Password mismatch');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('--- LOGIN ERROR ---');
    console.error('Email:', email);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('-------------------');
    res.status(500).json({ 
      message: error.message || 'Internal Server Error during login',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user.id).select('-password_hash');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, department, level, profile_picture, tick_color } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.department = department || user.department;
      user.level = level || user.level;
      user.profile_picture = profile_picture || user.profile_picture;
      user.tick_color = tick_color || user.tick_color;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        student_id: updatedUser.student_id,
        department: updatedUser.department,
        level: updatedUser.level,
        profile_picture: updatedUser.profile_picture,
        tick_color: updatedUser.tick_color,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const searchUsers = async (req: AuthRequest, res: Response) => {
  const query = req.query.query as string;
  const currentUserId = req.user.id;

  if (!query) {
    return res.json([]);
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { student_id: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: currentUserId } // Exclude current user from search
    })
      .select('-password_hash')
      .limit(10);

    // Fetch connection status for each user
    const Connection = mongoose.model('Connection');
    const userIds = users.map(u => u._id);
    
    const connections = await Connection.find({
      $or: [
        { sender: currentUserId, recipient: { $in: userIds } },
        { recipient: currentUserId, sender: { $in: userIds } }
      ]
    });

    const usersWithStatus = users.map(user => {
      const conn = connections.find((c: any) => 
        (c.sender.toString() === currentUserId && c.recipient.toString() === user._id.toString()) ||
        (c.recipient.toString() === currentUserId && c.sender.toString() === user._id.toString())
      );
      
      return {
        ...user.toObject(),
        connection_status: conn ? conn.status : 'none',
        connection_id: conn ? conn._id : null,
        is_sender: conn ? conn.sender.toString() === currentUserId : false
      };
    });

    res.json(usersWithStatus);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { uploadToCloudinary } from '../services/cloudinaryService';

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const userId = (req as any).user._id;
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'profiles');

    const user = await User.findById(userId).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profile_picture = imageUrl;
    await user.save();

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        level: user.level,
        profile_picture: user.profile_picture,
        tick_color: user.tick_color,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash -blocked_users -notification_preferences -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password_hash = newPassword; // the pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
