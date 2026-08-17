import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import labRoutes from './routes/labs.js';
import adminRoutes from './routes/admin.js';
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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/labs', labRoutes);
app.use('/api/v1/admin', adminRoutes);

const server = http.createServer(app);

// Setup WebSocket terminal gateway for xterm.js pod exec streaming
setupTerminalGateway(server);

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
