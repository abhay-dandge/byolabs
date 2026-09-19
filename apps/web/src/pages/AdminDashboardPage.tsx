import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Lab, LabSession, ClusterInfo, SystemLog, AuditLog, SystemSettings, UserUsageReport } from '@byolabs/shared';
import { Shield, Users, Terminal, Cpu, HardDrive, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Edit, RefreshCw, Activity, Clock, Hourglass, Sliders, CheckCheck, Server, Layers } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'labs' | 'running' | 'cluster' | 'logs' | 'settings'>('approvals');

  const [users, setUsers] = useState<User[]>([]);
  const [usageReports, setUsageReports] = useState<UserUsageReport[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [runningLabs, setRunningLabs] = useState<(LabSession & { userEmail: string; username: string })[]>([]);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [isK8sAvailable, setIsK8sAvailable] = useState<boolean>(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Quota Modal States
  const [editingQuotaUser, setEditingQuotaUser] = useState<UserUsageReport | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(30);
  const [showGlobalQuotaModal, setShowGlobalQuotaModal] = useState<boolean>(false);
  const [globalQuotaValue, setGlobalQuotaValue] = useState<number>(30);
  const [applyGlobalToAll, setApplyGlobalToAll] = useState<boolean>(false);

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
      const [uRes, usageRes, lRes, rRes, cRes, logRes, audRes, setRes] = await Promise.all([
        api.getUsers(),
        api.getUsersUsage(),
        api.getAdminLabs(),
        api.getRunningLabs(),
        api.getClusterStatus(),
        api.getLogs(),
        api.getAuditLogs(),
        api.getSettings(),
      ]);

      setUsers(uRes.users);
      setUsageReports(usageRes.usageReports);
      setLabs(lRes.labs);
      setRunningLabs(rRes.sessions);
      setClusters(cRes.clusters || []);
      setIsK8sAvailable(cRes.isK8sAvailable);
      setLogs(logRes.logs);
      setAuditLogs(audRes.auditLogs);
      setSettings(setRes.settings);
      if (setRes.settings?.defaultMonthlyQuotaHours) {
        setGlobalQuotaValue(setRes.settings.defaultMonthlyQuotaHours);
      }
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

  const handleApproveAllUsers = async () => {
    if (confirm('Are you sure you want to approve ALL pending user registration requests?')) {
      try {
        const res = await api.approveAllUsers();
        alert(res.message);
        fetchAllData();
      } catch (err: any) {
        alert(err.message || 'Failed to approve all pending users');
      }
    }
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

  const handleOpenUserQuotaModal = (report: UserUsageReport) => {
    setEditingQuotaUser(report);
    setNewQuotaValue(report.monthlyQuotaHours);
  };

  const handleSaveUserQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotaUser) return;
    try {
      await api.updateUserQuota(editingQuotaUser.userId, Number(newQuotaValue));
      setEditingQuotaUser(null);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user quota');
    }
  };

  const handleSaveGlobalQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.bulkUpdateQuota(Number(globalQuotaValue), applyGlobalToAll);
      setShowGlobalQuotaModal(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update global quota');
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

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const pendingUsersCount = pendingUsers.length;
  const totalMonthlyHoursUsed = usageReports.reduce((acc, u) => acc + u.usedHours, 0).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Shield className="w-8 h-8 text-indigo-400 mr-3" /> Admin Infrastructure Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user approvals, control lab time limits, monitor 2 Kubernetes clusters, and inspect live pod workloads.
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
          <div className="text-xs font-mono text-slate-400 uppercase">Pending Approvals</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{pendingUsersCount}</div>
          <div className="text-xs text-slate-400 mt-1">{users.length} Total Registered Users</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Monthly Lab Hours</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{totalMonthlyHoursUsed} hrs</div>
          <div className="text-xs text-slate-400 mt-1">Default Quota: {settings?.defaultMonthlyQuotaHours || 30}h/user</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Active Running Pods</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">{runningLabs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Capacity: {settings?.maxClusterLabs || 50} max</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Active Clusters</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{clusters.length || 2} Clusters</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></span> Control Planes Ready
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 transition relative flex items-center space-x-1.5 ${activeTab === 'approvals' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
        >
          <span>User Approvals</span>
          {pendingUsersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950 text-amber-300 border border-amber-800 font-bold animate-pulse">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition relative ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          All Users & Quotas ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('cluster')}
          className={`pb-3 transition relative ${activeTab === 'cluster' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          2 K8s Clusters Resource Usage
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
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition relative ${activeTab === 'logs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          System Logs
        </button>
      </div>

      {/* TAB CONTENT: SEPARATE USER APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Top Banner with Approve All Button */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 text-amber-400 mr-2.5" /> Pending User Registration Approvals
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                There are currently <strong className="text-amber-400 font-mono text-sm">{pendingUsersCount}</strong> pending account approval request(s). Approved users get immediate access to browser lab environments with 30h quota.
              </p>
            </div>

            {pendingUsersCount > 0 && (
              <button
                onClick={handleApproveAllUsers}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950 transition transform hover:scale-105"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Approve All Pending Requests ({pendingUsersCount})</span>
              </button>
            )}
          </div>

          {pendingUsersCount === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">All User Requests Approved!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                There are no pending user registrations awaiting admin approval. New signups will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Applicant Name & Email</th>
                    <th className="p-4">Requested Username</th>
                    <th className="p-4">Registration Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="font-bold text-white text-base">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-cyan-400">@{u.username}</td>
                      <td className="p-4 text-xs text-slate-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                          PENDING APPROVAL
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950"
                        >
                          Approve Account
                        </button>
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: USERS & QUOTA MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Global Quota Control Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/50 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Lab Time Limit Settings</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default lab time limit per user: <strong className="text-cyan-400 font-mono">{settings?.defaultMonthlyQuotaHours || 30} Hours / Month</strong>. Admin can adjust individually or globally.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {pendingUsersCount > 0 && (
                <button
                  onClick={handleApproveAllUsers}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg transition"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Approve All ({pendingUsersCount})</span>
                </button>
              )}

              <button
                onClick={() => setShowGlobalQuotaModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-950 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Global Quota</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Monthly Lab Usage</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const report = usageReports.find((r) => r.userId === u.id);
                  const usedHours = report ? report.usedHours : 0;
                  const quotaHours = report ? report.monthlyQuotaHours : (settings?.defaultMonthlyQuotaHours || 30);
                  const percentUsed = report ? report.percentUsed : 0;
                  const isCustom = report ? report.isCustomQuota : false;

                  return (
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

                      {/* Monthly Lab Usage Progress Column */}
                      <td className="p-4 min-w-[200px]">
                        <div className="flex justify-between items-center text-xs font-mono mb-1">
                          <span className="font-bold text-white">{usedHours} / {quotaHours} hrs</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${isCustom ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {isCustom ? 'Custom' : '30h Default'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              percentUsed > 90 ? 'bg-rose-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {report && (
                          <button
                            onClick={() => handleOpenUserQuotaModal(report)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-700 text-indigo-300 text-xs font-semibold inline-flex items-center space-x-1 transition"
                            title="Increase/Decrease User Monthly Time Limit"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Edit Limit</span>
                          </button>
                        )}

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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal for User Quota Adjustment */}
          {editingQuotaUser && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Clock className="w-5 h-5 text-indigo-400 mr-2" /> Adjust Lab Time Limit
                  </h3>
                  <button onClick={() => setEditingQuotaUser(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>User: <strong className="text-white">{editingQuotaUser.userName}</strong> ({editingQuotaUser.userEmail})</div>
                  <div>Current Month Usage: <strong className="text-cyan-400 font-mono">{editingQuotaUser.usedHours} Hours</strong></div>
                  <div>Current Limit: <strong className="text-indigo-300 font-mono">{editingQuotaUser.monthlyQuotaHours} Hours</strong></div>
                </div>

                <form onSubmit={handleSaveUserQuota} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      New Monthly Lab Quota (Hours)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        required
                        value={newQuotaValue}
                        onChange={(e) => setNewQuotaValue(Number(e.target.value))}
                        className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm"
                      />
                      <span className="text-xs font-mono text-slate-400">Hours / Mo</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewQuotaValue(Math.max(0, newQuotaValue - 5))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                    >
                      -5 hrs
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuotaValue(newQuotaValue + 5)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                    >
                      +5 hrs
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuotaValue(newQuotaValue + 10)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                    >
                      +10 hrs
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuotaValue(30)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-mono hover:bg-slate-700"
                    >
                      Reset 30h
                    </button>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingQuotaUser(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950">
                      Save Limit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal for Global Default Quota Configuration */}
          {showGlobalQuotaModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Sliders className="w-5 h-5 text-indigo-400 mr-2" /> Global Monthly Quota Settings
                  </h3>
                  <button onClick={() => setShowGlobalQuotaModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSaveGlobalQuota} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Monthly Lab Hours (for all users)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={globalQuotaValue}
                      onChange={(e) => setGlobalQuotaValue(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="applyAllCheck"
                      checked={applyGlobalToAll}
                      onChange={(e) => setApplyGlobalToAll(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="applyAllCheck" className="text-xs text-slate-300">
                      Overwrite custom quotas and apply <strong className="text-white font-mono">{globalQuotaValue} Hours</strong> to ALL existing users.
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowGlobalQuotaModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950">
                      Save Global Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2 KUBERNETES CLUSTERS RESOURCE USAGE */}
      {activeTab === 'cluster' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex justify-between items-center shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Server className="w-6 h-6 text-cyan-400 mr-2.5" /> 2 Multi-Cluster Infrastructure Monitoring
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time workload distribution across Cluster 1 (Production) & Cluster 2 (Secondary Sandbox).
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-950 border border-emerald-800/80 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-mono font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>2/2 Clusters Online</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clusters.map((cls, idx) => (
              <div key={cls.id || idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
                {/* Cluster Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded">
                      {cls.region}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{cls.name}</h3>
                    <p className="text-xs font-mono text-slate-400">{cls.type}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Control Plane
                  </span>
                </div>

                {/* Cluster Summary Numbers */}
                <div className="grid grid-cols-3 gap-3 text-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Active Pods</div>
                    <div className="text-lg font-extrabold text-cyan-400 font-mono mt-0.5">{cls.activeLabsCount} / {cls.maxLabsCapacity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">CPU Usage</div>
                    <div className="text-lg font-extrabold text-indigo-400 font-mono mt-0.5">{cls.totalCpuUsagePercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">RAM Usage</div>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">{cls.totalMemoryUsagePercent}%</div>
                  </div>
                </div>

                {/* CPU Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>CPU Allocation</span>
                    <span>{cls.totalCpuUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${cls.totalCpuUsagePercent}%` }}></div>
                  </div>
                </div>

                {/* RAM Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Memory Allocation</span>
                    <span>{cls.totalMemoryUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${cls.totalMemoryUsagePercent}%` }}></div>
                  </div>
                </div>

                {/* Node List */}
                <div className="pt-2">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">Kubernetes Node Metrics</h4>
                  <div className="space-y-2">
                    {cls.nodes.map((n) => (
                      <div key={n.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="font-bold text-slate-200">{n.name}</span>
                          <span className="ml-2 text-[10px] text-slate-500">({n.role})</span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-400">
                          <span>CPU: {n.cpuUsage}</span>
                          <span>RAM: {n.memoryUsage}</span>
                          <span className="text-cyan-400 font-bold">{n.podsCount} pods</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            {n.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
