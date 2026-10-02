import React, { useState, useRef } from 'react';
import { ExternalLink, RefreshCw, Globe, ArrowLeft, ArrowRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { getToken } from '../lib/api';
import { PortInfo } from '@byolabs/shared';

interface PortPreviewPanelProps {
  sessionId: string;
  currentPort: number;
  onPortChange: (port: number) => void;
  onClose?: () => void;
  detectedPorts?: PortInfo[];
  onRefreshPorts?: () => void;
}

export const PortPreviewPanel: React.FC<PortPreviewPanelProps> = ({
  sessionId,
  currentPort,
  onPortChange,
  onClose,
  detectedPorts = [],
  onRefreshPorts,
}) => {
  const [customPortInput, setCustomPortInput] = useState<string>('');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const token = getToken() || '';
  const proxyUrl = `/api/v1/proxy/${sessionId}/${currentPort}/?token=${encodeURIComponent(token)}`;

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    if (onRefreshPorts) {
      onRefreshPorts();
    }
  };

  const handleCustomPortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const port = parseInt(customPortInput, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      onPortChange(port);
      setCustomPortInput('');
      setIsLoading(true);
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleOpenNewTab = () => {
    window.open(proxyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Mock Browser Header Bar */}
      <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Port selector buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold px-1.5 flex items-center">
            <Globe className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Port:
          </span>

          {[80, 3000, 5000, 8080].map((p) => {
            const isSelected = p === currentPort;
            return (
              <button
                key={p}
                onClick={() => {
                  onPortChange(p);
                  setIsLoading(true);
                  setIframeKey((k) => k + 1);
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                :{p}
              </button>
            );
          })}

          {/* If there's an active detected port not in the common 4, show it */}
          {detectedPorts
            .filter((dp) => ![80, 3000, 5000, 8080].includes(dp.port))
            .map((dp) => (
              <button
                key={dp.port}
                onClick={() => {
                  onPortChange(dp.port);
                  setIsLoading(true);
                  setIframeKey((k) => k + 1);
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition flex items-center space-x-1 ${
                  dp.port === currentPort
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>:{dp.port}</span>
              </button>
            ))}
        </div>

        {/* Center: Custom Port Input & Browser Controls */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reload Web Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Mock URL Bar */}
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 min-w-0">
            <span className="text-slate-500 mr-1 select-none">http://</span>
            <span className="text-slate-300 select-none">byolabs/</span>
            <span className="text-cyan-400 font-bold truncate">port-{currentPort}</span>
            <span className="text-slate-500">/</span>
          </div>

          <form onSubmit={handleCustomPortSubmit} className="flex items-center space-x-1">
            <input
              type="number"
              min="1"
              max="65535"
              placeholder="Port..."
              value={customPortInput}
              onChange={(e) => setCustomPortInput(e.target.value)}
              className="w-16 px-1.5 py-1 rounded bg-slate-950 border border-slate-800 text-white text-[11px] font-mono text-center focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
            >
              Go
            </button>
          </form>
        </div>

        {/* Right: Popout & Close */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleOpenNewTab}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-[11px] flex items-center space-x-1 transition shadow-sm"
            title="Open port preview in a separate browser tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open in Tab</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="flex-1 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs font-mono text-slate-400">
              Connecting to container port <span className="text-cyan-300 font-bold">{currentPort}</span>...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={proxyUrl}
          title={`Pod Port ${currentPort} Preview`}
          className="w-full h-full border-0 focus:outline-none"
          tabIndex={0}
          onLoad={() => setIsLoading(false)}
          allow="autoplay; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
