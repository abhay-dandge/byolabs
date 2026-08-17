import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Lab, LabSession } from '@byolabs/shared';
import { TerminalView } from '../components/TerminalView';
import { InstructionsPanel } from '../components/InstructionsPanel';
import { Terminal, Clock, RefreshCw, Square, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const LabWorkspacePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<LabSession | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSession = async () => {
    if (!sessionId) return;
    try {
      const res = await api.getSession(sessionId);
      setSession(res.session);
      setLab(res.lab);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const handleStopLab = async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      await api.stopLab(sessionId);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to stop lab');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetLab = async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      const res = await api.resetLab(sessionId);
      setSession(res.session);
    } catch (err: any) {
      alert(err.message || 'Failed to reset lab');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6 text-cyan-400" />
        </div>
        <p className="text-slate-300 font-mono text-sm">Provisioning & attaching to Kubernetes Pod...</p>
      </div>
    );
  }

  if (error || !session || !lab) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lab Workspace Unavailable</h2>
        <p className="text-xs text-slate-400">{error || 'Session missing'}</p>
        <Link to="/labs" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 text-sm font-semibold">
          Return to Labs Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.1rem)] flex flex-col overflow-hidden bg-slate-950">
      {/* Workspace Header Bar */}
      <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0 text-xs font-mono">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-white flex items-center transition" title="Back to Dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Link>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm font-sans">{lab.name}</span>
            <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 text-[10px]">
              {session.namespace}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{session.status}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span>Time Remaining: ~{lab.durationMinutes}m</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetLab}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans font-semibold text-xs flex items-center space-x-1 transition"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleStopLab}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 font-sans font-semibold text-xs flex items-center space-x-1 transition"
            >
              <Square className="w-3 h-3 text-rose-400" />
              <span>Stop Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Pane: Instructions & Tasks (35% -> col-span-4) */}
        <div className="lg:col-span-5 h-full overflow-hidden">
          <InstructionsPanel lab={lab} session={session} onSessionUpdate={(s) => setSession(s)} />
        </div>

        {/* Right Pane: Browser Terminal (65% -> col-span-7) */}
        <div className="lg:col-span-7 h-full overflow-hidden">
          <TerminalView sessionId={session.id} />
        </div>
      </div>
    </div>
  );
};
