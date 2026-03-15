import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Connection from '../models/Connection';
import { createNotification } from './notificationController';
import User from '../models/User';

export const sendConnectionRequest = async (req: AuthRequest, res: Response) => {
  const { recipientId } = req.body;
  const senderId = req.user.id;

  if (senderId === recipientId) {
    return res.status(400).json({ message: 'You cannot connect with yourself' });
  }

  try {
    // Check if a connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists or is pending' });
    }

    const connection = await Connection.create({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });

    // Notify recipient
    createNotification(
      recipientId,
      'system',
      'New Connection Request',
      `${req.user.name || 'A student'} wants to connect with you.`,
      { type: 'connection_request', connectionId: connection._id.toString() },
      senderId
    );

    res.status(201).json(connection);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToConnectionRequest = async (req: AuthRequest, res: Response) => {
  const { connectionId, status } = req.body;
  const userId = req.user.id;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    connection.status = status;
    await connection.save();

    if (status === 'accepted') {
        createNotification(
            connection.sender.toString(),
            'system',
            'Connection Accepted',
            `${req.user.name || 'A student'} accepted your connection request. You can now message them.`,
            { type: 'connection_accepted', responderId: userId },
            userId
        );
    }

    res.json(connection);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getIncomingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await Connection.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('sender', 'name email profile_picture department');
    
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getConnectionStatus = async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    try {
        const connection = await Connection.findOne({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        });

        res.json({ status: connection ? connection.status : 'none', connection });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
