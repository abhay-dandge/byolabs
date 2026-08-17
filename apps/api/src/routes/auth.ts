import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { User, AuthResponse } from '@byolabs/shared';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'byolabs_super_secret_jwt_key_2026_change_in_production';

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr-${uuidv4().substring(0, 8)}`,
      name,
      email,
      username,
      role: 'USER',
      status: 'PENDING', // All new users default to PENDING approval by Admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addUser(newUser, passwordHash);
    db.addAuditLog(newUser.id, newUser.email, 'User Register', 'Created account (PENDING approval)');

    return res.status(201).json({
      message: 'Registration successful! Your account is currently PENDING approval by an Administrator.',
      user: newUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and Password are required' });
    }

    const user = db.getUserByEmail(emailOrUsername) || db.getUserByUsername(emailOrUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordHash = db.getPasswordHash(user.id);
    if (!passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check account status
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Your account is PENDING approval by an Administrator. Please wait for approval before logging in.',
        status: 'PENDING',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      return res.status(403).json({
        error: `Your account has been ${user.status.toLowerCase()}. Please contact support.`,
        status: user.status,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    db.addAuditLog(user.id, user.email, 'User Login', 'Logged in successfully');

    const response: AuthResponse = { user, token };
    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/v1/auth/me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
