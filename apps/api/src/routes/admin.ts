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

router.get('/users/usage', (req, res) => {
  const usageReports = db.getAllUsersUsageReport();
  return res.json({ usageReports });
});

router.put('/users/:id/quota', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { monthlyQuotaHours } = req.body;
  if (typeof monthlyQuotaHours !== 'number' || monthlyQuotaHours < 0) {
    return res.status(400).json({ error: 'Valid non-negative monthlyQuotaHours is required' });
  }

  const prevQuota = user.monthlyQuotaHours !== undefined ? `${user.monthlyQuotaHours} hrs` : 'Default (30 hrs)';
  user.monthlyQuotaHours = monthlyQuotaHours;
  user.updatedAt = new Date().toISOString();
  db.updateUser(user);

  db.addAuditLog(
    req.user!.id,
    req.user!.email,
    'Update User Quota',
    `Updated lab usage quota for ${user.email} from ${prevQuota} to ${monthlyQuotaHours} hrs`
  );

  return res.json({
    message: `Lab usage limit for ${user.name} updated to ${monthlyQuotaHours} hours/month`,
    user,
    usage: db.getUserMonthlyUsage(user.id),
  });
});

router.post('/users/quota/bulk', (req: AuthenticatedRequest, res: Response) => {
  const { defaultMonthlyQuotaHours, applyToAllUsers } = req.body;

  if (typeof defaultMonthlyQuotaHours === 'number' && defaultMonthlyQuotaHours >= 0) {
    db.updateSettings({ defaultMonthlyQuotaHours });
  }

  if (applyToAllUsers && typeof defaultMonthlyQuotaHours === 'number') {
    const users = db.getUsers();
    for (const u of users) {
      u.monthlyQuotaHours = defaultMonthlyQuotaHours;
      u.updatedAt = new Date().toISOString();
      db.updateUser(u);
    }
    db.addAuditLog(
      req.user!.id,
      req.user!.email,
      'Bulk Update Quota',
      `Applied ${defaultMonthlyQuotaHours} hrs monthly lab quota to all existing users`
    );
  } else {
    db.addAuditLog(
      req.user!.id,
      req.user!.email,
      'Update Global Default Quota',
      `Updated platform default monthly lab quota to ${defaultMonthlyQuotaHours} hrs`
    );
  }

  return res.json({
    message: `Monthly quota updated successfully`,
    settings: db.getSettings(),
    usageReports: db.getAllUsersUsageReport(),
  });
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

router.post('/users/approve-all', (req: AuthenticatedRequest, res: Response) => {
  const pendingUsers = db.getUsers().filter((u) => u.status === 'PENDING');
  for (const u of pendingUsers) {
    u.status = 'APPROVED';
    u.updatedAt = new Date().toISOString();
    db.updateUser(u);
  }
  db.addAuditLog(
    req.user!.id,
    req.user!.email,
    'Approve All Users',
    `Approved all ${pendingUsers.length} pending user registration requests`
  );
  return res.json({
    message: `Successfully approved all ${pendingUsers.length} pending user requests`,
    approvedCount: pendingUsers.length,
  });
});

// ================= CLUSTER HEALTH & SYSTEM STATUS ================= //
router.get('/cluster', (req, res) => {
  const activeSessions = db.getSessions().filter((s) => s.status === 'RUNNING' || s.status === 'STARTING');
  const isK8s = k8sProvisioner.getIsK8sAvailable();

  const totalMaxCapacity = db.getSettings().maxClusterLabs || 50;
  const c1Active = Math.ceil(activeSessions.length / 2);
  const c2Active = activeSessions.length - c1Active;

  const cluster1 = {
    id: 'cluster-01-prod',
    name: 'Cluster 1 — Production K8s Primary',
    region: 'us-east-1 (Primary)',
    type: 'Production K8s Cluster',
    controlPlaneReady: true,
    activeLabsCount: c1Active,
    maxLabsCapacity: Math.ceil(totalMaxCapacity / 2),
    nodes: [
      {
        name: 'prod-k8s-master-01',
        status: 'Ready',
        role: 'control-plane',
        cpuUsage: '32%',
        memoryUsage: '44%',
        podsCount: c1Active + 6,
      },
      {
        name: 'prod-k8s-worker-01',
        status: 'Ready',
        role: 'worker',
        cpuUsage: '54%',
        memoryUsage: '60%',
        podsCount: c1Active,
      },
    ],
    totalCpuUsagePercent: 43,
    totalMemoryUsagePercent: 52,
  };

  const cluster2 = {
    id: 'cluster-02-dev',
    name: 'Cluster 2 — Secondary K8s Sandbox',
    region: 'ap-south-1 (Secondary)',
    type: 'Development / Sandbox Cluster',
    controlPlaneReady: true,
    activeLabsCount: c2Active,
    maxLabsCapacity: Math.floor(totalMaxCapacity / 2),
    nodes: [
      {
        name: 'sandbox-k8s-master-01',
        status: 'Ready',
        role: 'control-plane',
        cpuUsage: '18%',
        memoryUsage: '28%',
        podsCount: c2Active + 4,
      },
      {
        name: 'sandbox-k8s-worker-01',
        status: 'Ready',
        role: 'worker',
        cpuUsage: '30%',
        memoryUsage: '36%',
        podsCount: c2Active,
      },
    ],
    totalCpuUsagePercent: 24,
    totalMemoryUsagePercent: 32,
  };

  return res.json({
    clusters: [cluster1, cluster2],
    isK8sAvailable: isK8s,
  });
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

// ================= PASSWORD RESET REQUESTS (ADMIN REVIEW) ================= //
router.get('/password-resets', (req, res) => {
  const requests = db.getPasswordResets().map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    status: r.status,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
  }));
  return res.json({ passwordResets: requests });
});

router.post('/password-resets/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const approved = db.approvePasswordReset(req.params.id);
  if (!approved) {
    return res.status(404).json({ error: 'Password reset request not found or not pending' });
  }

  db.addAuditLog(
    req.user!.id,
    req.user!.email,
    'Approve Password Reset',
    `Approved password reset request for ${approved.userEmail} (${approved.userName})`
  );

  return res.json({
    message: `Password reset request for ${approved.userEmail} approved successfully. User can now sign in with their new password.`,
    request: {
      id: approved.id,
      userId: approved.userId,
      userName: approved.userName,
      userEmail: approved.userEmail,
      status: approved.status,
      createdAt: approved.createdAt,
      reviewedAt: approved.reviewedAt,
    },
  });
});

router.post('/password-resets/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const rejected = db.rejectPasswordReset(req.params.id);
  if (!rejected) {
    return res.status(404).json({ error: 'Password reset request not found or not pending' });
  }

  db.addAuditLog(
    req.user!.id,
    req.user!.email,
    'Reject Password Reset',
    `Rejected password reset request for ${rejected.userEmail}`
  );

  return res.json({
    message: `Password reset request for ${rejected.userEmail} rejected.`,
    request: {
      id: rejected.id,
      userId: rejected.userId,
      userName: rejected.userName,
      userEmail: rejected.userEmail,
      status: rejected.status,
      createdAt: rejected.createdAt,
      reviewedAt: rejected.reviewedAt,
    },
  });
});

router.post('/password-resets/approve-all', (req: AuthenticatedRequest, res: Response) => {
  const count = db.approveAllPasswordResets();
  db.addAuditLog(
    req.user!.id,
    req.user!.email,
    'Approve All Password Resets',
    `Approved all ${count} pending password reset request(s)`
  );
  return res.json({
    message: `Successfully approved all ${count} pending password reset requests. Users can now sign in with their new passwords.`,
    approvedCount: count,
  });
});

export default router;

