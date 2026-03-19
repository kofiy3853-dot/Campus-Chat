import { Request } from 'express';
import { File } from 'multer';

export interface AuthRequest extends Request {
  user?: any;
  files?: File[];
}
