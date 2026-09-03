import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Lab, LabSession, ClusterStatus, SystemLog, AuditLog, SystemSettings } from '@byolabs/shared';
import { Shield, Users, Terminal, Cpu, HardDrive, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Edit, RefreshCw, Activity } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'labs' | 'running' | 'cluster' | 'logs' | 'settings'>('users');

  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [runningLabs, setRunningLabs] = useState<(LabSession & { userEmail: string; username: string })[]>([]);
  const [cluster, setCluster] = useState<ClusterStatus | null>(null);
  const [isK8sAvailable, setIsK8sAvailable] = useState<boolean>(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // New Lab Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newLabSlug, setNewLabSlug] = useState('');
  const [newLabCategory, setNewLabCategory] = useState<any>('Linux');
  const [newLabImage, setNewLabImage] = useState('ubuntu:latest');
  const [newLabCpu, setNewLabCpu] = useState('1');
  const [newLabMemory, setNewLabMemory] = useState('1Gi');
  const [newLabInstructions, setNewLabInstructions] = useState('# New Lab\nWelcome to your lab environment.');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes, rRes, cRes, logRes, audRes, setRes] = await Promise.all([
        api.getUsers(),
        api.getAdminLabs(),
        api.getRunningLabs(),
        api.getClusterStatus(),
        api.getLogs(),
        api.getAuditLogs(),
        api.getSettings(),
      ]);

      setUsers(uRes.users);
      setLabs(lRes.labs);
      setRunningLabs(rRes.sessions);
      setCluster(cRes.cluster);
      setIsK8sAvailable(cRes.isK8sAvailable);
      setLogs(logRes.logs);
      setAuditLogs(audRes.auditLogs);
      setSettings(setRes.settings);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApproveUser = async (id: string) => {
    await api.approveUser(id);
    fetchAllData();
  };

  const handleRejectUser = async (id: string) => {
    await api.rejectUser(id);
    fetchAllData();
  };

  const handleSuspendUser = async (id: string) => {
    await api.suspendUser(id);
    fetchAllData();
  };

  const handleReactivateUser = async (id: string) => {
    await api.reactivateUser(id);
    fetchAllData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await api.deleteUser(id);
      fetchAllData();
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLab({
        name: newLabName,
        slug: newLabSlug || newLabName.toLowerCase().replace(/\s+/g, '-'),
        category: newLabCategory,
        dockerImage: newLabImage,
        cpuLimit: newLabCpu,
        memoryLimit: newLabMemory,
        instructionsMarkdown: newLabInstructions,
        tasks: [],
      });
      setShowCreateModal(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create lab');
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (confirm('Delete this lab configuration?')) {
      await api.deleteLab(id);
      fetchAllData();
    }
  };

  const handleForceStop = async (sessionId: string) => {
    await api.forceStopSession(sessionId);
    fetchAllData();
  };

  const pendingUsersCount = users.filter((u) => u.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Shield className="w-8 h-8 text-indigo-400 mr-3" /> Admin Infrastructure Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage users, approve accounts, publish lab catalog specs, and monitor live Kubernetes pod workloads.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Infrastructure Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Total Users</div>
          <div className="text-2xl font-extrabold text-white mt-1">{users.length}</div>
          <div className="text-xs text-amber-400 mt-1 font-semibold">{pendingUsersCount} Pending Approval</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Active Running Pods</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{runningLabs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Capacity: {settings?.maxClusterLabs || 50} max</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">K8s Mode</div>
          <div className="text-base font-bold text-white mt-1 truncate">
            {isK8sAvailable ? 'Live Cluster' : 'Sandbox Runner'}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Control Plane: Ready</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Cluster CPU / RAM</div>
          <div className="text-xl font-extrabold text-indigo-400 mt-1">
            {cluster?.totalCpuUsagePercent || 34}% / {cluster?.totalMemoryUsagePercent || 45}%
          </div>
          <div className="text-xs text-slate-400 mt-1">2 Nodes Healthy</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition relative ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Users Management {pendingUsersCount > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-950 text-amber-300 font-bold">{pendingUsersCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-3 transition relative ${activeTab === 'labs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Lab Specs Catalog ({labs.length})
        </button>
        <button
          onClick={() => setActiveTab('running')}
          className={`pb-3 transition relative ${activeTab === 'running' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Active Pods ({runningLabs.length})
        </button>
        <button
          onClick={() => setActiveTab('cluster')}
          className={`pb-3 transition relative ${activeTab === 'cluster' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Cluster Status
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition relative ${activeTab === 'logs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          System Logs
        </button>
      </div>

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Username</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-cyan-400">{u.username}</td>
                  <td className="p-4 font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        u.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : u.status === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          className="px-3 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {u.status === 'APPROVED' && u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleSuspendUser(u.id)}
                        className="px-3 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs"
                      >
                        Suspend
                      </button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleReactivateUser(u.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs"
                      >
                        Reactivate
                      </button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: LABS CRUD */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Lab Catalog Definitions</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Lab</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labs.map((l) => (
              <div key={l.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{l.category}</span>
                    <h3 className="text-lg font-bold text-white mt-1">{l.name}</h3>
                    <p className="text-xs font-mono text-slate-400">Image: {l.dockerImage}</p>
                  </div>
                  <button onClick={() => handleDeleteLab(l.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-400">{l.description}</div>

                <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <span>CPU Limit: {l.cpuLimit}</span>
                  <span>RAM Limit: {l.memoryLimit}</span>
                  <span>Duration: {l.durationMinutes}m</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Lab Creation */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
                <h3 className="text-xl font-bold text-white">Create New Lab Specification</h3>
                <form onSubmit={handleCreateLab} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Lab Name</label>
                    <input
                      type="text"
                      required
                      value={newLabName}
                      onChange={(e) => setNewLabName(e.target.value)}
                      placeholder="Ansible Automation Basics"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Docker Image</label>
                    <input
                      type="text"
                      required
                      value={newLabImage}
                      onChange={(e) => setNewLabImage(e.target.value)}
                      placeholder="ubuntu:24.04 or ghcr.io/byolabs/ansible"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">CPU Limit</label>
                      <input
                        type="text"
                        value={newLabCpu}
                        onChange={(e) => setNewLabCpu(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Memory Limit</label>
                      <input
                        type="text"
                        value={newLabMemory}
                        onChange={(e) => setNewLabMemory(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Instructions Markdown</label>
                    <textarea
                      rows={4}
                      value={newLabInstructions}
                      onChange={(e) => setNewLabInstructions(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold">
                      Publish Lab
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RUNNING LABS */}
      {activeTab === 'running' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Session ID / Lab</th>
                <th className="p-4">User</th>
                <th className="p-4">Namespace / Pod</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {runningLabs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold text-white">{s.labName}</div>
                    <div className="text-xs font-mono text-cyan-400">{s.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-semibold text-slate-200">{s.userEmail}</div>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    <div>{s.namespace}</div>
                    <div className="text-slate-500">{s.podName}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleForceStop(s.id)}
                      className="px-3 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold"
                    >
                      Force Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: CLUSTER */}
      {activeTab === 'cluster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cluster?.nodes.map((node) => (
            <div key={node.name} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg font-mono">{node.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {node.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div>Role: {node.role}</div>
                <div>CPU: {node.cpuUsage}</div>
                <div>RAM: {node.memoryUsage}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#090d16] p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex space-x-3">
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="text-cyan-400">[{log.source}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
