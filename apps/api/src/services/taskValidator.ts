import { LabSession, LabTask } from '@byolabs/shared';
import { db } from '../db/store.js';
import { k8sProvisioner } from './k8sProvisioner.js';
import * as k8s from '@kubernetes/client-node';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TaskValidatorService {
  public async validateTask(session: LabSession, task: LabTask): Promise<{ success: boolean; message: string }> {
    if (!task.validationScript) {
      return { success: true, message: 'Task auto-marked as completed!' };
    }

    db.addLog('info', 'TaskValidator', `Validating task ${task.id} for session ${session.id}`);

    const isK8s = k8sProvisioner.getIsK8sAvailable();
    const kc = k8sProvisioner.getKubeConfigForSession(session) || k8sProvisioner.getKubeConfig();

    if (isK8s && !session.isSandbox) {
      // 1. Try Native Kubernetes API Exec stream using @kubernetes/client-node
      if (kc) {
        try {
          const k8sResult = await this.execK8sValidation(session, task.validationScript, kc);
          if (k8sResult.success) {
            this.markTaskCompleted(session, task.id);
            return k8sResult;
          }
        } catch (err: any) {
          console.warn('[TaskValidator] Native K8s API exec validation failed, falling back to kubectl CLI exec:', err?.message || err);
        }
      }

      // 2. Try kubectl CLI exec fallback directly inside target cluster and namespace
      try {
        const kubectlResult = await this.execKubectlValidation(session, task.validationScript);
        if (kubectlResult.success) {
          this.markTaskCompleted(session, task.id);
        }
        return kubectlResult;
      } catch (err: any) {
        console.warn('[TaskValidator] kubectl CLI exec validation failed:', err?.message || err);
      }
    }

    // 3. Fallback Sandbox validation (Local dev mode)
    try {
      const isWin = process.platform === 'win32';
      let cmd = task.validationScript;
      if (isWin) {
        cmd = `wsl /bin/sh -c ${JSON.stringify(task.validationScript)} 2>NUL || bash -c ${JSON.stringify(task.validationScript)} 2>NUL || ${task.validationScript}`;
      }
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      this.markTaskCompleted(session, task.id);
      return {
        success: true,
        message: `Task verification passed! ${stdout ? `(${stdout.trim()})` : ''}`,
      };
    } catch (err: any) {
      // Retry direct exec as last resort if shell wrapper failed
      try {
        const { stdout } = await execAsync(task.validationScript, { timeout: 10000 });
        this.markTaskCompleted(session, task.id);
        return {
          success: true,
          message: `Task verification passed! ${stdout ? `(${stdout.trim()})` : ''}`,
        };
      } catch (innerErr: any) {
        return {
          success: false,
          message: `Task verification failed: Requirements not met yet. Details: ${err?.stderr || err?.message || 'Check command execution inside terminal.'}`,
        };
      }
    }
  }

  private async execK8sValidation(session: LabSession, script: string, kc: k8s.KubeConfig): Promise<{ success: boolean; message: string }> {
    const k8sExec = new k8s.Exec(kc);

    const { PassThrough } = await import('stream');
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    return new Promise((resolve) => {
      let stdoutBuf = '';
      let stderrBuf = '';

      stdoutStream.on('data', (data) => {
        stdoutBuf += data.toString();
      });

      stderrStream.on('data', (data) => {
        stderrBuf += data.toString();
      });

      const isDockerLab = session.labSlug?.includes('docker') || session.labId?.includes('docker');
      const containerName = isDockerLab ? 'docker-client' : 'lab-container';
      const command = ['/bin/sh', '-c', script];

      k8sExec.exec(
        session.namespace,
        session.podName,
        containerName,
        command,
        stdoutStream,
        stderrStream,
        null,
        false,
        (status: any) => {
          if (status.status === 'Success') {
            resolve({
              success: true,
              message: `Validation successful! ${stdoutBuf.trim()}`,
            });
          } else {
            resolve({
              success: false,
              message: stderrBuf.trim() || `Validation failed with status ${status.reason || status.status}`,
            });
          }
        }
      ).catch((err) => {
        resolve({
          success: false,
          message: `Exec execution error: ${err?.message || err}`,
        });
      });
    });
  }

  private async execKubectlValidation(session: LabSession, script: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const contextName = k8sProvisioner.getClusterContextForSession(session);
      const isDockerLab = session.labSlug?.includes('docker') || session.labId?.includes('docker');
      const containerName = isDockerLab ? 'docker-client' : 'lab-container';

      const proc = spawn('kubectl', [
        '--context', contextName,
        'exec',
        '-n', session.namespace,
        session.podName,
        '-c', containerName,
        '--',
        '/bin/sh', '-c', script,
      ]);

      let stdoutBuf = '';
      let stderrBuf = '';

      proc.stdout.on('data', (d) => { stdoutBuf += d.toString(); });
      proc.stderr.on('data', (d) => { stderrBuf += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, message: `Validation successful! ${stdoutBuf.trim()}` });
        } else {
          resolve({ success: false, message: stderrBuf.trim() || `Validation check failed (Exit code ${code})` });
        }
      });

      proc.on('error', (err) => {
        resolve({ success: false, message: `kubectl exec error: ${err.message}` });
      });
    });
  }

  private markTaskCompleted(session: LabSession, taskId: string): void {
    if (!session.completedTasks.includes(taskId)) {
      session.completedTasks.push(taskId);
      db.updateSession(session);
      db.addAuditLog(session.userId, 'User', 'Task Completed', `Completed task ${taskId} in lab session ${session.id}`);
    }
  }
}

export const taskValidator = new TaskValidatorService();

