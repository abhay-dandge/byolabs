export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
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
  expiresAt?: string;
  lastActivityAt?: string;
  completedTasks: string[];
}

export interface NodeMetrics {
  name: string;
  status: 'Ready' | 'NotReady';
  role: 'control-plane' | 'worker';
  cpuUsage: string;
  memoryUsage: string;
  podsCount: number;
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
  requireAdminApproval: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}
