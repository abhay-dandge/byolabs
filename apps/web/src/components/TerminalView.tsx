import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getToken } from '../lib/api';
import { Maximize2, Minimize2, RefreshCw, Copy, Trash2, Wifi, WifiOff } from 'lucide-react';

interface TerminalViewProps {
  sessionId: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ sessionId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const initTerminal = () => {
    if (!terminalRef.current) return;

    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: "'Fira Code', 'Consolas', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: '#090d16',
        foreground: '#f0f6fc',
        cursor: '#38bdf8',
        cursorAccent: '#000000',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#161b22',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#f1f5f9',
        brightBlack: '#475569',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    connectWebSocket(term, fitAddon);
  };

  const connectWebSocket = (term: Terminal, fitAddon: FitAddon) => {
    setConnecting(true);
    setError(null);

    const token = getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/labs/${sessionId}/terminal?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.focus();

      // Send resize event
      const dimensions = { cols: term.cols, rows: term.rows };
      ws.send(JSON.stringify({ type: 'resize', ...dimensions }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onerror = (err) => {
      console.error('[TerminalWS] Error:', err);
      setError('Terminal WebSocket connection failed');
      setConnected(false);
      setConnecting(false);
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      term.write('\r\n\x1b[31m[WebSocket Connection Closed]\x1b[0m\r\n');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });
  };

  useEffect(() => {
    initTerminal();

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, [sessionId]);

  const handleReconnect = () => {
    if (xtermRef.current && fitAddonRef.current) {
      if (wsRef.current) wsRef.current.close();
      xtermRef.current.clear();
      connectWebSocket(xtermRef.current, fitAddonRef.current);
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const handleCopySelection = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative'}`}>
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 pl-2">
            {connected ? (
              <span className="flex items-center text-emerald-400 font-sans font-medium">
                <Wifi className="w-3.5 h-3.5 mr-1 animate-pulse" /> Connected (Pod Exec)
              </span>
            ) : connecting ? (
              <span className="flex items-center text-amber-400 font-sans font-medium">
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Connecting Pod...
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-sans font-medium">
                <WifiOff className="w-3.5 h-3.5 mr-1" /> Disconnected
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopySelection}
            title="Copy Selected Text"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            title="Clear Terminal Screen"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReconnect}
            title="Reconnect Terminal Session"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => fitAddonRef.current?.fit(), 100);
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Terminal'}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Canvas */}
      <div className="flex-1 p-3 overflow-hidden" ref={terminalRef} />

      {error && (
        <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-800/50 text-rose-300 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={handleReconnect} className="underline text-rose-200 font-bold hover:text-white">
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
