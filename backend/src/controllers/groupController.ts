import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import Group from '../models/Group';
import Message from '../models/Message';
import GroupMessage from '../models/GroupMessage';
import Notification from '../models/Notification';
import { io } from '../server';
import { createNotification } from './notificationController';

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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const messages = await GroupMessage.find({ group_id: groupId })
      .populate('sender_id', 'name profile_picture')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
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
    const populatedMessage: any = await GroupMessage.findById(message._id)
      .populate('sender_id', 'name profile_picture');
    
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
    const groups = await Group.find({
      members: { $ne: req.user.id },
    })
    .populate('members', 'name profile_picture')
    .sort({ createdAt: -1 })
    .limit(10);

    res.set('Cache-Control', 'public, max-age=60');
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

    res.set('Cache-Control', 'public, max-age=60');
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

// Delete group message (soft delete)
export const deleteGroupMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;

  try {
    const message = await GroupMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if ((message.sender_id as any).toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Soft delete
    await GroupMessage.findByIdAndUpdate(messageId, {
      is_deleted: true,
      deleted_at: new Date()
    });

    // Broadcast deletion
    io.to(message.group_id.toString()).emit('group_message_deleted', {
      messageId: message._id,
      roomId: message.group_id.toString()
    });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    console.error(`[GroupController] Error deleting message ${messageId}:`, error.message);
    res.status(500).json({ message: error.message });
  }
};
