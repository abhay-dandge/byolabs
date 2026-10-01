import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getToken } from '../lib/api';
import { Lab, LabSession, PortInfo } from '@byolabs/shared';
import { TerminalView } from '../components/TerminalView';
import { InstructionsPanel } from '../components/InstructionsPanel';
import { Terminal, Clock, RefreshCw, Square, ArrowLeft, CheckCircle2, AlertCircle, Award, Globe, ExternalLink, Columns } from 'lucide-react';
import { CertificateModal } from '../components/CertificateModal';
import { PortPreviewPanel } from '../components/PortPreviewPanel';
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
  const isDockerLab = lab?.category === 'Docker' || lab?.category === 'Podman' || lab?.slug?.includes('docker') || lab?.slug?.includes('podman') || lab?.dockerImage?.includes('docker') || lab?.dockerImage?.includes('podman');
  const initialCountdown = isDockerLab ? 90 : 30;
  const [startupCountdown, setStartupCountdown] = useState<number>(90);

  // Port Preview States
  const [detectedPorts, setDetectedPorts] = useState<PortInfo[]>([]);
  const [currentPreviewPort, setCurrentPreviewPort] = useState<number>(8080);
  const [activeRightTab, setActiveRightTab] = useState<'terminal' | 'preview' | 'split'>('terminal');
  const [showPortsDropdown, setShowPortsDropdown] = useState<boolean>(false);
  const [customPortInput, setCustomPortInput] = useState<string>('');

  const fetchPorts = async () => {
    if (!sessionId) return;
    try {
      const res = await api.getSessionPorts(sessionId);
      setDetectedPorts(res.ports || []);
      const activePort = res.ports?.find((p) => !p.isCommon);
      if (activePort && currentPreviewPort === 8080) {
        setCurrentPreviewPort(activePort.port);
      }
    } catch (e) {
      // non-fatal
    }
  };

  useEffect(() => {
    if (session && session.status === 'RUNNING') {
      fetchPorts();
      const interval = setInterval(fetchPorts, 8000);
      return () => clearInterval(interval);
    }
  }, [session?.status, sessionId]);

  useEffect(() => {
    if (lab) {
      setStartupCountdown(isDockerLab ? 90 : 30);
    }
  }, [lab?.id]);

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
    const elapsed = Math.max(0, initialCountdown - startupCountdown);
    const progressPercent = Math.min(100, Math.round((elapsed / initialCountdown) * 100));

    const minsLeft = Math.floor(startupCountdown / 60);
    const secsLeft = startupCountdown % 60;
    const formattedTimer = `${minsLeft.toString().padStart(2, '0')}:${secsLeft.toString().padStart(2, '0')}`;

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
              {isDockerLab ? (
                <span>Executing <code className="text-cyan-300 font-semibold">apt update && curl | sh</code> to install Docker...</span>
              ) : (
                <span>Scheduling Kubernetes Pod & attaching workspace...</span>
              )}
            </p>
          </div>

          {/* Reverse Countdown Display */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs uppercase font-mono tracking-widest text-slate-400">
              Estimated Ready In
            </div>
            <div className="text-4xl font-extrabold font-mono text-cyan-400 tracking-wider animate-pulse">
              {formattedTimer}
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
              <span>Kubernetes pod created & namespace isolated</span>
            </div>
            {isDockerLab ? (
              <>
                <div className={`flex items-center space-x-2 ${elapsed >= 10 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                  {elapsed >= 10 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />}
                  <span>Updating apt repositories & installing curl</span>
                </div>
                <div className={`flex items-center space-x-2 ${elapsed >= 80 ? 'text-emerald-400' : elapsed >= 25 ? 'text-cyan-300' : 'text-slate-500'}`}>
                  {elapsed >= 80 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : elapsed >= 25 ? <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
                  <span>Running `curl -fsSL https://get.docker.com | sh`</span>
                </div>
                <div className={`flex items-center space-x-2 ${elapsed >= 110 ? 'text-emerald-400' : elapsed >= 80 ? 'text-cyan-300' : 'text-slate-500'}`}>
                  {elapsed >= 110 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : elapsed >= 80 ? <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
                  <span>Starting Docker daemon & launching interactive shell</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 text-cyan-300">
                <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
                <span>Scheduling container Pod & attaching interactive shell...</span>
              </div>
            )}
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
            {/* Ports & Web Preview Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPortsDropdown(!showPortsDropdown);
                  fetchPorts();
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold flex items-center space-x-1.5 transition ${
                  detectedPorts.some((p) => !p.isCommon)
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 hover:bg-cyan-900'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Container Ports & Live Web Preview"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ports & Preview</span>
                {detectedPorts.some((p) => !p.isCommon) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                )}
              </button>

              {showPortsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                      <Globe className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Container Port Access
                    </h4>
                    <button
                      onClick={fetchPorts}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Refresh listening ports"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Active Detected Ports */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Detected Active Services</div>
                    {detectedPorts.filter((p) => !p.isCommon).length === 0 ? (
                      <div className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
                        No running service detected yet. Start your server inside the container (e.g. on port 8080).
                      </div>
                    ) : (
                      detectedPorts
                        .filter((p) => !p.isCommon)
                        .map((dp) => (
                          <div
                            key={dp.port}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-emerald-900/60 text-xs font-mono"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="font-bold text-emerald-300">:{dp.port}</span>
                              <span className="text-[10px] text-slate-400 font-sans truncate max-w-[100px]">{dp.label?.replace(' (Active)', '')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setCurrentPreviewPort(dp.port);
                                  setActiveRightTab('preview');
                                  setShowPortsDropdown(false);
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] font-sans transition"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => {
                                  window.open(`/api/v1/proxy/${session.id}/${dp.port}/?token=${encodeURIComponent(getToken() || '')}`, '_blank');
                                  setShowPortsDropdown(false);
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Quick Launch Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Quick Access Ports</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[80, 3000, 5000, 8080].map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setCurrentPreviewPort(p);
                            setActiveRightTab('preview');
                            setShowPortsDropdown(false);
                          }}
                          className="py-1 px-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-200 text-center transition"
                        >
                          :{p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Port Launcher */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const p = parseInt(customPortInput, 10);
                      if (!isNaN(p) && p > 0 && p < 65536) {
                        setCurrentPreviewPort(p);
                        setActiveRightTab('preview');
                        setCustomPortInput('');
                        setShowPortsDropdown(false);
                      }
                    }}
                    className="pt-2 border-t border-slate-800 flex items-center space-x-1.5"
                  >
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      placeholder="Custom port..."
                      value={customPortInput}
                      onChange={(e) => setCustomPortInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                    >
                      Open
                    </button>
                  </form>
                </div>
              )}
            </div>

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
        {/* Left Pane: Instructions & Tasks (35% -> col-span-5) */}
        <div className="lg:col-span-5 h-full overflow-hidden">
          <InstructionsPanel lab={lab} session={session} onSessionUpdate={(s) => setSession(s)} />
        </div>

        {/* Right Pane: Browser Terminal & Live Web Preview (65% -> col-span-7) */}
        <div className="lg:col-span-7 h-full flex flex-col overflow-hidden space-y-2">
          {/* Right Pane Header Tab Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex-shrink-0 text-xs font-mono">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveRightTab('terminal')}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                  activeRightTab === 'terminal' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                <span>Terminal</span>
              </button>

              <button
                onClick={() => {
                  setActiveRightTab('preview');
                  fetchPorts();
                }}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                  activeRightTab === 'preview' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                <span>Web Preview (:{currentPreviewPort})</span>
              </button>

              <button
                onClick={() => {
                  setActiveRightTab('split');
                  fetchPorts();
                }}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                  activeRightTab === 'split' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Split View (Terminal & Web Preview)"
              >
                <Columns className="w-3.5 h-3.5 mr-1" />
                <span>Split</span>
              </button>
            </div>

            {activeRightTab !== 'terminal' && (
              <button
                onClick={() => window.open(`/api/v1/proxy/${session.id}/${currentPreviewPort}/?token=${encodeURIComponent(getToken() || '')}`, '_blank')}
                className="text-slate-400 hover:text-cyan-400 text-[11px] flex items-center space-x-1"
                title="Open port in new tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Popout Tab</span>
              </button>
            )}
          </div>

          {/* Right Pane Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'terminal' && (
              <div className="h-full">
                <TerminalView sessionId={session.id} />
              </div>
            )}

            {activeRightTab === 'preview' && (
              <div className="h-full">
                <PortPreviewPanel
                  sessionId={session.id}
                  currentPort={currentPreviewPort}
                  onPortChange={setCurrentPreviewPort}
                  detectedPorts={detectedPorts}
                  onRefreshPorts={fetchPorts}
                  onClose={() => setActiveRightTab('terminal')}
                />
              </div>
            )}

            {activeRightTab === 'split' && (
              <div className="h-full flex flex-col gap-2">
                <div className="h-1/2 overflow-hidden">
                  <TerminalView sessionId={session.id} />
                </div>
                <div className="h-1/2 overflow-hidden">
                  <PortPreviewPanel
                    sessionId={session.id}
                    currentPort={currentPreviewPort}
                    onPortChange={setCurrentPreviewPort}
                    detectedPorts={detectedPorts}
                    onRefreshPorts={fetchPorts}
                    onClose={() => setActiveRightTab('terminal')}
                  />
                </div>
              </div>
            )}
          </div>
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
