import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { LabSession, Lab } from '@byolabs/shared';
import { Terminal, Play, Square, Clock, ArrowRight, RefreshCw, CheckCircle2, Shield } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<LabSession[]>([]);
  const [recommendedLabs, setRecommendedLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, labsRes] = await Promise.all([
        api.getMyActiveSessions(),
        api.getLabs(),
      ]);
      setActiveSessions(sessionsRes.sessions);
      setRecommendedLabs(labsRes.labs.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStopLab = async (sessionId: string) => {
    setStoppingId(sessionId);
    try {
      await api.stopLab(sessionId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to stop lab session');
    } finally {
      setStoppingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* User Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shadow-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.name}!</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> {user?.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            You have <strong className="text-cyan-400 font-mono">{activeSessions.length}</strong> active Kubernetes lab workspace currently running.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/labs"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
          >
            <Play className="w-4 h-4" />
            <span>Browse All Labs</span>
          </Link>
        </div>
      </div>

      {/* Active Running Labs Workspace Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Terminal className="w-5 h-5 text-cyan-400 mr-2" /> Active Workspace Sessions
          </h2>
          <button onClick={fetchData} className="text-slate-400 hover:text-white text-xs flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading active sessions...</div>
        ) : activeSessions.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
            <p className="text-slate-400 font-medium">No active lab environments running right now.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select a lab from the catalog to provision your dedicated Kubernetes Pod container.
            </p>
            <Link
              to="/labs"
              className="inline-flex items-center text-cyan-400 text-sm font-semibold hover:underline mt-2"
            >
              Go to Labs Catalog <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                      {session.namespace}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{session.labName}</h3>
                    <p className="text-xs font-mono text-slate-400">Pod: {session.podName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>Created: {new Date(session.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Link
                    to={`/lab/${session.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-950/50 transition"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Open Browser Terminal</span>
                  </Link>

                  <button
                    onClick={() => handleStopLab(session.id)}
                    disabled={stoppingId === session.id}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-semibold text-xs flex items-center justify-center transition border border-slate-700 hover:border-rose-800"
                  >
                    <Square className="w-3.5 h-3.5 mr-1" />
                    {stoppingId === session.id ? 'Stopping...' : 'Stop'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Labs Quick Launch */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recommended Labs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedLabs.map((lab) => (
            <div key={lab.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-cyan-400 font-semibold">{lab.category}</span>
                  <span className="text-slate-400">{lab.difficulty}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{lab.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{lab.description}</p>
              </div>

              <Link
                to={`/labs`}
                className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs text-center transition block"
              >
                Launch Lab Workspace
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
