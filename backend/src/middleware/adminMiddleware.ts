import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  return next();
};
