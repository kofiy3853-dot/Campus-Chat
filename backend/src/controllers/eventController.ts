import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/express';
import Event from '../models/Event';
import EventAttendee from '../models/EventAttendee';

// GET /api/events
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { category, sort } = req.query;
    let query: any = {};
    if (category) query.category = category;

    let sortOption: any = { dateTime: 1 }; // Default: upcoming
    if (sort === 'popular') sortOption = { attendeesCount: -1 };

    const events = await Event.find(query).sort(sortOption).populate('organizerId', 'name profile_picture');

    // Check if the current user has joined these events
    const userId = req.user?._id;
    const eventIds = events.map(e => e._id);
    const userRsvps = userId 
      ? await EventAttendee.find({ eventId: { $in: eventIds }, userId }).select('eventId')
      : [];
    const rsvpSet = new Set(userRsvps.map(r => r.eventId.toString()));

    const result = events.map(event => ({
      ...event.toObject(),
      isJoined: rsvpSet.has(event._id.toString())
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, dateTime, category, image, maxAttendees } = req.body;
    
    // Authorization check: Only admins or approved users (simplified to any logged in user for now, as per requirements)
    // In a real app, you might check if (req.user.role === 'admin' || req.user.isApprovedOrganizer)
    
    const newEvent = await Event.create({
      title,
      description,
      location,
      dateTime,
      category,
      image,
      maxAttendees,
      organizerId: req.user._id
    });

    res.status(201).json(newEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/events/:id/join
export const joinEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.maxAttendees && event.attendeesCount >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const alreadyJoined = await EventAttendee.findOne({ eventId, userId });
    if (alreadyJoined) return res.status(400).json({ message: 'Already joined this event' });

    await EventAttendee.create({ eventId, userId });
    event.attendeesCount += 1;
    await event.save();

    res.json({ message: 'Joined event successfully', attendeesCount: event.attendeesCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events/:id/leave
export const leaveEvent = async (req: any, res: Response) => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user._id;

    const result = await EventAttendee.findOneAndDelete({ eventId, userId });
    if (!result) return res.status(400).json({ message: 'Not joined this event' });

    const event = await Event.findById(eventId);
    if (event) {
      event.attendeesCount = Math.max(0, event.attendeesCount - 1);
      await event.save();
      res.json({ message: 'Left event successfully', attendeesCount: event.attendeesCount });
    } else {
      res.json({ message: 'Left event successfully' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



