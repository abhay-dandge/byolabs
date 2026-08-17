import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { k8sProvisioner } from '../services/k8sProvisioner.js';
import { Lab, ClusterStatus } from '@byolabs/shared';

const router = Router();

// Apply auth + requireAdmin middleware across all admin routes
router.use(authenticate, requireAdmin);

// ================= USERS MANAGEMENT ================= //
router.get('/users', (req, res) => {
  const users = db.getUsers();
  return res.json({ users });
});

router.post('/users/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'APPROVED';
  user.updatedAt = new Date().toISOString();
  db.updateUser(user);
  db.addAuditLog(req.user!.id, req.user!.email, 'Approve User', `Approved account for ${user.email}`);

  return res.json({ message: `User ${user.email} approved successfully`, user });
});

router.post('/users/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'REJECTED';
  user.updatedAt = new Date().toISOString();
  db.updateUser(user);
  db.addAuditLog(req.user!.id, req.user!.email, 'Reject User', `Rejected account for ${user.email}`);

  return res.json({ message: `User ${user.email} rejected`, user });
});

router.post('/users/:id/suspend', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'SUSPENDED';
  user.updatedAt = new Date().toISOString();
  db.updateUser(user);
  db.addAuditLog(req.user!.id, req.user!.email, 'Suspend User', `Suspended account for ${user.email}`);

  return res.json({ message: `User ${user.email} suspended`, user });
});

router.post('/users/:id/reactivate', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'APPROVED';
  user.updatedAt = new Date().toISOString();
  db.updateUser(user);
  db.addAuditLog(req.user!.id, req.user!.email, 'Reactivate User', `Reactivated account for ${user.email}`);

  return res.json({ message: `User ${user.email} reactivated`, user });
});

router.delete('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.deleteUser(user.id);
  db.addAuditLog(req.user!.id, req.user!.email, 'Delete User', `Deleted user ${user.email}`);
  return res.json({ message: `User deleted` });
});

// ================= LAB MANAGEMENT ================= //
router.get('/labs', (req, res) => {
  const labs = db.getLabs();
  return res.json({ labs });
});

router.post('/labs', (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  if (!body.name || !body.slug || !body.dockerImage) {
    return res.status(400).json({ error: 'Name, Slug, and Docker Image are required' });
  }

  const newLab: Lab = {
    id: `lab-${uuidv4().substring(0, 8)}`,
    slug: body.slug,
    name: body.name,
    description: body.description || '',
    category: body.category || 'Linux',
    difficulty: body.difficulty || 'Beginner',
    durationMinutes: body.durationMinutes || 60,
    dockerImage: body.dockerImage,
    cpuRequest: body.cpuRequest || '250m',
    cpuLimit: body.cpuLimit || '1',
    memoryRequest: body.memoryRequest || '256Mi',
    memoryLimit: body.memoryLimit || '1Gi',
    storage: body.storage || '1Gi',
    environmentVariables: body.environmentVariables || {},
    startupCommand: body.startupCommand || '',
    terminalEnabled: body.terminalEnabled ?? true,
    browserAccess: body.browserAccess ?? true,
    instructionsMarkdown: body.instructionsMarkdown || '# Welcome to the Lab',
    tasks: body.tasks || [],
    isPublished: body.isPublished ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addLab(newLab);
  db.addAuditLog(req.user!.id, req.user!.email, 'Create Lab', `Created lab ${newLab.name}`);
  return res.status(201).json({ message: 'Lab created successfully', lab: newLab });
});

router.put('/labs/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getLabById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lab not found' });

  const updated: Lab = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.updateLab(updated);
  db.addAuditLog(req.user!.id, req.user!.email, 'Update Lab', `Updated lab ${updated.name}`);
  return res.json({ message: 'Lab updated', lab: updated });
});

router.delete('/labs/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getLabById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lab not found' });

  db.deleteLab(existing.id);
  db.addAuditLog(req.user!.id, req.user!.email, 'Delete Lab', `Deleted lab ${existing.name}`);
  return res.json({ message: 'Lab deleted' });
});

// ================= RUNNING LABS MONITORING ================= //
router.get('/running-labs', (req, res) => {
  const sessions = db.getSessions().filter((s) => s.status === 'RUNNING' || s.status === 'STARTING');
  const enriched = sessions.map((s) => {
    const user = db.getUserById(s.userId);
    return {
      ...s,
      userEmail: user?.email || 'Unknown',
      username: user?.username || 'Unknown',
    };
  });
  return res.json({ sessions: enriched });
});

router.post('/running-labs/:sessionId/stop', async (req: AuthenticatedRequest, res: Response) => {
  const session = db.getSessionById(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.status = 'STOPPING';
  db.updateSession(session);

  await k8sProvisioner.deleteLab(session);

  session.status = 'STOPPED';
  db.updateSession(session);

  db.addAuditLog(req.user!.id, req.user!.email, 'Admin Force Stop', `Force stopped lab session ${session.id}`);
  return res.json({ message: `Session ${session.id} force-stopped successfully` });
});

// ================= CLUSTER HEALTH & SYSTEM STATUS ================= //
router.get('/cluster', (req, res) => {
  const activeSessions = db.getSessions().filter((s) => s.status === 'RUNNING' || s.status === 'STARTING');
  const isK8s = k8sProvisioner.getIsK8sAvailable();

  const clusterStatus: ClusterStatus = {
    controlPlaneReady: true,
    activeLabsCount: activeSessions.length,
    maxLabsCapacity: db.getSettings().maxClusterLabs,
    nodes: [
      {
        name: 'master-node-01',
        status: 'Ready',
        role: 'control-plane',
        cpuUsage: '22%',
        memoryUsage: '38%',
        podsCount: activeSessions.length + 5,
      },
      {
        name: 'worker-node-01',
        status: 'Ready',
        role: 'worker',
        cpuUsage: '45%',
        memoryUsage: '52%',
        podsCount: activeSessions.length,
      },
    ],
    totalCpuUsagePercent: 34,
    totalMemoryUsagePercent: 45,
  };

  return res.json({ cluster: clusterStatus, isK8sAvailable: isK8s });
});

router.get('/logs', (req, res) => {
  return res.json({ logs: db.getLogs() });
});

router.get('/audit', (req, res) => {
  return res.json({ auditLogs: db.getAuditLogs() });
});

router.get('/settings', (req, res) => {
  return res.json({ settings: db.getSettings() });
});

router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  db.updateSettings(req.body);
  db.addAuditLog(req.user!.id, req.user!.email, 'Update Settings', 'Updated platform settings');
  return res.json({ message: 'Settings updated', settings: db.getSettings() });
});

export default router;
