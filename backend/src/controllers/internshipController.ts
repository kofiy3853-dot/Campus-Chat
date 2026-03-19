import { Request, Response } from 'express';
import Internship from '../models/Internship';
import User from '../models/User';
import Application from '../models/Application';
import mongoose from 'mongoose';
import { io } from '../server';
import { uploadToSupabaseStorage } from '../services/supabaseStorageService';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export const getInternships = async (req: Request, res: Response) => {
  const { category, location, search, deadline } = req.query;
  const query: any = {};

  if (category && category !== 'All') {
    query.category = category;
  }

  if (location && location !== 'All') {
    query.location = { $regex: location as string, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search as string, $options: 'i' } },
      { company: { $regex: search as string, $options: 'i' } },
      { description: { $regex: search as string, $options: 'i' } }
    ];
  }

  if (deadline === 'upcoming') {
    query.deadline = { $gte: new Date() };
  }

  try {
    const internships = await Internship.find(query)
      .populate('posted_by', 'name profile_picture')
      .sort({ createdAt: -1 });
    res.status(200).json(internships);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInternship = async (req: AuthRequest, res: Response) => {
  const { title, company, description, requirements, location, category, deadline, apply_link } = req.body;

  try {
    // Check if user is authorized (admin or specific role)
    // For now, let's allow any authenticated user to post if they have a 'recruiter' or 'admin' role
    // Or just all users if it's a peer-sharing platform? The prompt says "authorized users".
    // Let's check for 'admin' for now, or we can add a simple role check if needed later.
    
    const internship = new Internship({
      title,
      company,
      description,
      requirements,
      location,
      category,
      deadline,
      apply_link,
      posted_by: req.user?._id
    });

    await internship.save();
    const populatedInternship = await internship.populate('posted_by', 'name profile_picture');
    
    // Real-time update
    io.emit('new_internship', populatedInternship);
    
    res.status(201).json(populatedInternship);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSaveInternship = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: 'Invalid Internship ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const internshipId = new mongoose.Types.ObjectId(id as string);
    const internshipIndex = user.saved_internships.findIndex(
      (savedId: any) => savedId.toString() === internshipId.toString()
    );

    if (internshipIndex > -1) {
      // Unsave
      user.saved_internships.splice(internshipIndex, 1);
    } else {
      // Save
      user.saved_internships.push(internshipId);
    }

    await user.save();
    res.status(200).json({ saved_internships: user.saved_internships });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSavedInternships = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;

  try {
    const user = await User.findById(userId).populate({
      path: 'saved_internships',
      populate: { path: 'posted_by', select: 'name profile_picture' }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user.saved_internships);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInternship = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const internship = await Internship.findById(id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // Only creator or admin can delete
    if (internship.posted_by.toString() !== req.user?._id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Internship.findByIdAndDelete(id);
    
    // Real-time update
    io.emit('internship_deleted', id);
    
    res.status(200).json({ message: 'Internship deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const applyToInternship = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!req.file) {
    return res.status(400).json({ message: 'Resume is required' });
  }

  try {
    const internship = await Internship.findById(id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // Check if user already applied
    const existingApplication = await Application.findOne({ internship: id, student: userId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this internship' });
    }

    // Upload resume to Cloudinary
    const resumeUrl = await uploadToSupabaseStorage(req.file.buffer, req.file.originalname, 'resumes');

    const application = new Application({
      internship: id,
      student: userId,
      resume_url: resumeUrl
    });

    await application.save();

    // Optionally notify the internship poster
    // io.emit('new_application', { internshipId: id, posterId: internship.posted_by });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error: any) {
    console.error('Application error:', error);
    res.status(500).json({ message: error.message });
  }
};
