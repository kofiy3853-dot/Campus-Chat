import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import Group from '../models/Group';
import Message from '../models/Message';
import GroupMessage from '../models/GroupMessage';
import { io } from '../server';

export const createGroup = async (req: AuthRequest, res: Response) => {
  const { group_name, description, members } = req.body;

  try {
    const group = await Group.create({
      group_name,
      description,
      admins: [req.user.id],
      members: [...members, req.user.id],
      created_by: req.user.id,
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({
      members: req.user.id,
    }).populate('members', 'name profile_picture status');

    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.body;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user.id)) {
      group.members.push(req.user.id);
      await group.save();
    }

    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupMessages = async (req: AuthRequest, res: Response) => {
  const { groupId: rawGroupId } = req.params;
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    // Security check: Verify the user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      members: req.user.id
    });

    if (!group) {
      return res.status(403).json({ message: 'You are not authorized to view messages from this group' });
    }

    const messages = await GroupMessage.find({ group_id: groupId })
      .populate('sender_id', 'name profile_picture')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendGroupMessage = async (req: any, res: Response) => {
  const { groupId, message_text, media_url } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    const message = await GroupMessage.create({
      group_id: groupId,
      sender_id: req.user.id,
      message_text,
      message_type: req.body.message_type || 'text',
      media_url,
    });

    // Populate sender info for real-time broadcast
    const populatedMessage = await GroupMessage.findById(message._id)
      .populate('sender_id', 'name profile_picture');
    
    await Group.findByIdAndUpdate(groupId, {
      last_message: message._id,
      last_message_time: new Date(),
    });

    res.status(201).json(populatedMessage);
  } catch (error: any) {
    console.error(`--- [GroupController] FATAL Error in sendGroupMessage ---`);
    console.error(`Details:`, {
      sender: req.user?.id,
      groupId: req.body.groupId,
      message_text: req.body.message_text,
    });
    console.error(`Error Message:`, error.message);
    console.error(`Stack:`, error.stack);
    console.error(`-------------------------------------------------`);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const discoverGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({
      members: { $ne: req.user.id },
    })
    .populate('members', 'name profile_picture')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchGroups = async (req: AuthRequest, res: Response) => {
  const { query } = req.query;
  try {
    const groups = await Group.find({
      $or: [
        { group_name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    } as any).populate('members', 'name profile_picture');

    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add reaction to group message
export const addGroupMessageReaction = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  try {
    const message = await GroupMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is member of the group
    const group = await Group.findOne({
      _id: message.group_id,
      members: req.user.id
    });

    if (!group) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const existingReaction = message.reactions.find(
      (r: any) => r.userId.toString() === (req.user.id as any) && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction if already exists
      message.reactions = message.reactions.filter(
        (r: any) => !(r.userId.toString() === (req.user.id as any) && r.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        userId: req.user.id,
        emoji: emoji
      });
    }

    await message.save();

    // Broadcast reaction update
    io.to(message.group_id.toString()).emit('group_message_reaction', {
      messageId: message._id,
      reactions: message.reactions,
      roomId: message.group_id.toString(),
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
