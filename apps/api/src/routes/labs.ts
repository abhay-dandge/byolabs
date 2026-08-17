import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { k8sProvisioner } from '../services/k8sProvisioner.js';
import { taskValidator } from '../services/taskValidator.js';
import { LabSession } from '@byolabs/shared';

const router = Router();

// GET /api/v1/labs — List all published labs
router.get('/', (req, res) => {
  const labs = db.getLabs().filter((l) => l.isPublished);
  return res.json({ labs });
});

// GET /api/v1/labs/my-labs/active — Get active sessions for current user
router.get('/my-labs/active', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const active = db.getActiveSessionsByUserId(req.user!.id);
  return res.json({ sessions: active });
});

// GET /api/v1/labs/:id — Get details of a single lab
router.get('/:id', (req, res) => {
  const lab = db.getLabById(req.params.id);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }
  return res.json({ lab });
});

// GET /api/v1/labs/sessions/:sessionId — Get session details
router.get('/sessions/:sessionId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const session = db.getSessionById(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const lab = db.getLabById(session.labId);
  return res.json({ session, lab });
});

// POST /api/v1/labs/:id/start — Launch a lab session
router.post('/:id/start', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const lab = db.getLabById(req.params.id);

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const settings = db.getSettings();

    // 1. Quota check: user active labs limit
    const userActive = db.getActiveSessionsByUserId(user.id);
    if (userActive.length >= settings.maxActiveLabsPerUser) {
      return res.status(400).json({
        error: `Maximum active lab limit reached (${settings.maxActiveLabsPerUser} active labs max per user). Please stop an existing lab session first.`,
      });
    }

    // 2. Cluster capacity check
    const allActive = db.getSessions().filter((s) => s.status === 'RUNNING' || s.status === 'STARTING');
    if (allActive.length >= settings.maxClusterLabs) {
      return res.status(503).json({
        error: 'The cluster currently does not have enough resources available. Please try again in a few minutes.',
      });
    }

    // 3. Generate unique Lab ID & K8s namespace
    const shortId = uuidv4().substring(0, 8);
    const sessionId = `lab-${shortId}`;
    const namespace = `lab-session-${shortId}`;
    const podName = `pod-${lab.slug}-${shortId}`;

    const durationMinutes = lab.durationMinutes || settings.defaultLabTimeoutMinutes || 60;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const newSession: LabSession = {
      id: sessionId,
      userId: user.id,
      labId: lab.id,
      labName: lab.name,
      labSlug: lab.slug,
      namespace,
      podName,
      status: 'CREATING',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      expiresAt,
      lastActivityAt: new Date().toISOString(),
      completedTasks: [],
    };

    db.addSession(newSession);
    db.addAuditLog(user.id, user.email, 'Start Lab', `Started lab ${lab.name} (Session: ${sessionId})`);

    // Async/Sync Provisioning step
    newSession.status = 'STARTING';
    db.updateSession(newSession);

    try {
      await k8sProvisioner.provisionLab(newSession, lab);
      newSession.status = 'RUNNING';
      db.updateSession(newSession);
    } catch (err: any) {
      newSession.status = 'FAILED';
      newSession.errorMessage = err?.message || 'Provisioning failed';
      db.updateSession(newSession);
      return res.status(500).json({
        error: 'We could not start your lab environment. The lab infrastructure is temporarily unavailable.',
        details: err?.message,
      });
    }

    return res.status(201).json({
      message: 'Lab environment provisioned successfully!',
      session: newSession,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/v1/labs/sessions/:sessionId/stop — Stop lab session
router.post('/sessions/:sessionId/stop', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = db.getSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    session.status = 'STOPPING';
    db.updateSession(session);

    await k8sProvisioner.deleteLab(session);

    session.status = 'STOPPED';
    db.updateSession(session);
    db.addAuditLog(req.user!.id, req.user!.email, 'Stop Lab', `Stopped lab session ${session.id}`);

    return res.json({ message: 'Lab environment stopped successfully', session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to stop lab' });
  }
});

// POST /api/v1/labs/sessions/:sessionId/reset — Reset lab session
router.post('/sessions/:sessionId/reset', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = db.getSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const lab = db.getLabById(session.labId);
    if (!lab) {
      return res.status(404).json({ error: 'Lab definition missing' });
    }

    if (session.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Teardown and re-provision
    await k8sProvisioner.deleteLab(session);
    session.status = 'STARTING';
    session.completedTasks = [];
    db.updateSession(session);

    await k8sProvisioner.provisionLab(session, lab);
    session.status = 'RUNNING';
    session.lastActivityAt = new Date().toISOString();
    db.updateSession(session);

    return res.json({ message: 'Lab environment reset successfully!', session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Reset failed' });
  }
});

// POST /api/v1/labs/sessions/:sessionId/tasks/:taskId/validate — Trigger in-pod task verification
router.post('/sessions/:sessionId/tasks/:taskId/validate', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = db.getSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lab = db.getLabById(session.labId);
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const task = lab.tasks.find((t) => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = await taskValidator.validateTask(session, task);
    return res.json({
      success: result.success,
      message: result.message,
      session: db.getSessionById(session.id),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Task validation error' });
  }
});

export default router;
