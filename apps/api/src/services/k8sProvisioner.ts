import * as k8s from '@kubernetes/client-node';
import { Lab, LabSession } from '@byolabs/shared';
import { db } from '../db/store.js';
import { spawn, ChildProcess } from 'child_process';

export class LabProvisionerService {
  private kubeConfig: k8s.KubeConfig | null = null;
  private coreV1Api: k8s.CoreV1Api | null = null;
  private isK8sAvailable: boolean = false;

  constructor() {
    this.initK8sClient();
  }

  private initK8sClient() {
    try {
      const kc = new k8s.KubeConfig();
      // Try loading in-cluster config or default kubeconfig file
      if (process.env.KUBERNETES_SERVICE_HOST) {
        kc.loadFromCluster();
        this.kubeConfig = kc;
        this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
        this.isK8sAvailable = true;
        console.log('[K8sProvisioner] Running in Kubernetes Cluster mode');
      } else {
        kc.loadFromDefault();
        this.kubeConfig = kc;
        this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
        this.isK8sAvailable = true;
        console.log('[K8sProvisioner] Loaded local KubeConfig');
      }
    } catch (err) {
      this.isK8sAvailable = false;
      console.log('[K8sProvisioner] Live K8s cluster not detected. Operating in high-performance Sandbox simulation mode for dev/testing.');
    }
  }

  public getIsK8sAvailable(): boolean {
    return this.isK8sAvailable;
  }

  public getKubeConfig(): k8s.KubeConfig | null {
    return this.kubeConfig;
  }

  public async provisionLab(session: LabSession, lab: Lab): Promise<void> {
    db.addLog('info', 'Provisioner', `Starting provisioning for session ${session.id} (${lab.name})`);

    if (this.isK8sAvailable && this.coreV1Api) {
      try {
        await this.provisionK8sLab(session, lab);
        return;
      } catch (err: any) {
        console.error('[K8sProvisioner] K8s API provisioning failed, falling back to Sandbox runner:', err?.message || err);
        db.addLog('warn', 'Provisioner', `K8s cluster provisioning attempt failed (${err?.message}). Operating session ${session.id} in sandbox fallback mode.`);
      }
    }

    // Fallback: Sandbox mode
    session.isSandbox = true;
    db.updateSession(session);
    await this.provisionSandboxLab(session, lab);
  }

  private async provisionK8sLab(session: LabSession, lab: Lab): Promise<void> {
    const namespace = session.namespace;
    const podName = session.podName;

    // 1. Create Namespace
    const nsSpec: k8s.V1Namespace = {
      metadata: {
        name: namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'byolabs',
          'byolabs.in/session-id': session.id,
          'byolabs.in/user-id': session.userId,
        },
      },
    };

    try {
      await this.coreV1Api!.createNamespace(nsSpec);
      console.log(`[K8sProvisioner] Created namespace ${namespace}`);
    } catch (err: any) {
      if (err?.body?.reason !== 'AlreadyExists') {
        throw new Error(`Failed to create K8s namespace: ${err?.body?.message || err.message}`);
      }
    }

    // 2. Create ResourceQuota in namespace
    const quotaSpec: k8s.V1ResourceQuota = {
      metadata: { name: 'lab-quota', namespace },
      spec: {
        hard: {
          pods: '2',
          'requests.cpu': lab.cpuLimit || '1',
          'requests.memory': lab.memoryLimit || '1Gi',
          'limits.cpu': lab.cpuLimit || '1',
          'limits.memory': lab.memoryLimit || '1Gi',
        },
      },
    };
    try {
      await this.coreV1Api!.createNamespacedResourceQuota(namespace, quotaSpec);
    } catch (err: any) {
      console.warn('[K8sProvisioner] Quotas apply warning:', err?.message);
    }

    const isDind = (lab.dockerImage && lab.dockerImage.includes('dind')) || (lab.slug && lab.slug.includes('dind'));

    let containerCommand: string[] | undefined;
    if (lab.startupCommand && lab.startupCommand !== '/bin/sh' && lab.startupCommand !== '/bin/bash') {
      containerCommand = ['/bin/sh', '-c', lab.startupCommand];
    } else if (isDind) {
      containerCommand = undefined; // Allow dockerd-entrypoint.sh image entrypoint to run
    } else if (lab.startupCommand === '/bin/bash') {
      containerCommand = ['/bin/bash'];
    } else if (lab.startupCommand === '/bin/sh') {
      containerCommand = ['/bin/sh'];
    } else {
      containerCommand = ['/bin/bash'];
    }

    const securityContext: k8s.V1SecurityContext = isDind
      ? { privileged: true, allowPrivilegeEscalation: true, readOnlyRootFilesystem: false }
      : { allowPrivilegeEscalation: false, readOnlyRootFilesystem: false };

    const isSidecarDind = lab.category === 'Docker' || lab.slug === 'docker-playground' || lab.dockerImage === 'docker:27-cli' || lab.slug.includes('docker');

    // 3. Create Pod Spec
    let podSpec: k8s.V1Pod;

    if (isSidecarDind) {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'byolabs-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'docker-cli',
              image: lab.dockerImage && lab.dockerImage !== 'ubuntu:latest' ? lab.dockerImage : 'docker:27-cli',
              command: ['/bin/sh', '-c', 'while [ ! -f /certs/client/ca.pem ]; do sleep 1; done; exec sh'],
              env: [
                { name: 'DOCKER_HOST', value: 'tcp://localhost:2376' },
                { name: 'DOCKER_TLS_VERIFY', value: '1' },
                { name: 'DOCKER_CERT_PATH', value: '/certs/client' },
              ],
              volumeMounts: [
                { name: 'dind-certs', mountPath: '/certs' },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: lab.cpuRequest || '250m', memory: lab.memoryRequest || '256Mi' },
                limits: { cpu: lab.cpuLimit || '1', memory: lab.memoryLimit || '1Gi' },
              },
            },
            {
              name: 'dind-daemon',
              image: 'docker:27-dind',
              securityContext: { privileged: true },
              env: [
                { name: 'DOCKER_TLS_CERTDIR', value: '/certs' },
              ],
              volumeMounts: [
                { name: 'dind-certs', mountPath: '/certs' },
              ],
              resources: {
                requests: { cpu: '250m', memory: '256Mi' },
                limits: { cpu: '1', memory: '1Gi' },
              },
            },
          ],
          volumes: [
            { name: 'dind-certs', emptyDir: {} },
          ],
          restartPolicy: 'Never',
        },
      };
    } else {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'byolabs-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'lab-container',
              image: lab.dockerImage || 'ubuntu:latest',
              ...(containerCommand ? { command: containerCommand } : {}),
              ports: [
                {
                  containerPort: 22,
                  name: 'ssh',
                  protocol: 'TCP',
                },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: {
                  cpu: lab.cpuRequest || '250m',
                  memory: lab.memoryRequest || '256Mi',
                },
                limits: {
                  cpu: lab.cpuLimit || '1',
                  memory: lab.memoryLimit || '1Gi',
                },
              },
              securityContext,
            },
          ],
          restartPolicy: 'Never',
        },
      };
    }

    await this.coreV1Api!.createNamespacedPod(namespace, podSpec);
    console.log(`[K8sProvisioner] Pod ${podName} created in namespace ${namespace}`);

    // 4. Create Kubernetes Service mapping Port 22
    const serviceSpec: k8s.V1Service = {
      metadata: {
        name: 'lab-service',
        namespace,
        labels: { app: 'byolabs-lab', 'session-id': session.id },
      },
      spec: {
        selector: { app: 'byolabs-lab', 'session-id': session.id },
        ports: [
          {
            name: 'ssh',
            port: 22,
            targetPort: 22 as any,
            protocol: 'TCP',
          },
        ],
        type: 'ClusterIP',
      },
    };

    try {
      await this.coreV1Api!.createNamespacedService(namespace, serviceSpec);
      console.log(`[K8sProvisioner] Service lab-service (port 22) created in namespace ${namespace}`);
    } catch (err: any) {
      console.warn('[K8sProvisioner] Service creation warning:', err?.message);
    }

    // Wait for Pod Ready (poll up to 90s for image pulling)
    let isReady = false;
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const podRes = await this.coreV1Api!.readNamespacedPod(podName, namespace);
      const phase = podRes.body?.status?.phase;
      if (phase === 'Running' || phase === 'Succeeded') {
        isReady = true;
        break;
      }
    }

    if (!isReady) {
      throw new Error(`Pod scheduling timed out for ${podName} in namespace ${namespace}`);
    }

    db.addLog('info', 'Provisioner', `K8s Pod ${podName} is RUNNING in namespace ${namespace}`);
  }

  private async provisionSandboxLab(session: LabSession, lab: Lab): Promise<void> {
    // Sandbox mode initializes local environment session ready for WebSocket connections
    await new Promise((r) => setTimeout(r, 1500)); // Simulate realistic container scheduling delay
    db.addLog('info', 'Provisioner', `Sandbox session ${session.id} initialized for lab ${lab.name}`);
  }

  public async deleteLab(session: LabSession): Promise<void> {
    db.addLog('info', 'Provisioner', `Tearing down lab resources for session ${session.id}`);

    if (this.isK8sAvailable && this.coreV1Api) {
      try {
        // Deleting the namespace automatically garbage collects Pods, Services, Quotas inside it
        await this.coreV1Api.deleteNamespace(session.namespace);
        console.log(`[K8sProvisioner] Deleted namespace ${session.namespace}`);
        return;
      } catch (err: any) {
        console.warn(`[K8sProvisioner] Error deleting namespace ${session.namespace}:`, err?.message || err);
      }
    }

    console.log(`[Provisioner] Sandbox resources torn down for session ${session.id}`);
  }
}

export const k8sProvisioner = new LabProvisionerService();
