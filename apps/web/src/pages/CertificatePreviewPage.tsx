import React from 'react';
import { CertificateModal } from '../components/CertificateModal';
import { Lab, LabSession, User } from '@byolabs/shared';

const mockLab: Lab = {
  id: 'lab-docker-101',
  slug: 'docker-fundamentals',
  name: 'Docker & Container Architecture Fundamentals',
  description: 'Master containerization concepts, Dockerfiles, network bridges, and volumes.',
  category: 'Docker',
  difficulty: 'Beginner',
  durationMinutes: 60,
  dockerImage: 'ubuntu:latest',
  cpuRequest: '100m',
  cpuLimit: '500m',
  memoryRequest: '128Mi',
  memoryLimit: '512Mi',
  terminalEnabled: true,
  browserAccess: false,
  instructionsMarkdown: '# Docker Fundamentals',
  tasks: [],
  isPublished: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSession: LabSession = {
  id: 'lab-sess-98217',
  userId: 'user-1',
  labId: 'lab-docker-101',
  labName: 'Docker Fundamentals',
  labSlug: 'docker-fundamentals',
  namespace: 'user-demo-ns',
  podName: 'pod-demo-123',
  status: 'RUNNING',
  completedTasks: ['task-1', 'task-2', 'task-3'],
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  createdAt: new Date().toISOString(),
};

const mockUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  username: 'alexjohnson',
  role: 'USER',
  status: 'APPROVED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const CertificatePreviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <CertificateModal
        lab={mockLab}
        session={mockSession}
        user={mockUser}
        onClose={() => {}}
      />
    </div>
  );
};

export default CertificatePreviewPage;
