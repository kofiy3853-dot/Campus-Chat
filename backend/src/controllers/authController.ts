import { Request, Response } from 'express';
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
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        level: user.level,
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

export const getProfile = async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select('-password_hash');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  const { name, department, level, profile_picture } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.department = department || user.department;
      user.level = level || user.level;
      user.profile_picture = profile_picture || user.profile_picture;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        student_id: updatedUser.student_id,
        department: updatedUser.department,
        level: updatedUser.level,
        profile_picture: updatedUser.profile_picture,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const searchUsers = async (req: any, res: Response) => {
  const query = req.query.query as string;

  if (!query) {
    return res.json([]);
  }

  try {
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { student_id: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    })
      .select('-password_hash')
      .limit(10);

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const userId = (req as any).user._id;
    const imageUrl = `/uploads/${req.file.filename}`;

    const user = await User.findById(userId).select('-password_hash');
    if (!user) {
      fs.unlinkSync(req.file.path);
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
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
};
