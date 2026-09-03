import fs from 'fs';
import path from 'path';
import { User, Lab, LabSession, SystemLog, AuditLog, SystemSettings } from '@byolabs/shared';

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  labs: Lab[];
  sessions: LabSession[];
  logs: SystemLog[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DB_PATH = process.env.DATABASE_PATH || './byolabs_db.json';

const defaultSettings: SystemSettings = {
  maxActiveLabsPerUser: 2,
  maxClusterLabs: 50,
  defaultLabTimeoutMinutes: 60,
  defaultIdleTimeoutMinutes: 30,
  requireAdminApproval: true,
};

class FileStore {
  private data: DatabaseSchema;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(DB_PATH);
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading DB file, initializing fresh DB:', err);
    }
    return {
      users: [],
      passwords: {},
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

    // Remove all Docker labs from database
    const initialCount = this.data.labs.length;
    this.data.labs = this.data.labs.filter((l) => l.category !== 'Docker' && !l.slug.includes('docker') && !l.id.includes('docker'));
    let modified = this.data.labs.length !== initialCount;

    for (const seedLab of seedLabs) {
      const idx = this.data.labs.findIndex((l) => l.id === seedLab.id || l.slug === seedLab.slug);
      if (idx === -1) {
        this.data.labs.push(seedLab);
        modified = true;
      } else {
        // Merge seed lab definitions into persistent store
        this.data.labs[idx] = {
          ...this.data.labs[idx],
          ...seedLab,
        };
        modified = true;
      }
    }

    if (modified || this.data.labs.length === 0) {
      if (this.data.labs.length === 0) {
        this.data.labs = seedLabs;
      }
      this.save();
    }
  }
}

export const db = new FileStore();
