export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  monthlyQuotaHours?: number;
  createdAt: string;
  updatedAt: string;
}

export type LabCategory = 
  | 'Linux'
  | 'Docker'
  | 'Kubernetes'
  | 'Git'
  | 'Ansible'
  | 'Terraform'
  | 'Networking'
  | 'Cloud & AWS'
  | 'CI/CD'
  | 'Scripting';

export type LabDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface LabTask {
  id: string;
  title: string;
  description: string;
  hint?: string;
  validationScript?: string;
}

export interface Lab {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: LabCategory;
  difficulty: LabDifficulty;
  durationMinutes: number;
  dockerImage: string;
  cpuRequest: string;
  cpuLimit: string;
  memoryRequest: string;
  memoryLimit: string;
  storage?: string;
  environmentVariables?: Record<string, string>;
  startupCommand?: string;
  terminalEnabled: boolean;
  browserAccess: boolean;
  instructionsMarkdown: string;
  tasks: LabTask[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LabSessionStatus = 
  | 'CREATING'
  | 'STARTING'
  | 'RUNNING'
  | 'IDLE'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'EXPIRED';

export interface LabSession {
  id: string;
  userId: string;
  labId: string;
  labName: string;
  labSlug: string;
  namespace: string;
  podName: string;
  status: LabSessionStatus;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  expiresAt?: string;
  lastActivityAt?: string;
  completedTasks: string[];
  isSandbox?: boolean;
}

export interface UserUsageReport {
  userId: string;
  userName: string;
  userEmail: string;
  username: string;
  monthlyQuotaHours: number;
  isCustomQuota: boolean;
  usedMinutes: number;
  usedHours: number;
  remainingMinutes: number;
  remainingHours: number;
  percentUsed: number;
  isExceeded: boolean;
  activeSessionsCount: number;
}

export interface NodeMetrics {
  name: string;
  status: 'Ready' | 'NotReady';
  role: 'control-plane' | 'worker';
  cpuUsage: string;
  memoryUsage: string;
  podsCount: number;
}

export interface ClusterInfo {
  id: string;
  name: string;
  region: string;
  type: 'Production K8s Cluster' | 'Development / Sandbox Cluster';
  controlPlaneReady: boolean;
  activeLabsCount: number;
  maxLabsCapacity: number;
  nodes: NodeMetrics[];
  totalCpuUsagePercent: number;
  totalMemoryUsagePercent: number;
}

export interface MultiClusterStatus {
  clusters: ClusterInfo[];
  totalActiveLabsCount: number;
  totalMaxCapacity: number;
  overallCpuUsagePercent: number;
  overallMemoryUsagePercent: number;
}

export interface ClusterStatus {
  controlPlaneReady: boolean;
  activeLabsCount: number;
  maxLabsCapacity: number;
  nodes: NodeMetrics[];
  totalCpuUsagePercent: number;
  totalMemoryUsagePercent: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: any;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  maxActiveLabsPerUser: number;
  maxClusterLabs: number;
  defaultLabTimeoutMinutes: number;
  defaultIdleTimeoutMinutes: number;
  defaultMonthlyQuotaHours: number;
  requireAdminApproval: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  emailOrUsername: string;
  newPassword?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  resetUrl?: string;
  requestId?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export type PasswordResetStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PasswordResetItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: PasswordResetStatus;
  createdAt: string;
  reviewedAt?: string;
}

