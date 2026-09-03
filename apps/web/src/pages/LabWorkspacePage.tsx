import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Lab, LabSession } from '@byolabs/shared';
import { TerminalView } from '../components/TerminalView';
import { InstructionsPanel } from '../components/InstructionsPanel';
import { Terminal, Clock, RefreshCw, Square, ArrowLeft, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { CertificateModal } from '../components/CertificateModal';
import { useAuth } from '../context/AuthContext';

export const LabWorkspacePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<LabSession | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [startupCountdown, setStartupCountdown] = useState<number>(45);

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

  useEffect(() => {
    if (!session || session.status === 'RUNNING' || session.status === 'EXPIRED' || session.status === 'STOPPED') return;

    // Poll session status every 2s until RUNNING
    const pollInterval = setInterval(fetchSession, 2000);
    return () => clearInterval(pollInterval);
  }, [session?.status, sessionId]);

  useEffect(() => {
    if (session && session.status !== 'RUNNING') {
      const timer = setInterval(() => {
        setStartupCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session?.status]);

  useEffect(() => {
    if (!session) return;

    const calculateRemaining = () => {
      let targetTime: number;

      if (session.expiresAt) {
        targetTime = new Date(session.expiresAt).getTime();
      } else if (session.startedAt) {
        const durationMins = lab?.durationMinutes || 60;
        targetTime = new Date(session.startedAt).getTime() + durationMins * 60 * 1000;
      } else {
        const durationMins = lab?.durationMinutes || 60;
        targetTime = Date.now() + durationMins * 60 * 1000;
      }

      const diffSecs = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setRemainingSeconds(diffSecs);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [session, lab]);

  const formatCountdown = (totalSecs: number | null): string => {
    if (totalSecs === null) return '--:--';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

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

  const isStarting = loading || (session && (session.status === 'CREATING' || session.status === 'STARTING'));

  if (isStarting) {
    const progressPercent = Math.min(100, Math.round(((45 - startupCountdown) / 45) * 100));
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 space-y-6 text-center">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
            <Terminal className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {lab?.name || 'Provisioning Lab Workspace'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Pulling <span className="text-cyan-300 font-semibold">{lab?.dockerImage || 'container image'}</span> & scheduling Kubernetes Pod...
            </p>
          </div>

          {/* Reverse Countdown Display */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs uppercase font-mono tracking-widest text-slate-400">
              Estimated Ready In
            </div>
            <div className="text-4xl font-extrabold font-mono text-cyan-400 tracking-wider animate-pulse">
              00:{startupCountdown.toString().padStart(2, '0')}
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Step Progress Checklist */}
          <div className="text-left space-y-2.5 text-xs font-mono pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Isolated namespace & quotas initialized</span>
            </div>
            <div className="flex items-center space-x-2 text-cyan-300">
              <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
              <span>Scheduling container Pod & initializing dockerd...</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Attaching interactive xterm.js terminal stream</span>
            </div>
          </div>
        </div>
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

  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
  const isWarning = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 600; // < 10 mins
  const isCritical = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 300; // < 5 mins

  const timerBadgeStyle = isExpired
    ? 'text-rose-300 bg-rose-950/80 border-rose-800'
    : isCritical
    ? 'text-rose-400 bg-rose-950/60 border-rose-800 animate-pulse'
    : isWarning
    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
    : 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';

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

          <div className={`hidden md:flex items-center space-x-1.5 ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>{isExpired ? 'EXPIRED' : session.status}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dynamic Live Remaining Time Countdown */}
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-lg border font-mono font-semibold transition ${timerBadgeStyle}`}>
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>
              {isExpired ? 'EXPIRED (00:00)' : `Time Remaining: ${formatCountdown(remainingSeconds)}`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {session.completedTasks.length === lab.tasks.length && lab.tasks.length > 0 && (
              <button
                onClick={() => setShowCertModal(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold font-sans text-xs flex items-center space-x-1 shadow-lg shadow-amber-950/50 transition"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Claim Certificate</span>
              </button>
            )}

            <button
              onClick={handleResetLab}
              disabled={actionLoading || isExpired}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-sans font-semibold text-xs flex items-center space-x-1 transition"
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

      {showCertModal && (
        <CertificateModal
          lab={lab}
          session={session}
          user={user}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};
