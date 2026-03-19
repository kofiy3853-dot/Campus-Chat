import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import Group from '../models/Group';
import Message from '../models/Message';
import GroupMessage from '../models/GroupMessage';
import Notification from '../models/Notification';
import { io } from '../server';
import { createNotification } from './notificationController';
import { awardPoints } from '../services/pointService';

export const createGroup = async (req: AuthRequest, res: Response) => {
  const { group_name, description, members, subject, schedule, max_members, visibility } = req.body;

  try {
    const group = await Group.create({
      group_name,
      description,
      subject,
      schedule,
      max_members: max_members || 50,
      visibility: visibility || 'public',
      admins: [req.user.id],
      members: [...(members || []), req.user.id],
      created_by: req.user.id,
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({
      members: userId,
    }).populate('members', 'name profile_picture status');

    // Fetch unread notification counts for these groups
    const unreadNotifications = await Notification.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId as string),
          type: 'message',
          read: false,
          'data.group_id': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$data.group_id',
          count: { $sum: 1 }
        }
      }
    ]);

    const groupsWithUnread = groups.map(group => {
      const groupObj = group.toObject();
      const unread = unreadNotifications.find(n => n._id?.toString() === group._id.toString());
      return {
        ...groupObj,
        unread_count: unread ? unread.count : 0
      };
    });

    res.json(groupsWithUnread);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user.id)) {
      group.members.push(req.user.id);
      await group.save();
      // Award points for joining a group
      await awardPoints(req.user.id, 10, 'GROUP_JOIN', { groupId });
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const messages = await GroupMessage.find({ 
      group_id: groupId,
    })
      .populate('sender_id', 'name profile_picture')
      .populate({
        path: 'reply_to',
        populate: { path: 'sender_id', select: 'name' }
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendGroupMessage = async (req: any, res: Response) => {
  const { groupId, message_text, media_url, replyTo } = req.body;

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
      reply_to: replyTo || undefined,
    });

    // Populate sender info for real-time broadcast
    const populatedMessage: any = await GroupMessage.findById(message._id)
      .populate('sender_id', 'name profile_picture')
      .populate({
        path: 'reply_to',
        populate: { path: 'sender_id', select: 'name' }
      });
    
    const group = await Group.findByIdAndUpdate(groupId, {
      last_message: message._id,
      last_message_time: new Date(),
    });

    if (group) {
      // Trigger notifications for all group members except sender
      const notificationTitle = `New message in ${group.group_name}`;
      const notificationBody = `${populatedMessage?.sender_id?.name || 'Someone'}: ${message_text || 'Sent an attachment'}`;
      
      group.members.forEach((memberId: any) => {
        if (memberId.toString() !== req.user.id.toString()) {
          createNotification(
            memberId.toString(),
            'message',
            notificationTitle,
            notificationBody,
            { group_id: groupId.toString() },
            req.user.id
          );
        }
      });
    }

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
    const userId = req.user.id;
    const { subject } = req.query;

    const filter: any = {
      visibility: 'public',
      members: { $ne: userId }
    };

    if (subject) {
      filter.subject = { $regex: subject, $options: 'i' };
    }

    const groups = await Group.find(filter)
      .populate('members', 'name profile_picture')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add resource to group
export const addGroupResource = async (req: AuthRequest, res: Response) => {
  const { groupId, title, url, type } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if user is member
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    group.resources.push({
      title,
      url,
      type: type || 'link',
      added_by: req.user.id,
      timestamp: new Date()
    });

    await group.save();
    
    // Award points for sharing a resource
    await awardPoints(req.user.id, 20, 'RESOURCE_POST', { groupId, resourceTitle: title });

    res.status(201).json(group.resources[group.resources.length - 1]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Schedule study session
export const scheduleStudySession = async (req: AuthRequest, res: Response) => {
  const { groupId, title, description, start_time, end_time, location } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if user is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can schedule sessions' });
    }

    group.study_sessions.push({
      title,
      description,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      location,
      created_by: req.user.id
    });

    await group.save();
    res.status(201).json(group.study_sessions[group.study_sessions.length - 1]);
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

    res.set('Cache-Control', 'public, max-age=60');
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add reaction to group message
export const addGroupMessageReaction = async (req: AuthRequest, res: Response) => {
  const { messageId: rawMessageId } = req.params;
  const messageId = Array.isArray(rawMessageId) ? rawMessageId[0] : rawMessageId;
  const { emoji } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: 'Invalid message ID format' });
  }

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

// Mark group messages as read
export const markGroupMessagesAsRead = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;

  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    // Mark corresponding notifications as read
    await Notification.updateMany(
      {
        user_id: req.user._id,
        'data.group_id': groupId.toString(),
        read: false,
      },
      { read: true, read_at: new Date() }
    );

    res.json({ message: 'Group messages marked as read' });
  } catch (error: any) {
    console.error(`[GroupController] Error in markGroupMessagesAsRead for ${groupId}:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete group message (hard delete)
export const deleteGroupMessage = async (req: AuthRequest, res: Response) => {
  const { id: rawId } = req.params;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid message ID format' });
  }

  try {
    const message = await GroupMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if ((message.sender_id as any).toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Hard delete
    await GroupMessage.findByIdAndDelete(id);

    // Broadcast deletion
    io.to(message.group_id.toString()).emit('group_message_deleted', {
      messageId: message._id,
      roomId: message.group_id.toString()
    });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error(`[GroupController] Error deleting message ${id}:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

// Mark a group message as helpful
export const markMessageHelpful = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const id = messageId as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid message ID format' });
  }

  try {
    const message = await GroupMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Check if user is member of the group
    const group = await Group.findOne({
      _id: message.group_id,
      members: req.user.id
    });

    if (!group) return res.status(403).json({ message: 'Unauthorized' });

    // Cannot mark your own message as helpful
    if (message.sender_id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot mark your own message as helpful' });
    }

    // Award points to the sender of the helpful message
    await awardPoints(message.sender_id.toString(), 30, 'HELPFUL_ANSWER', { 
      messageId: message._id, 
      groupId: message.group_id,
      markedBy: req.user.id
    });

    res.json({ message: 'Message marked as helpful' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Leave group
export const leaveGroup = async (req: any, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove member from group
    group.members = group.members.filter((id: any) => id.toString() !== userId.toString());

    // If no members left, delete the group? (Optional, following common patterns)
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.json({ message: 'Left group and group deleted as no members left' });
    }

    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
