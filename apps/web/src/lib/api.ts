import { User, Lab, LabSession, ClusterStatus, SystemLog, AuditLog, SystemSettings } from '@byolabs/shared';

const API_BASE = '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('byolabs_token');
}

export function setToken(token: string) {
  localStorage.setItem('byolabs_token', token);
}

export function removeToken() {
  localStorage.removeItem('byolabs_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'API Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: any) => request<{ message: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: User }>('/auth/me'),

  // Labs
  getLabs: () => request<{ labs: Lab[] }>('/labs'),
  getLabById: (id: string) => request<{ lab: Lab }>(`/labs/${id}`),
  getMyActiveSessions: () => request<{ sessions: LabSession[] }>('/labs/my-labs/active'),
  getSession: (sessionId: string) => request<{ session: LabSession; lab: Lab }>(`/labs/sessions/${sessionId}`),
  startLab: (labId: string) => request<{ message: string; session: LabSession }>(`/labs/${labId}/start`, { method: 'POST' }),
  stopLab: (sessionId: string) => request<{ message: string; session: LabSession }>(`/labs/sessions/${sessionId}/stop`, { method: 'POST' }),
  resetLab: (sessionId: string) => request<{ message: string; session: LabSession }>(`/labs/sessions/${sessionId}/reset`, { method: 'POST' }),
  validateTask: (sessionId: string, taskId: string) => request<{ success: boolean; message: string; session: LabSession }>(`/labs/sessions/${sessionId}/tasks/${taskId}/validate`, { method: 'POST' }),

  // Admin
  getUsers: () => request<{ users: User[] }>('/admin/users'),
  approveUser: (id: string) => request<{ message: string; user: User }>(`/admin/users/${id}/approve`, { method: 'POST' }),
  rejectUser: (id: string) => request<{ message: string; user: User }>(`/admin/users/${id}/reject`, { method: 'POST' }),
  suspendUser: (id: string) => request<{ message: string; user: User }>(`/admin/users/${id}/suspend`, { method: 'POST' }),
  reactivateUser: (id: string) => request<{ message: string; user: User }>(`/admin/users/${id}/reactivate`, { method: 'POST' }),
  deleteUser: (id: string) => request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminLabs: () => request<{ labs: Lab[] }>('/admin/labs'),
  createLab: (data: Partial<Lab>) => request<{ message: string; lab: Lab }>('/admin/labs', { method: 'POST', body: JSON.stringify(data) }),
  updateLab: (id: string, data: Partial<Lab>) => request<{ message: string; lab: Lab }>(`/admin/labs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLab: (id: string) => request<{ message: string }>(`/admin/labs/${id}`, { method: 'DELETE' }),

  getRunningLabs: () => request<{ sessions: (LabSession & { userEmail: string; username: string })[] }>('/admin/running-labs'),
  forceStopSession: (sessionId: string) => request<{ message: string }>(`/admin/running-labs/${sessionId}/stop`, { method: 'POST' }),

  getClusterStatus: () => request<{ cluster: ClusterStatus; isK8sAvailable: boolean }>('/admin/cluster'),
  getLogs: () => request<{ logs: SystemLog[] }>('/admin/logs'),
  getAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/admin/audit'),
  getSettings: () => request<{ settings: SystemSettings }>('/admin/settings'),
  updateSettings: (data: Partial<SystemSettings>) => request<{ message: string; settings: SystemSettings }>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
