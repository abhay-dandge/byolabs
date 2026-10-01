import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { portProxyService } from '../services/portProxyService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'byolabs_super_secret_jwt_key_2026_change_in_production';

// Helper to extract JWT token from query, header, or cookie
function extractToken(req: Request): string | null {
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith('byolabs_token=') || c.startsWith('auth_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1] || null;
    }
  }
  return null;
}

// Route matching /proxy/:sessionId/:port and any subpaths /proxy/:sessionId/:port/*
router.all('/:sessionId/:port*', async (req: Request, res: Response) => {
  const { sessionId, port } = req.params;
  const targetPort = parseInt(port, 10);

  if (isNaN(targetPort) || targetPort < 1 || targetPort > 65535) {
    return res.status(400).send('Invalid port number specified');
  }

  const session = db.getSessionById(sessionId);
  if (!session) {
    return res.status(404).send('Lab session not found');
  }

  if (session.status !== 'RUNNING') {
    return res.status(400).send(`Lab session is not running (Current status: ${session.status})`);
  }

  // Authenticate user access
  const token = extractToken(req);
  if (!token) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family:system-ui;background:#0f172a;color:#f8fafc;padding:40px;text-align:center;">
        <div style="max-width:400px;margin:60px auto;background:#1e293b;padding:30px;border-radius:16px;">
          <h2 style="color:#f43f5e;">Authentication Required</h2>
          <p style="color:#94a3b8;font-size:14px;">You must be logged in to access this container port preview.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = db.getUserById(decoded.id);

    if (!user || user.status !== 'APPROVED') {
      return res.status(403).send('Forbidden: Account not approved');
    }

    if (session.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).send('Forbidden: Access denied to this session');
    }

    // Set auth cookie so subsequent static assets fetch seamlessly
    res.cookie('byolabs_token', token, { path: '/', httpOnly: false, sameSite: 'lax' });

    let subPath = req.params[0] || '/';
    if (!subPath.startsWith('/')) {
      subPath = '/' + subPath;
    }

    await portProxyService.proxyHttpRequest(req, res, session, targetPort, subPath);
  } catch (err: any) {
    return res.status(401).send('Invalid or expired authentication token');
  }
});

export default router;
