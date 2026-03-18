import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  console.log('[AUTH] Request headers:', req.headers.authorization);
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('[AUTH] Token extracted:', token ? 'exists' : 'missing');
      
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      console.log('[AUTH] Token decoded, user ID:', decoded.id);
      
      req.user = await User.findById(decoded.id).select('-password_hash');
      console.log('[AUTH] User found:', req.user ? 'yes' : 'no');
      
      if (!req.user) {
        console.log('[AUTH] User not found in database');
        return res.status(401).json({ message: 'User session expired or user not found' });
      }
      
      console.log('[AUTH] Authentication successful');
      return next();
    } catch (error: any) {
      console.log('[AUTH] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
  }

  if (!token) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({ message: 'Authentication required' });
  }
};
