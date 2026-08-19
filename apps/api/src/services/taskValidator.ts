import { LabSession, LabTask } from '@byolabs/shared';
import { db } from '../db/store.js';
import { k8sProvisioner } from './k8sProvisioner.js';
import * as k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TaskValidatorService {
  public async validateTask(session: LabSession, task: LabTask): Promise<{ success: boolean; message: string }> {
    if (!task.validationScript) {
      return { success: true, message: 'Task auto-marked as completed!' };
    }

    db.addLog('info', 'TaskValidator', `Validating task ${task.id} for session ${session.id}`);

    const isK8s = k8sProvisioner.getIsK8sAvailable();
    const kc = k8sProvisioner.getKubeConfig();

    if (isK8s && kc) {
      try {
        const k8sResult = await this.execK8sValidation(session, task.validationScript, kc);
        if (k8sResult.success) {
          this.markTaskCompleted(session, task.id);
        }
        return k8sResult;
      } catch (err: any) {
        console.warn('[TaskValidator] K8s exec validation failed, falling back to local runner:', err?.message || err);
      }
    }

    // Fallback Sandbox validation
    try {
      const { stdout, stderr } = await execAsync(task.validationScript, { timeout: 10000 });
      this.markTaskCompleted(session, task.id);
      return {
        success: true,
        message: `Task verification passed! ${stdout ? `(${stdout.trim()})` : ''}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Task verification failed: Requirements not met yet. Details: ${err?.stderr || err?.message || 'Check command execution inside terminal.'}`,
      };
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

      const command = ['/bin/sh', '-c', script];

      k8sExec.exec(
        session.namespace,
        session.podName,
        'lab-container',
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

  private markTaskCompleted(session: LabSession, taskId: string): void {
    if (!session.completedTasks.includes(taskId)) {
      session.completedTasks.push(taskId);
      db.updateSession(session);
      db.addAuditLog(session.userId, 'User', 'Task Completed', `Completed task ${taskId} in lab session ${session.id}`);
    }
  }
}

export const taskValidator = new TaskValidatorService();
