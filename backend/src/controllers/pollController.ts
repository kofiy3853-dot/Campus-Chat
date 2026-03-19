import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import Poll from '../models/Poll';
import PollVote from '../models/PollVote';
import PollReport from '../models/PollReport';
import User from '../models/User';
import { io } from '../server';

// Create a new poll
export const createPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { question, options, expires_at, is_anonymous, hide_results_until_voted } = req.body;
    const userId = req.user._id;

    // Validation
    if (!question || !options || options.length < 2 || options.length > 5) {
      return res.status(400).json({ message: 'Poll must have 2-5 options' });
    }

    if (options.some((opt: any) => !opt || opt.trim().length === 0)) {
      return res.status(400).json({ message: 'All options must have text' });
    }

    const duplicateOptions = new Set(options.map((opt: any) => opt.toLowerCase()));
    if (duplicateOptions.size !== options.length) {
      return res.status(400).json({ message: 'Duplicate options are not allowed' });
    }

    // Validate expiration date
    if (expires_at) {
      const expiryDate = new Date(expires_at);
      if (expiryDate <= new Date()) {
        return res.status(400).json({ message: 'Expiration date must be in the future' });
      }
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: options.map((opt: string) => ({ text: opt.trim(), votes: 0 })),
      creator: userId,
      expires_at: expires_at ? new Date(expires_at) : undefined,
      is_anonymous: is_anonymous || false,
      hide_results_until_voted: hide_results_until_voted || false,
    });

    const populatedPoll = await Poll.findById(poll._id).populate('creator', 'name profile_picture');

    // Emit real-time event
    io.emit('new_poll', populatedPoll);

    res.status(201).json(populatedPoll);
  } catch (error: any) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: error.message || 'Failed to create poll' });
  }
};

// Get poll feed (paginated)
export const getPollFeed = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');
    const sort = (req.query.sort as string) || 'newest';
    const skip = (page - 1) * limit;

    const now = new Date();
    
    // Update expired polls
    await Poll.updateMany(
      { expires_at: { $lt: now }, status: 'active' },
      { status: 'expired' }
    );

    let sortQuery: any = {};
    if (sort === 'trending') {
      sortQuery = { total_votes: -1, created_at: -1 };
    } else {
      sortQuery = { created_at: -1 };
    }

    const polls = await Poll.find({ is_deleted: false, status: { $ne: 'closed' } })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profile_picture');

    const total = await Poll.countDocuments({ is_deleted: false, status: { $ne: 'closed' } });

    // For each poll, check if current user has voted
    const pollsWithVoteStatus = await Promise.all(
      polls.map(async (poll) => {
        const userVote = await PollVote.findOne({ poll: poll._id, user: req.user._id });
        return {
          ...poll.toObject(),
          has_voted: !!userVote,
          user_vote: userVote ? userVote.selected_option : null,
        };
      })
    );

    res.json({
      data: pollsWithVoteStatus,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch polls' });
  }
};

// Get single poll with results
export const getPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId).populate('creator', 'name profile_picture');

    if (!poll || poll.is_deleted) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if expired
    if (poll.expires_at && poll.expires_at < new Date() && poll.status === 'active') {
      poll.status = 'expired';
      await poll.save();
    }

    // Check if user has voted
    const userVote = await PollVote.findOne({ poll: new mongoose.Types.ObjectId(pollId as string), user: userId });

    // Calculate results
    const results = poll.options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
      votes: opt.votes,
      percentage: poll.total_votes > 0 ? ((opt.votes / poll.total_votes) * 100).toFixed(1) : '0.0',
    }));

    // Determine if results should be shown
    const shouldShowResults = !poll.hide_results_until_voted || !!userVote;

    res.json({
      ...poll.toObject(),
      results: shouldShowResults ? results : null,
      has_voted: !!userVote,
      user_vote: userVote ? userVote.selected_option : null,
      can_vote: poll.status === 'active',
    });
  } catch (error: any) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch poll' });
  }
};

// Vote on a poll
export const votePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId } = req.params;
    const { selected_option } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll || poll.is_deleted) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return res.status(400).json({ message: 'Poll is no longer active' });
    }

    // Check if poll has expired
    if (poll.expires_at && poll.expires_at < new Date()) {
      poll.status = 'expired';
      await poll.save();
      return res.status(400).json({ message: 'Poll has expired' });
    }

    // Validate option index
    if (!selected_option || isNaN(selected_option) || selected_option < 0 || selected_option >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Check if user already voted
    const existingVote = await PollVote.findOne({ poll: new mongoose.Types.ObjectId(pollId as string), user: userId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // Create vote
    const vote = await PollVote.create({
      poll: new mongoose.Types.ObjectId(pollId as string),
      user: userId,
      selected_option,
    });

    // Update poll vote count
    poll.options[selected_option].votes += 1;
    poll.total_votes += 1;
    await poll.save();

    // Get updated results
    const results = poll.options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
      votes: opt.votes,
      percentage: poll.total_votes > 0 ? ((opt.votes / poll.total_votes) * 100).toFixed(1) : '0.0',
    }));

    // Emit real-time event for the update
    io.emit('poll_updated', { pollId, poll: { ...poll.toObject(), results } });

    res.json({
      message: 'Vote recorded',
      poll: {
        ...poll.toObject(),
        results,
        has_voted: true,
        user_vote: selected_option,
      },
    });
  } catch (error: any) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: error.message || 'Failed to vote on poll' });
  }
};

// Get poll results (without voting requirement)
export const getPollResults = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll || poll.is_deleted) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const userVote = await PollVote.findOne({ poll: new mongoose.Types.ObjectId(pollId as string), user: userId });
    const shouldShowResults = !poll.hide_results_until_voted || !!userVote;

    const results = poll.options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
      votes: opt.votes,
      percentage: poll.total_votes > 0 ? ((opt.votes / poll.total_votes) * 100).toFixed(1) : '0.0',
    }));

    res.json({
      poll_id: poll._id,
      total_votes: poll.total_votes,
      results: shouldShowResults ? results : null,
      has_voted: !!userVote,
      can_view_results: shouldShowResults,
    });
  } catch (error: any) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch poll results' });
  }
};

// Report a poll
export const reportPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll || poll.is_deleted) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user already reported this poll
    const existingReport = await PollReport.findOne({ poll: new mongoose.Types.ObjectId(pollId as string), reported_by: userId });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this poll' });
    }

    const report = await PollReport.create({
      poll: new mongoose.Types.ObjectId(pollId as string),
      reported_by: userId,
      reason,
      description,
    });

    res.status(201).json({ message: 'Poll reported successfully', report });
  } catch (error: any) {
    console.error('Error reporting poll:', error);
    res.status(500).json({ message: error.message || 'Failed to report poll' });
  }
};

// Delete a poll (only creator or admin)
export const deletePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user is creator or admin
    const isCreator = (poll.creator as any).toString() === userId.toString();
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only poll creator or admin can delete' });
    }

    poll.is_deleted = true;
    await poll.save();

    // Emit removal
    io.emit('poll_removed', { pollId });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ message: error.message || 'Failed to delete poll' });
  }
};

// Get user's polls
export const getUserPolls = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');
    const skip = (page - 1) * limit;

    const polls = await Poll.find({ creator: userId, is_deleted: false })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profile_picture');

    const total = await Poll.countDocuments({ creator: userId, is_deleted: false });

    res.json({
      data: polls,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user polls:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch user polls' });
  }
};

