import net from 'net';
import http from 'http';
import { Duplex } from 'stream';
import { spawn, ChildProcess } from 'child_process';
import { LabSession, PortInfo } from '@byolabs/shared';
import { k8sProvisioner } from './k8sProvisioner.js';
import { db } from '../db/store.js';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface ActiveForward {
  localPort: number;
  process?: ChildProcess;
  lastUsed: number;
  sessionId: string;
  targetPort: number;
}

export class PortProxyService {
  private activeForwards: Map<string, ActiveForward> = new Map();

  constructor() {
    // Periodically clean up idle port-forward tunnels (idle for > 5 minutes)
    setInterval(() => this.cleanupIdleForwards(), 30000);
  }

  private getKey(sessionId: string, targetPort: number): string {
    return `${sessionId}:${targetPort}`;
  }

  private async getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.unref();
      srv.on('error', reject);
      srv.listen(0, '127.0.0.1', () => {
        const port = (srv.address() as net.AddressInfo).port;
        srv.close(() => resolve(port));
      });
    });
  }

  private async waitForPortReady(port: number, timeoutMs = 6000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const isReady = await new Promise<boolean>((resolve) => {
        const client = net.createConnection({ host: '127.0.0.1', port }, () => {
          client.destroy();
          resolve(true);
        });
        client.on('error', () => {
          client.destroy();
          resolve(false);
        });
      });

      if (isReady) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return false;
  }

  public async ensurePortForward(session: LabSession, targetPort: number): Promise<number> {
    const key = this.getKey(session.id, targetPort);
    const existing = this.activeForwards.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing.localPort;
    }

    // In local sandbox fallback mode, connect to localhost directly
    if (session.isSandbox || !k8sProvisioner.getIsK8sAvailable()) {
      return targetPort;
    }

    const localPort = await this.getFreePort();
    const context = k8sProvisioner.getClusterContextForSession(session);
    const args = [
      ...(context ? ['--context', context] : []),
      'port-forward',
      '-n', session.namespace,
      session.podName,
      `${localPort}:${targetPort}`,
    ];

    console.log(`[PortProxy] Starting port-forward: kubectl ${args.join(' ')}`);
    const proc = spawn('kubectl', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    proc.stderr?.on('data', (d) => {
      const str = d.toString();
      if (!str.includes('Forwarding from')) {
        console.warn(`[PortProxy stderr (${key})]:`, str.trim());
      }
    });

    proc.on('exit', (code) => {
      console.log(`[PortProxy] Forward process for ${key} exited with code ${code}`);
      this.activeForwards.delete(key);
    });

    const forwardItem: ActiveForward = {
      localPort,
      process: proc,
      lastUsed: Date.now(),
      sessionId: session.id,
      targetPort,
    };
    this.activeForwards.set(key, forwardItem);

    const ready = await this.waitForPortReady(localPort, 7000);
    if (!ready) {
      console.warn(`[PortProxy] Warning: Port ${localPort} did not respond within timeout, proceeding anyway.`);
    }

    return localPort;
  }

  public async getListeningPorts(session: LabSession): Promise<PortInfo[]> {
    const detectedPorts = new Set<number>();

    if (k8sProvisioner.getIsK8sAvailable() && !session.isSandbox) {
      try {
        const context = k8sProvisioner.getClusterContextForSession(session);
        const contextArg = context ? ` --context=${context}` : '';
        const { stdout } = await execAsync(
          `kubectl${contextArg} exec -n ${session.namespace} ${session.podName} -- sh -c "cat /proc/net/tcp /proc/net/tcp6 2>/dev/null"`,
          { timeout: 5000 }
        );

        for (const line of stdout.split('\n')) {
          const parts = line.trim().split(/\s+/);
          // State 0A is TCP_LISTEN
          if (parts.length >= 4 && parts[3] === '0A') {
            const addr = parts[1];
            const hexPort = addr.split(':')[1];
            if (hexPort) {
              const portNum = parseInt(hexPort, 16);
              // Ignore SSH (22), Docker daemon (2375/2376/2377), DNS (53), and K8s internal daemon ports
              const ignoredPorts = new Set([22, 53, 2375, 2376, 2377, 6443, 10250, 10255, 10256]);
              if (portNum > 0 && portNum < 65536 && !ignoredPorts.has(portNum)) {
                detectedPorts.add(portNum);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[PortProxy] Failed to probe listening ports in pod ${session.podName}:`, err?.message || err);
      }
    }

    const portLabels: Record<number, string> = {
      80: 'HTTP Web Server',
      443: 'HTTPS Web Server',
      3000: 'React / Node / Frontend App',
      5000: 'Flask / Python / API Server',
      8000: 'Django / HTTP Server',
      8080: 'Web Service / Reverse Proxy',
      8888: 'Jupyter Notebook / Web IDE',
      9000: 'PHP-FPM / Adminer / SonarQube',
    };

    const result: PortInfo[] = [];

    // Add detected ports first
    for (const port of Array.from(detectedPorts).sort((a, b) => a - b)) {
      result.push({
        port,
        label: portLabels[port] ? `${portLabels[port]} (Active)` : 'Custom Active Service',
        isCommon: false,
      });
    }

    // Add common quick-access ports if not already detected
    const commonDefaults = [80, 3000, 5000, 8080];
    for (const p of commonDefaults) {
      if (!detectedPorts.has(p)) {
        result.push({
          port: p,
          label: portLabels[p] || 'Standard Port',
          isCommon: true,
        });
      }
    }

    return result;
  }

  public async proxyHttpRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    session: LabSession,
    targetPort: number,
    subPath: string
  ): Promise<void> {
    try {
      const localPort = await this.ensurePortForward(session, targetPort);

      // Parse incoming URL and search query params
      const incomingUrl = req.url || '/';
      const queryIndex = incomingUrl.indexOf('?');
      const queryString = queryIndex !== -1 ? incomingUrl.slice(queryIndex) : '';
      const finalPath = (subPath.startsWith('/') ? subPath : `/${subPath}`) + queryString;

      // Set cookie to identify active proxy session for sub-resource routing
      const cookieVal = `${session.id}:${targetPort}`;
      res.setHeader('Set-Cookie', [
        `byolabs_proxy_target=${cookieVal}; Path=/; SameSite=Lax`,
      ]);

      const headers = { ...req.headers };
      headers.host = `127.0.0.1:${targetPort}`;
      headers['x-forwarded-for'] = (req.socket.remoteAddress || '') as string;
      headers['x-forwarded-proto'] = 'http';
      headers['x-forwarded-host'] = (req.headers.host || '') as string;
      headers['x-forwarded-prefix'] = `/proxy/${session.id}/${targetPort}`;

      const clientReq = http.request(
        {
          host: '127.0.0.1',
          port: localPort,
          path: finalPath,
          method: req.method,
          headers,
          timeout: 30000,
        },
        (proxyRes) => {
          const contentType = proxyRes.headers['content-type'] || '';
          const isHtml = typeof contentType === 'string' && contentType.includes('text/html');

          // If HTML response, inject <base href="..."> so relative paths work automatically
          if (isHtml) {
            const chunks: Buffer[] = [];
            proxyRes.on('data', (c) => chunks.push(c));
            proxyRes.on('end', () => {
              let body = Buffer.concat(chunks).toString('utf-8');
              const prefix = (req.url && req.url.includes('/api/v1/proxy'))
                ? `/api/v1/proxy/${session.id}/${targetPort}/`
                : `/proxy/${session.id}/${targetPort}/`;
              const baseTag = `<base href="${prefix}">`;

              if (body.includes('<head>')) {
                body = body.replace('<head>', `<head>${baseTag}`);
              } else if (body.includes('<html>')) {
                body = body.replace('<html>', `<html><head>${baseTag}</head>`);
              } else {
                body = baseTag + body;
              }

              const newHeaders = { ...proxyRes.headers };
              delete newHeaders['content-length'];
              delete newHeaders['content-security-policy'];
              delete newHeaders['x-frame-options']; // Enable iframe preview

              res.writeHead(proxyRes.statusCode || 200, newHeaders);
              res.end(body);
            });
          } else {
            const newHeaders = { ...proxyRes.headers };
            delete newHeaders['content-security-policy'];
            delete newHeaders['x-frame-options'];

            res.writeHead(proxyRes.statusCode || 200, newHeaders);
            proxyRes.pipe(res);
          }
        }
      );

      clientReq.on('error', (err) => {
        console.error(`[PortProxy] Request error forwarding to ${localPort}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>BYOLabs Port Preview - 502 Bad Gateway</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
                .card { max-width: 500px; margin: 60px auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; }
                h1 { color: #f43f5e; font-size: 20px; }
                p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                code { background: #0f172a; padding: 3px 8px; border-radius: 6px; color: #38bdf8; font-family: monospace; font-size: 13px; }
                .retry-btn { margin-top: 20px; padding: 10px 20px; background: #0284c7; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; }
                .retry-btn:hover { background: #0369a1; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Service Not Running on Port ${targetPort}</h1>
                <p>No active web service was reached on port <code>${targetPort}</code> inside your container.</p>
                <p>Ensure your application is running inside the container terminal (e.g. <code>python3 -m http.server ${targetPort}</code> or <code>npm run dev</code>) and bound to <code>0.0.0.0</code> or <code>127.0.0.1</code>.</p>
                <button class="retry-btn" onclick="location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>
          `);
        }
      });

      req.pipe(clientReq);
    } catch (err: any) {
      console.error('[PortProxy] General proxy error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Port proxy initialization failed', detail: err.message }));
      }
    }
  }

  public async handleWebSocketUpgrade(
    req: http.IncomingMessage,
    socket: Duplex,
    head: Buffer,
    sessionId: string,
    targetPort: number,
    subPath: string
  ): Promise<void> {
    const session = db.getSessionById(sessionId);
    if (!session || session.status !== 'RUNNING') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const localPort = await this.ensurePortForward(session, targetPort);
      const targetSocket = net.connect(localPort, '127.0.0.1', () => {
        // Construct raw HTTP Upgrade request
        const incomingUrl = req.url || '/';
        const queryIndex = incomingUrl.indexOf('?');
        const queryString = queryIndex !== -1 ? incomingUrl.slice(queryIndex) : '';
        const finalPath = (subPath.startsWith('/') ? subPath : `/${subPath}`) + queryString;

        let upgradeReq = `${req.method} ${finalPath} HTTP/1.1\r\n`;
        for (const [k, v] of Object.entries(req.headers)) {
          if (k.toLowerCase() === 'host') {
            upgradeReq += `host: 127.0.0.1:${targetPort}\r\n`;
          } else if (Array.isArray(v)) {
            for (const item of v) upgradeReq += `${k}: ${item}\r\n`;
          } else if (v !== undefined) {
            upgradeReq += `${k}: ${v}\r\n`;
          }
        }
        upgradeReq += '\r\n';

        targetSocket.write(upgradeReq);
        if (head && head.length > 0) {
          targetSocket.write(head);
        }

        socket.pipe(targetSocket).pipe(socket);
      });

      targetSocket.on('error', (err) => {
        console.error('[PortProxy WS Error]:', err.message);
        socket.destroy();
      });

      socket.on('error', () => {
        targetSocket.destroy();
      });
    } catch (err: any) {
      console.error('[PortProxy WS Upgrade Failed]:', err.message);
      socket.destroy();
    }
  }

  public stopSessionForwards(sessionId: string): void {
    for (const [key, forward] of this.activeForwards.entries()) {
      if (forward.sessionId === sessionId) {
        console.log(`[PortProxy] Stopping forward for ${key}`);
        if (forward.process) {
          try {
            forward.process.kill();
          } catch (e) {}
        }
        this.activeForwards.delete(key);
      }
    }
  }

  private cleanupIdleForwards(): void {
    const now = Date.now();
    const maxIdleMs = 5 * 60 * 1000; // 5 minutes

    for (const [key, forward] of this.activeForwards.entries()) {
      if (now - forward.lastUsed > maxIdleMs) {
        console.log(`[PortProxy] Idle timeout reached for forward ${key}, closing tunnel`);
        if (forward.process) {
          try {
            forward.process.kill();
          } catch (e) {}
        }
        this.activeForwards.delete(key);
      }
    }
  }
}

export const portProxyService = new PortProxyService();
