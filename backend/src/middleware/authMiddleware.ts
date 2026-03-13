import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      req.user = await User.findById(decoded.id).select('-password_hash');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User session expired or user not found' });
      }
      
      return next();
    } catch (error: any) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
};
