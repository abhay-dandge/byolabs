import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import labRoutes from './routes/labs.js';
import adminRoutes from './routes/admin.js';
import proxyRoutes from './routes/proxy.js';
import { portProxyService } from './services/portProxyService.js';
import { setupTerminalGateway } from './services/terminalGateway.js';
import { startCleanupWorker } from './services/cleanupWorker.js';
import { seedDatabase } from './db/seed.js';
import { k8sProvisioner } from './services/k8sProvisioner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  return res.json({
    status: 'ready',
    k8sAvailable: k8sProvisioner.getIsK8sAvailable(),
    timestamp: new Date().toISOString(),
  });
});

// Dynamic Container Port Proxy Route (Killercoda-style port access)
app.use('/proxy', proxyRoutes);

// Fallback asset resolver for proxied web apps requesting absolute paths (e.g. /favicon.ico, /assets/...)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/proxy') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/ready')
  ) {
    return next();
  }

  const cookieHeader = req.headers.cookie;
  const proxyCookie = cookieHeader
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('byolabs_proxy_target='));

  const referer = req.headers.referer;
  let targetInfo: { sessionId: string; port: number } | null = null;

  if (proxyCookie) {
    const val = proxyCookie.split('=')[1]?.trim();
    if (val && val.includes(':')) {
      const [sId, pStr] = val.split(':');
      targetInfo = { sessionId: sId, port: parseInt(pStr, 10) };
    }
  } else if (referer && referer.includes('/proxy/')) {
    const refMatch = referer.match(/\/proxy\/([a-zA-Z0-9_-]+)\/(\d+)/);
    if (refMatch) {
      targetInfo = { sessionId: refMatch[1], port: parseInt(refMatch[2], 10) };
    }
  }

  if (targetInfo && !isNaN(targetInfo.port)) {
    return res.redirect(`/proxy/${targetInfo.sessionId}/${targetInfo.port}${req.url}`);
  }

  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/labs', labRoutes);
app.use('/api/v1/admin', adminRoutes);

const server = http.createServer(app);

// Setup WebSocket terminal gateway for xterm.js pod exec streaming
setupTerminalGateway(server);

// Setup WebSocket port proxy for container web applications (Vite, HMR, Socket.io)
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const proxyMatch = url.pathname.match(/^\/proxy\/([a-zA-Z0-9_-]+)\/(\d+)(.*)/);
  if (proxyMatch) {
    const sessionId = proxyMatch[1];
    const targetPort = parseInt(proxyMatch[2], 10);
    const subPath = proxyMatch[3] || '/';
    portProxyService.handleWebSocketUpgrade(request, socket, head, sessionId, targetPort, subPath);
    return;
  }
});

// Initialize DB seeding & background workers
async function startServer() {
  await seedDatabase();
  startCleanupWorker(30000); // Check session expiration every 30 seconds

  server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` 🚀 BYOLabs.in API Server running on port ${PORT}`);
    console.log(` 🔌 WebSocket Terminal Gateway: ws://localhost:${PORT}`);
    console.log(` 🔑 Admin Account: admin@byolabs.in / Admin@123456`);
    console.log(` ⚙️  Kubernetes Integration: ${k8sProvisioner.getIsK8sAvailable() ? 'ACTIVE (Live K8s Cluster)' : 'SANDBOX SIMULATION (Dev Mode)'}`);
    console.log(`===================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
