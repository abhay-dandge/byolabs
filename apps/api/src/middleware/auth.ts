import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { User } from '@byolabs/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'byolabs_super_secret_jwt_key_2026_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: `Account status is ${user.status}. Approval required.` });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
