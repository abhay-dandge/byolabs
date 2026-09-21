import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Lab, LabSession, SystemLog, AuditLog, SystemSettings, UserUsageReport } from '@byolabs/shared';

export interface PasswordResetRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  newPasswordHash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
}

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  resetTokens?: Record<string, { userId: string; expiresAt: number }>; // token -> { userId, expiresAt }
  passwordResets?: PasswordResetRecord[];
  labs: Lab[];
  sessions: LabSession[];
  logs: SystemLog[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DB_PATH = process.env.DATABASE_PATH || './byolabs_db.json';

const defaultSettings: SystemSettings = {
  maxActiveLabsPerUser: 1,
  maxClusterLabs: 50,
  defaultLabTimeoutMinutes: 60,
  defaultIdleTimeoutMinutes: 30,
  defaultMonthlyQuotaHours: 30,
  requireAdminApproval: true,
};

class FileStore {
  private data: DatabaseSchema;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(DB_PATH);
    this.data = this.load();
    if (!this.data.settings.defaultMonthlyQuotaHours) {
      this.data.settings.defaultMonthlyQuotaHours = 30;
      this.save();
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings && parsed.settings.defaultMonthlyQuotaHours === undefined) {
          parsed.settings.defaultMonthlyQuotaHours = 30;
        }
        if (!parsed.resetTokens) {
          parsed.resetTokens = {};
        }
        if (!parsed.passwordResets) {
          parsed.passwordResets = [];
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error loading DB file, initializing fresh DB:', err);
    }
    return {
      users: [],
      passwords: {},
      resetTokens: {},
      passwordResets: [],
      labs: [],
      sessions: [],
      logs: [],
      auditLogs: [],
      settings: defaultSettings,
    };
  }

  public save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  // User Operations
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public addUser(user: User, passwordHash: string): void {
    this.data.users.push(user);
    this.data.passwords[user.id] = passwordHash;
    this.save();
  }

  public updateUser(user: User): void {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.save();
    }
  }

  public deleteUser(id: string): void {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    delete this.data.passwords[id];
    this.save();
  }

  public getPasswordHash(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  public updatePassword(userId: string, passwordHash: string): boolean {
    if (this.data.passwords[userId] !== undefined) {
      this.data.passwords[userId] = passwordHash;
      this.save();
      return true;
    }
    return false;
  }

  public createPasswordResetToken(userId: string, expiresInMs: number = 3600000): string {
    if (!this.data.resetTokens) {
      this.data.resetTokens = {};
    }
    const token = crypto.randomBytes(32).toString('hex');
    this.data.resetTokens[token] = {
      userId,
      expiresAt: Date.now() + expiresInMs,
    };
    this.save();
    return token;
  }

  public verifyPasswordResetToken(token: string): { userId: string } | null {
    if (!this.data.resetTokens || !this.data.resetTokens[token]) {
      return null;
    }
    const record = this.data.resetTokens[token];
    if (Date.now() > record.expiresAt) {
      delete this.data.resetTokens[token];
      this.save();
      return null;
    }
    return { userId: record.userId };
  }

  public consumePasswordResetToken(token: string): boolean {
    if (this.data.resetTokens && this.data.resetTokens[token]) {
      delete this.data.resetTokens[token];
      this.save();
      return true;
    }
    return false;
  }

  // Password Reset Requests (Admin Review & Approval)
  public getPasswordResets(): PasswordResetRecord[] {
    return this.data.passwordResets || [];
  }

  public createPasswordReset(
    userId: string,
    userName: string,
    userEmail: string,
    newPasswordHash: string
  ): PasswordResetRecord {
    if (!this.data.passwordResets) {
      this.data.passwordResets = [];
    }
    // Cancel or supersede any existing pending requests for this user
    this.data.passwordResets.forEach((pr) => {
      if (pr.userId === userId && pr.status === 'PENDING') {
        pr.status = 'REJECTED';
        pr.reviewedAt = new Date().toISOString();
      }
    });

    const record: PasswordResetRecord = {
      id: `reset-${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userName,
      userEmail,
      newPasswordHash,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.data.passwordResets.unshift(record);
    this.save();
    return record;
  }

  public approvePasswordReset(id: string): PasswordResetRecord | null {
    if (!this.data.passwordResets) return null;
    const req = this.data.passwordResets.find((r) => r.id === id);
    if (!req || req.status !== 'PENDING') return null;

    // Directly activate the new password hash for the user!
    this.data.passwords[req.userId] = req.newPasswordHash;
    req.status = 'APPROVED';
    req.reviewedAt = new Date().toISOString();
    this.save();
    return req;
  }

  public rejectPasswordReset(id: string): PasswordResetRecord | null {
    if (!this.data.passwordResets) return null;
    const req = this.data.passwordResets.find((r) => r.id === id);
    if (!req || req.status !== 'PENDING') return null;

    req.status = 'REJECTED';
    req.reviewedAt = new Date().toISOString();
    this.save();
    return req;
  }

  public approveAllPasswordResets(): number {
    if (!this.data.passwordResets) return 0;
    const pending = this.data.passwordResets.filter((r) => r.status === 'PENDING');
    const now = new Date().toISOString();
    for (const req of pending) {
      this.data.passwords[req.userId] = req.newPasswordHash;
      req.status = 'APPROVED';
      req.reviewedAt = now;
    }
    if (pending.length > 0) {
      this.save();
    }
    return pending.length;
  }


  // Lab Operations
  public getLabs(): Lab[] {
    return this.data.labs;
  }

  public getLabById(id: string): Lab | undefined {
    return this.data.labs.find((l) => l.id === id || l.slug === id);
  }

  public addLab(lab: Lab): void {
    this.data.labs.push(lab);
    this.save();
  }

  public updateLab(lab: Lab): void {
    const idx = this.data.labs.findIndex((l) => l.id === lab.id);
    if (idx !== -1) {
      this.data.labs[idx] = lab;
      this.save();
    }
  }

  public deleteLab(id: string): void {
    this.data.labs = this.data.labs.filter((l) => l.id !== id);
    this.save();
  }

  // Session Operations
  public getSessions(): LabSession[] {
    return this.data.sessions;
  }

  public getSessionById(id: string): LabSession | undefined {
    return this.data.sessions.find((s) => s.id === id);
  }

  public getActiveSessionsByUserId(userId: string): LabSession[] {
    return this.data.sessions.filter(
      (s) => s.userId === userId && (s.status === 'RUNNING' || s.status === 'STARTING' || s.status === 'CREATING')
    );
  }

  public addSession(session: LabSession): void {
    this.data.sessions.push(session);
    this.save();
  }

  public updateSession(session: LabSession): void {
    const idx = this.data.sessions.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      this.data.sessions[idx] = session;
      this.save();
    }
  }

  // Usage & Quota Tracking
  public getUserMonthlyUsage(userId: string, yearMonth?: string): UserUsageReport {
    const user = this.getUserById(userId);
    const settings = this.getSettings();
    const defaultQuota = settings.defaultMonthlyQuotaHours || 30;
    const quotaHours = user?.monthlyQuotaHours !== undefined ? user.monthlyQuotaHours : defaultQuota;
    const isCustomQuota = user?.monthlyQuotaHours !== undefined;

    const targetYM = yearMonth || new Date().toISOString().substring(0, 7); // e.g. "2026-09"

    const userSessions = this.data.sessions.filter((s) => {
      if (s.userId !== userId) return false;
      const createdYM = (s.createdAt || '').substring(0, 7);
      const startedYM = (s.startedAt || '').substring(0, 7);
      return createdYM === targetYM || startedYM === targetYM;
    });

    let totalDurationMs = 0;
    const nowMs = Date.now();

    for (const session of userSessions) {
      const startTime = new Date(session.startedAt || session.createdAt).getTime();
      let endTime = nowMs;

      if (['STOPPED', 'EXPIRED', 'FAILED'].includes(session.status)) {
        if (session.endedAt) {
          endTime = new Date(session.endedAt).getTime();
        } else if (session.lastActivityAt) {
          endTime = new Date(session.lastActivityAt).getTime();
        } else if (session.expiresAt) {
          endTime = new Date(session.expiresAt).getTime();
        } else {
          endTime = startTime;
        }
      }

      const duration = Math.max(0, endTime - startTime);
      totalDurationMs += duration;
    }

    const usedMinutes = Math.round(totalDurationMs / (60 * 1000));
    const usedHours = Number((usedMinutes / 60).toFixed(1));
    const quotaMinutes = quotaHours * 60;
    const remainingMinutes = Math.max(0, quotaMinutes - usedMinutes);
    const remainingHours = Number((remainingMinutes / 60).toFixed(1));
    const percentUsed = quotaMinutes > 0 ? Math.min(100, Number(((usedMinutes / quotaMinutes) * 100).toFixed(1))) : 100;
    const isExceeded = usedMinutes >= quotaMinutes;
    const activeSessionsCount = this.getActiveSessionsByUserId(userId).length;

    return {
      userId,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown',
      username: user?.username || 'Unknown',
      monthlyQuotaHours: quotaHours,
      isCustomQuota,
      usedMinutes,
      usedHours,
      remainingMinutes,
      remainingHours,
      percentUsed,
      isExceeded,
      activeSessionsCount,
    };
  }

  public getAllUsersUsageReport(yearMonth?: string): UserUsageReport[] {
    return this.data.users.map((u) => this.getUserMonthlyUsage(u.id, yearMonth));
  }

  // Logs & Audit
  public addLog(level: 'info' | 'warn' | 'error', source: string, message: string, details?: any): void {
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details,
    };
    this.data.logs.unshift(log);
    if (this.data.logs.length > 500) this.data.logs.pop(); // keep last 500
    this.save();
  }

  public getLogs(): SystemLog[] {
    return this.data.logs;
  }

  public addAuditLog(userId: string, userEmail: string, action: string, details: string): void {
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(audit);
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings || defaultSettings;
  }

  public updateSettings(settings: Partial<SystemSettings>): void {
    this.data.settings = { ...this.getSettings(), ...settings };
    this.save();
  }

  public seedInitialData(seedLabs: Lab[], adminUser: User, adminPasswordHash: string): void {
    if (this.data.users.length === 0) {
      this.addUser(adminUser, adminPasswordHash);
    }

    this.data.labs = seedLabs;
    this.save();
  }
}

export const db = new FileStore();
