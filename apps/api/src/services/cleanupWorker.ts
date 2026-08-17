import { db } from '../db/store.js';
import { k8sProvisioner } from './k8sProvisioner.js';

export function startCleanupWorker(intervalMs: number = 30000) {
  console.log(`[CleanupWorker] Background session cleanup worker started (Interval: ${intervalMs}ms)`);

  setInterval(async () => {
    try {
      const now = new Date();
      const sessions = db.getSessions();
      const settings = db.getSettings();

      const activeSessions = sessions.filter(
        (s) => s.status === 'RUNNING' || s.status === 'STARTING' || s.status === 'CREATING'
      );

      for (const session of activeSessions) {
        let isExpired = false;
        let reason = '';

        // 1. Check Max Duration expiry
        if (session.expiresAt && new Date(session.expiresAt) < now) {
          isExpired = true;
          reason = 'Maximum session duration reached';
        }

        // 2. Check Idle Timeout expiry
        if (!isExpired && session.lastActivityAt) {
          const idleLimitMs = (settings.defaultIdleTimeoutMinutes || 30) * 60 * 1000;
          const lastActiveTime = new Date(session.lastActivityAt).getTime();
          if (now.getTime() - lastActiveTime > idleLimitMs) {
            isExpired = true;
            reason = 'Idle timeout exceeded (No terminal activity)';
          }
        }

        if (isExpired) {
          console.log(`[CleanupWorker] Expiring session ${session.id}: ${reason}`);
          db.addLog('info', 'CleanupWorker', `Expiring session ${session.id}: ${reason}`);

          session.status = 'EXPIRED';
          session.errorMessage = reason;
          db.updateSession(session);

          // Teardown Kubernetes resources asynchronously
          try {
            await k8sProvisioner.deleteLab(session);
          } catch (err: any) {
            console.error(`[CleanupWorker] Cleanup error for session ${session.id}:`, err?.message || err);
          }
        }
      }
    } catch (err) {
      console.error('[CleanupWorker] Loop error:', err);
    }
  }, intervalMs);
}
