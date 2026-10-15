import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/store.js';
import { User, AuthResponse } from '@byolabs/shared';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'byolabs_super_secret_jwt_key_2026_change_in_production';

const DEFAULT_GOOGLE_CLIENT_ID = '145989035319-kermjuheku4se52tnjd555ffhcr6ic0m.apps.googleusercontent.com';
const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
const getGoogleClientSecret = () => process.env.GOOGLE_CLIENT_SECRET || '';
const getOAuth2Client = () => new OAuth2Client(getGoogleClientId(), getGoogleClientSecret());


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

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, newPassword } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({ error: 'Email or Username is required' });
    }

    const user = db.getUserByEmail(emailOrUsername) || db.getUserByUsername(emailOrUsername);

    if (!user) {
      // Return success message to avoid user enumeration
      return res.json({
        message: 'If an account exists with that email or username, your password reset request has been queued for administrator approval.',
      });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      const resetReq = db.createPasswordReset(user.id, user.name, user.email, passwordHash);
      db.addAuditLog(
        user.id,
        user.email,
        'Password Reset Requested',
        `Password reset request queued for Admin approval (Request ID: ${resetReq.id})`
      );

      return res.json({
        message: 'Password reset request submitted successfully! Once an Administrator approves it in the Admin Dashboard, your new password will be active and you can log in immediately.',
        requestId: resetReq.id,
      });
    }

    const resetToken = db.createPasswordResetToken(user.id);
    db.addAuditLog(user.id, user.email, 'Password Reset Requested', 'Generated password reset token (1 hour expiry)');

    const resetUrl = `/reset-password?token=${resetToken}`;

    return res.json({
      message: 'Password reset instructions have been generated successfully.',
      resetToken,
      resetUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const tokenData = db.verifyPasswordResetToken(token);
    if (!tokenData) {
      return res.status(400).json({
        error: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    const user = db.getUserById(tokenData.userId);
    if (!user) {
      return res.status(404).json({ error: 'User associated with this token was not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    db.updatePassword(user.id, passwordHash);
    db.consumePasswordResetToken(token);

    db.addAuditLog(user.id, user.email, 'Password Reset Completed', 'User successfully reset their password');

    return res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/v1/auth/google/config
router.get('/google/config', (req: Request, res: Response) => {
  const cid = getGoogleClientId();
  return res.json({
    clientId: cid,
    enabled: Boolean(cid),
  });
});

// POST /api/v1/auth/google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, code, redirectUri, demoEmail } = req.body;

    if (!credential && !code && !demoEmail) {
      return res.status(400).json({ error: 'Google credential or authorization code is required' });
    }

    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    const client = getOAuth2Client();
    const activeClientId = getGoogleClientId();

    if (credential) {
      // 1. Verify Google ID Token (from Google Identity Services credential response)
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: activeClientId || undefined,
        });
        const payload = ticket.getPayload();
        if (payload) {
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
        }
      } catch (verifyErr: any) {
        console.warn('verifyIdToken failed, attempting Google tokeninfo fallback:', verifyErr.message);
        try {
          const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (resp.ok) {
            const info = (await resp.json()) as any;
            if (!activeClientId || info.aud === activeClientId || info.azp === activeClientId) {
              email = info.email;
              name = info.name;
              picture = info.picture;
            }
          }
        } catch (fetchErr) {
          console.error('Google tokeninfo fallback error:', fetchErr);
        }
      }
    } else if (code) {
      // 2. Exchange OAuth2 authorization code
      try {
        const { tokens } = await client.getToken({
          code,
          redirect_uri: redirectUri || 'postmessage',
        });
        if (tokens.id_token) {
          const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: activeClientId || undefined,
          });
          const payload = ticket.getPayload();
          if (payload) {
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
          }
        } else if (tokens.access_token) {
          const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (infoRes.ok) {
            const info = (await infoRes.json()) as any;
            email = info.email;
            name = info.name;
            picture = info.picture;
          }
        }
      } catch (codeErr: any) {
        console.error('Failed to exchange Google OAuth code:', codeErr);
        return res.status(400).json({ error: codeErr.message || 'Failed to exchange authorization code' });
      }
    } else if (demoEmail && process.env.NODE_ENV !== 'production') {
      email = demoEmail;
      name = demoEmail.split('@')[0];
    }

    if (!email) {
      return res.status(401).json({ error: 'Failed to authenticate with Google. Invalid or expired token.' });
    }

    let user = db.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Auto-create user account from Google OAuth profile
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      if (!baseUsername) baseUsername = 'user';
      let username = baseUsername;
      let counter = 1;
      while (db.getUserByUsername(username)) {
        username = `${baseUsername}${counter++}`;
      }

      const settings = db.getSettings();
      const requiresApproval = settings.requireAdminApproval ?? true;

      user = {
        id: `usr-${uuidv4().substring(0, 8)}`,
        name: name || baseUsername,
        email,
        username,
        role: 'USER',
        status: requiresApproval ? 'PENDING' : 'APPROVED',
        avatar: picture,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const randomPass = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPass, salt);

      db.addUser(user, passwordHash);
      db.addAuditLog(
        user.id,
        user.email,
        'User Register (Google OAuth)',
        `New account registered via Google OAuth (${user.status})`
      );
      isNewUser = true;
    } else {
      let modified = false;
      if (!user.avatar && picture) {
        user.avatar = picture;
        modified = true;
      }
      if (!user.authProvider) {
        user.authProvider = 'google';
        modified = true;
      }
      if (modified) {
        db.updateUser(user);
      }
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: isNewUser
          ? 'Registration successful via Google! Your account is currently PENDING approval by an Administrator.'
          : 'Your account is PENDING approval by an Administrator. Please wait for approval before logging in.',
        status: 'PENDING',
        user,
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

    db.addAuditLog(user.id, user.email, 'User Login (Google OAuth)', 'Logged in successfully with Google OAuth');

    const response: AuthResponse = { user, token };
    return res.json(response);
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: err.message || 'Server error during Google authentication' });
  }
});

export default router;


