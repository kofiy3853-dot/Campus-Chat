import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import Notification from '../models/Notification';
import { io } from '../server';
import { createNotification } from './notificationController';
import { logDetailedError } from '../utils/logger';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Aggregate messages to find all unique conversations for this user
    // sorted by the latest message timestamp
    const conversationSummaries = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender_id: userId },
            { receiver: userId },
            { recipient_id: userId }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$conversation_id",
          last_message: { $first: "$$ROOT" },
          last_message_time: { $first: "$timestamp" },
          unread_count: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$read", false] },
                    { 
                      $or: [
                        { $eq: ["$receiver", userId] },
                        { $eq: ["$recipient_id", userId] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { last_message_time: -1 }
      }
    ]);

    if (!conversationSummaries.length) {
      return res.json([]);
    }

    // Extract the conversation IDs
    const conversationIds = conversationSummaries.map(c => c._id);

    // Fetch the actual Conversation documents and populate participants
    const conversations = await Conversation.find({
      _id: { $in: conversationIds }
    })
    .populate('participants', 'name email profile_picture status last_seen')
    .populate('last_message');

    // Merge unread_count into the conversation objects
    const sortedConversations = conversationSummaries.map(summary => {
      if (!summary._id) return null; // Skip messages without a conversation_id
      const conv = conversations.find(c => c._id.toString() === summary._id.toString());
      if (!conv) return null;
      
      const convObj = conv.toObject();
      return {
        ...convObj,
        unread_count: summary.unread_count
      };
    }).filter(Boolean);

    res.json(sortedConversations);
  } catch (error: any) {
    console.error('Error in getConversations (Aggregation):', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;

  try {
    // Security check: Verify the user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({ message: 'You are not authorized to view this conversation' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation_id: conversationId })
      .populate('sender_id', 'name profile_picture')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { recipientId, message_text, message_type, media_url } = req.body;

  try {
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid or missing recipient ID' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
      });
    }

    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: req.user.id,
      recipient_id: recipientId, // For compatibility
      receiver: recipientId, // Explicitly requested
      message_text: message_text || '',
      message_type: message_type || 'text',
      media_url,
      read: false, // Explicitly requested
    });

    // Safer population
    await message.populate([
      { path: 'sender_id', select: 'name profile_picture' }
    ]);

    conversation.last_message = message._id as any;
    conversation.last_message_time = new Date();
    await conversation.save();

    // Trigger notification for recipient - wrap in try/catch since it's not awaited
    try {
      createNotification(
        recipientId,
        'message',
        `New message from ${req.user.name || 'Student'}`,
        message_text || (message_type === 'image' ? 'Sent an image' : message_type === 'voice' ? 'Sent a voice message' : 'Sent a file'),
        { conversation_id: conversation._id.toString() },
        req.user.id
      );
    } catch (notifErr) {
      console.error('[ChatController] Notification background error:', notifErr);
    }

    res.status(201).json(message);
  } catch (error: any) {
    logDetailedError('SEND_MESSAGE_FAILURE', error);
    res.status(500).json({ 
      message: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};
export const createConversation = async (req: AuthRequest, res: Response) => {
  const { participantId } = req.body;

  try {
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
    }).populate('participants', 'name email profile_picture status');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
      });
      conversation = await conversation.populate('participants', 'name email profile_picture status');
    }

    res.status(200).json(conversation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Search messages in a conversation
export const searchMessages = async (req: AuthRequest, res: Response) => {
  const { conversationId, query, messageType } = req.query;

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const searchFilter: any = {
      conversation_id: conversationId,
      is_deleted: false,
    };

    if (query) {
      searchFilter.message_text = { $regex: query, $options: 'i' };
    }

    if (messageType) {
      searchFilter.message_type = messageType;
    }

    const messages = await Message.find(searchFilter)
      .populate('sender_id', 'name profile_picture')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Edit message
export const editMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { message_text } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if ((message.sender_id as any).toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.message_text = message_text;
    message.edited_at = new Date();
    await message.save();

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message (hard delete)
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if ((message.sender_id as any).toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.is_deleted = true;
    message.deleted_at = new Date();
    await message.save();

    // Broadcast deletion
    io.to(message.conversation_id.toString()).emit('message_deleted', {
      messageId: message._id,
      roomId: message.conversation_id.toString()
    });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add reaction to message
export const addMessageReaction = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
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
    await message.populate('sender_id', 'name profile_picture');

    // Broadcast reaction update
    io.to(message.conversation_id.toString()).emit('message_reaction', {
      messageId: message._id,
      reactions: message.reactions,
      roomId: message.conversation_id.toString(),
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Block/Unblock user
export const blockUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isBlocked = user.blocked_users.some(id => id.toString() === userId);

    if (isBlocked) {
      user.blocked_users = user.blocked_users.filter(id => id.toString() !== userId);
    } else {
      user.blocked_users.push(new mongoose.Types.ObjectId(userId as string) as any);
    }

    await user.save();

    res.json({ 
      message: isBlocked ? 'User unblocked' : 'User blocked',
      blocked: !isBlocked 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get blocked users
export const getBlockedUsers = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blocked_users', 'name email profile_picture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.blocked_users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// Mark messages as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;

  try {
    if (!mongoose.isValidObjectId(conversationId)) {
      console.error(`[ChatController] Invalid conversationId: ${conversationId}`);
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const userId = req.user._id;

    // 1. Mark actual messages as read (for delivery status AND unread badge)
    // We update both fields for robustness across the system
    const result = await Message.updateMany(
      {
        conversation_id: new mongoose.Types.ObjectId(conversationId as string),
        $and: [
          {
            $or: [
              { recipient_id: userId },
              { receiver: userId }
            ]
          },
          {
            $or: [
              { delivery_status: { $ne: 'read' } },
              { read: false }
            ]
          }
        ]
      },
      { 
        delivery_status: 'read',
        read: true 
      }
    );

    // 2. Mark corresponding notifications as read
    await Notification.updateMany(
      {
        user_id: userId,
        'data.conversation_id': conversationId.toString(),
        read: false,
      },
      { read: true, read_at: new Date() }
    );

    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (error: any) {
    console.error(`[ChatController] Error in markMessagesAsRead for ${conversationId}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Mark all messages from a specific sender as read
export const markMessagesAsReadBySender = async (req: AuthRequest, res: Response) => {
  const { senderId } = req.params;
  try {
    const result = await Message.updateMany(
      {
        $or: [
          { receiver: req.user._id },
          { recipient_id: req.user._id }
        ],
        sender_id: senderId,
        read: false,
      },
      { 
        read: true,
        delivery_status: 'read'
      }
    );
    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (error: any) {
    console.error('Error in markMessagesAsReadBySender:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread messages count for the current user (Unified with Notifications)
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    
    // Using Notification collection as the source of truth for the badge
    // This includes private messages, group messages, and other alerts
    const count = await Notification.countDocuments({
      user_id: userId,
      read: false,
    });

    res.json({ unread: count });
  } catch (error: any) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
