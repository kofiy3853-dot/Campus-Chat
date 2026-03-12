import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

export const getConversations = async (req: any, res: Response) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'name email profile_picture status last_seen')
      .populate('last_message')
      .sort({ last_message_time: -1 });

    res.json(conversations);
  } catch (error: any) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: any, res: Response) => {
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

    const messages = await Message.find({ conversation_id: conversationId })
      .populate('sender_id', 'name profile_picture')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  const { recipientId, message_text, message_type, media_url } = req.body;

  try {
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
      message_text,
      message_type,
      media_url,
    });

    // Populate sender so socket receivers can render name/avatar without a DB call
    await message.populate('sender_id', 'name profile_picture');

    conversation.last_message = message._id as any;
    conversation.last_message_time = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const createConversation = async (req: any, res: Response) => {
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
