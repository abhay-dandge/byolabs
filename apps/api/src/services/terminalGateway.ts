import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { k8sProvisioner } from './k8sProvisioner.js';
import * as k8s from '@kubernetes/client-node';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';

import { Client as SSHClient } from 'ssh2';

const JWT_SECRET = process.env.JWT_SECRET || 'byolabs_super_secret_jwt_key_2026_change_in_production';

export function setupTerminalGateway(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Route: /api/v1/labs/:sessionId/terminal
    const match = pathname.match(/^\/api\/v1\/labs\/([a-zA-Z0-9_-]+)\/terminal$/);
    if (!match) {
      socket.destroy();
      return;
    }

    const sessionId = match[1];
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      const session = db.getSessionById(sessionId);

      if (!session) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      if (session.userId !== decoded.id && decoded.role !== 'ADMIN') {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      if (session.status !== 'RUNNING') {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, session, decoded);
      });
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', async (ws: WebSocket, request: any, session: any, user: any) => {
    console.log(`[TerminalGateway] Client connected for lab session ${session.id} (User: ${user.id})`);
    db.addLog('info', 'TerminalGateway', `User ${user.id} connected to session ${session.id}`);

    // Update last activity
    session.lastActivityAt = new Date().toISOString();
    db.updateSession(session);

    const isK8s = k8sProvisioner.getIsK8sAvailable();
    const kc = k8sProvisioner.getKubeConfig();

    if (isK8s && kc) {
      // Solution 3: Try Direct SSH2 Client Proxy over Port 22
      const sshSuccess = await connectSSHProxy(ws, session);
      if (sshSuccess) return;

      console.log('[TerminalGateway] SSH2 proxy connection skipped/failed. Trying K8s Exec stream...');
      try {
        await connectK8sExecStream(ws, session, kc);
        return;
      } catch (err: any) {
        console.warn('[TerminalGateway] K8s Exec stream error, falling back to Sandbox shell:', err?.message || err);
      }
    }

    // Fallback Sandbox Shell Execution
    connectSandboxShell(ws, session);
  });
}

async function connectSSHProxy(ws: WebSocket, session: any): Promise<boolean> {
  return new Promise((resolve) => {
    const conn = new SSHClient();
    const serviceHost = `lab-service.${session.namespace}.svc.cluster.local`;
    let isConnected = false;

    conn.on('ready', () => {
      isConnected = true;
      ws.send(`\r\n\x1b[32m✔ Connected to SSH2 Proxy [${serviceHost}:22]\x1b[0m\r\n\r\n`);

      conn.shell({ term: 'xterm-256color' }, (err, stream) => {
        if (err) {
          conn.end();
          return resolve(false);
        }

        stream.on('data', (data: any) => {
          try { ws.send(data.toString()); } catch (e) {}
        });

        stream.stderr.on('data', (data: any) => {
          try { ws.send(data.toString()); } catch (e) {}
        });

        ws.on('message', (message: any) => {
          try {
            const input = message.toString();
            if (input.startsWith('{') && input.includes('cols')) {
              const { cols, rows } = JSON.parse(input);
              stream.setWindow(rows, cols, 0, 0);
              return;
            }
            stream.write(input);
          } catch (e) {}
        });

        stream.on('close', () => {
          conn.end();
          ws.close();
        });
      });
      resolve(true);
    });

    conn.on('error', (err) => {
      if (!isConnected) resolve(false);
    });

    conn.connect({
      host: serviceHost,
      port: 22,
      username: process.env.SSH_USER || 'root',
      password: process.env.SSH_PASSWORD || 'root',
      readyTimeout: 4000,
    });
  });
}

async function connectK8sExecStream(ws: WebSocket, session: any, kc: k8s.KubeConfig) {
  const exec = new k8s.Exec(kc);

  const command = ['/bin/bash'];
  const namespace = session.namespace;
  const podName = session.podName;
  const container = 'lab-container';

  ws.send(`\r\n\x1b[32m✔ Connected to Kubernetes Pod Container [${podName}] in namespace [${namespace}]\x1b[0m\r\n\r\n`);

  try {
    const stream = await exec.exec(
      namespace,
      podName,
      container,
      command,
      process.stdout,
      process.stderr,
      process.stdin,
      true, // tty
      (status: any) => {
        console.log('[K8sExec] Stream closed with status:', status);
        ws.close();
      }
    );

    ws.on('message', (data: any) => {
      try {
        const msg = data.toString();
        // Check for resize command JSON
        if (msg.startsWith('{') && msg.includes('resize')) {
          return;
        }
        if (typeof (stream as any).send === 'function') {
          (stream as any).send(msg);
        } else if (typeof (stream as any).write === 'function') {
          (stream as any).write(msg);
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      try {
        if (typeof (stream as any).close === 'function') {
          (stream as any).close();
        } else if (typeof (stream as any).end === 'function') {
          (stream as any).end();
        }
      } catch (e) {}
    });
  } catch (err: any) {
    throw err;
  }
}

function connectSandboxShell(ws: WebSocket, session: any) {
  const isWin = os.platform() === 'win32';
  const shell = isWin ? 'powershell.exe' : 'bash';

  ws.send(`\r\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n`);
  ws.send(`\x1b[1;32m BYOLabs.in — Isolated Interactive Environment\x1b[0m\r\n`);
  ws.send(`\x1b[90m Lab ID:\x1b[0m \x1b[33m${session.id}\x1b[0m  |  \x1b[90mNamespace:\x1b[0m \x1b[34m${session.namespace}\x1b[0m  |  \x1b[90mPod:\x1b[0m \x1b[35m${session.podName}\x1b[0m\r\n`);
  ws.send(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n\r\n`);

  try {
    const proc = spawn(shell, [], {
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        PS1: `\\[\\031[1;32m\\]byolabs@${session.podName}:\\[\\031[1;34m\\]~\\$\\[\\031[0m\\] `,
      },
      cwd: os.homedir(),
    });

    proc.stdout.on('data', (data) => {
      ws.send(data.toString());
    });

    proc.stderr.on('data', (data) => {
      ws.send(data.toString());
    });

    ws.on('message', (message: any) => {
      const input = message.toString();
      // Handle resize payloads gracefully if received
      if (input.startsWith('{') && input.includes('cols')) {
        return;
      }
      proc.stdin.write(input);
    });

    proc.on('close', () => {
      ws.send('\r\n\x1b[31m[Session Terminated]\x1b[0m\r\n');
      ws.close();
    });

    ws.on('close', () => {
      try {
        proc.kill();
      } catch (e) {}
    });
  } catch (err: any) {
    ws.send(`\r\n\x1b[31mError spawning terminal session: ${err.message}\x1b[0m\r\n`);
  }
}
