import * as k8s from '@kubernetes/client-node';
import { Lab, LabSession } from '@byolabs/shared';
import { db } from '../db/store.js';

export class LabProvisionerService {
  private kubeConfig: k8s.KubeConfig | null = null;
  private autopilotApi: k8s.CoreV1Api | null = null;
  private standardApi: k8s.CoreV1Api | null = null;
  private defaultApi: k8s.CoreV1Api | null = null;
  private isK8sAvailable: boolean = false;

  constructor() {
    this.initK8sClient();
  }

  private initK8sClient() {
    const autopilotContext = process.env.AUTOPILOT_K8S_CONTEXT || 'gke_gdg-test-458407_asia-south1_autopilot-cluster-2-spot';
    const standardContext = process.env.STANDARD_K8S_CONTEXT || 'gke_gdg-test-458407_us-central1-a_byo-dind-cluster';

    try {
      const kc = new k8s.KubeConfig();
      if (process.env.KUBERNETES_SERVICE_HOST) {
        kc.loadFromCluster();
        this.defaultApi = kc.makeApiClient(k8s.CoreV1Api);
        this.autopilotApi = this.defaultApi;
        console.log('[K8sProvisioner] In-cluster K8s detected (Autopilot default)');
      } else {
        kc.loadFromDefault();
        this.kubeConfig = kc;

        // Init Autopilot client
        try {
          const kcAuto = new k8s.KubeConfig();
          kcAuto.loadFromDefault();
          kcAuto.setCurrentContext(autopilotContext);
          this.autopilotApi = kcAuto.makeApiClient(k8s.CoreV1Api);
          console.log(`[K8sProvisioner] Initialized Autopilot Cluster client (${autopilotContext})`);
        } catch (autoErr: any) {
          console.warn('[K8sProvisioner] Could not bind Autopilot cluster context:', autoErr?.message);
        }

        // Init Standard DinD client
        try {
          const kcStd = new k8s.KubeConfig();
          kcStd.loadFromDefault();
          kcStd.setCurrentContext(standardContext);
          this.standardApi = kcStd.makeApiClient(k8s.CoreV1Api);
          console.log(`[K8sProvisioner] Initialized Standard DinD Cluster client (${standardContext})`);
        } catch (stdErr: any) {
          console.warn('[K8sProvisioner] Could not bind Standard cluster context:', stdErr?.message);
        }

        this.defaultApi = this.standardApi || this.autopilotApi || kc.makeApiClient(k8s.CoreV1Api);
      }

      if (this.autopilotApi || this.standardApi || this.defaultApi) {
        this.isK8sAvailable = true;
      }
    } catch (err: any) {
      this.isK8sAvailable = false;
      console.log('[K8sProvisioner] K8s cluster access not detected. Operating in Sandbox simulation mode.');
    }
  }

  public getIsK8sAvailable(): boolean {
    return this.isK8sAvailable;
  }

  public getKubeConfig(): k8s.KubeConfig | null {
    return this.kubeConfig;
  }

  private getClusterApiForLab(lab: Lab): { api: k8s.CoreV1Api; clusterName: string; isStandardCluster: boolean } {
    const isDockerLab = lab.category === 'Docker' || lab.slug?.includes('docker') || lab.dockerImage?.includes('dind') || lab.dockerImage === 'docker:27-cli';

    if (isDockerLab && this.standardApi) {
      return { api: this.standardApi, clusterName: 'Standard GKE (byo-dind-cluster)', isStandardCluster: true };
    }
    if (this.autopilotApi) {
      return { api: this.autopilotApi, clusterName: 'Autopilot GKE (autopilot-cluster-2-spot)', isStandardCluster: false };
    }
    if (this.defaultApi) {
      return { api: this.defaultApi, clusterName: 'Default GKE', isStandardCluster: false };
    }
    throw new Error('No valid Kubernetes API client available');
  }

  public async provisionLab(session: LabSession, lab: Lab): Promise<void> {
    db.addLog('info', 'Provisioner', `Starting provisioning for session ${session.id} (${lab.name})`);

    if (this.isK8sAvailable) {
      try {
        await this.provisionK8sLab(session, lab);
        return;
      } catch (err: any) {
        const errorMsg = err?.body?.message || err?.message || String(err);
        console.error(`[K8sProvisioner] K8s API provisioning failed for session ${session.id}:`, errorMsg);
        db.addLog('warn', 'Provisioner', `K8s cluster provisioning attempt failed: ${errorMsg}. Operating session ${session.id} in sandbox fallback mode.`);
        session.errorMessage = errorMsg;
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
    const { api: coreV1Api, clusterName, isStandardCluster } = this.getClusterApiForLab(lab);

    console.log(`[K8sProvisioner] Provisioning lab '${lab.name}' on cluster target: ${clusterName}`);
    db.addLog('info', 'Provisioner', `Targeting ${clusterName} for session ${session.id}`);

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
      await coreV1Api.createNamespace(nsSpec);
      console.log(`[K8sProvisioner] Created namespace ${namespace} on ${clusterName}`);
    } catch (err: any) {
      if (err?.body?.reason !== 'AlreadyExists') {
        throw new Error(`Failed to create K8s namespace on ${clusterName}: ${err?.body?.message || err.message}`);
      }
    }

    const isSidecarDind = lab.category === 'Docker' || lab.slug === 'docker-playground' || lab.dockerImage === 'docker:27-cli';

    // 2. Create ResourceQuota in namespace
    const quotaSpec: k8s.V1ResourceQuota = {
      metadata: { name: 'lab-quota', namespace },
      spec: {
        hard: {
          pods: '6',
          'requests.cpu': isSidecarDind ? '1' : (lab.cpuRequest || '250m'),
          'requests.memory': isSidecarDind ? '2Gi' : (lab.memoryRequest || '256Mi'),
          'limits.cpu': isSidecarDind ? '4' : (lab.cpuLimit || '1'),
          'limits.memory': isSidecarDind ? '4Gi' : (lab.memoryLimit || '1Gi'),
        },
      },
    };
    try {
      await coreV1Api.createNamespacedResourceQuota(namespace, quotaSpec);
    } catch (err: any) {
      console.warn('[K8sProvisioner] Quotas apply warning:', err?.message);
    }

    const isDind = (lab.dockerImage && lab.dockerImage.includes('dind')) || (lab.slug && lab.slug.includes('dind'));

    let containerCommand: string[] | undefined;
    if (lab.startupCommand && lab.startupCommand !== '/bin/sh' && lab.startupCommand !== '/bin/bash') {
      containerCommand = ['/bin/sh', '-c', lab.startupCommand];
    } else if (isDind) {
      containerCommand = undefined;
    } else if (lab.startupCommand === '/bin/bash') {
      containerCommand = ['/bin/bash'];
    } else if (lab.startupCommand === '/bin/sh') {
      containerCommand = ['/bin/sh'];
    } else {
      containerCommand = ['/bin/bash'];
    }

    const securityContext: k8s.V1SecurityContext = isDind || isStandardCluster
      ? { privileged: true, allowPrivilegeEscalation: true, readOnlyRootFilesystem: false }
      : { allowPrivilegeEscalation: false, readOnlyRootFilesystem: false };

    // 3. Create Pod Spec
    let podSpec: k8s.V1Pod;

    if (isSidecarDind) {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'docker-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'docker-client',
              image: 'ubuntu:24.04',
              command: [
                '/bin/bash',
                '-c',
                'apt-get update && apt-get install -y curl ca-certificates iptables && curl -fsSL https://get.docker.com | sh && (dockerd > /var/log/dockerd.log 2>&1 &) && sleep infinity',
              ],
              securityContext: {
                privileged: true,
                allowPrivilegeEscalation: true,
                readOnlyRootFilesystem: false,
              },
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: '500m', memory: '1Gi' },
                limits: { cpu: '2', memory: '2Gi' },
              },
            },
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

    try {
      await coreV1Api.createNamespacedPod(namespace, podSpec);
      console.log(`[K8sProvisioner] Pod ${podName} created in namespace ${namespace} on ${clusterName}`);
    } catch (err: any) {
      const detail = err?.body?.message || err?.message || String(err);
      console.error(`[K8sProvisioner] Failed to create Pod ${podName} in namespace ${namespace} on ${clusterName}:`, detail);
      throw new Error(`Pod creation failed on ${clusterName}: ${detail}`);
    }

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
      await coreV1Api.createNamespacedService(namespace, serviceSpec);
      console.log(`[K8sProvisioner] Service lab-service (port 22) created in namespace ${namespace}`);
    } catch (err: any) {
      console.warn('[K8sProvisioner] Service creation warning:', err?.message);
    }

    // Wait for Pod Ready (poll up to 90s for image pulling)
    let isReady = false;
    let lastPhase = 'Unknown';
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const podRes = await coreV1Api.readNamespacedPod(podName, namespace);
        const phase = podRes.body?.status?.phase;
        lastPhase = phase || 'Unknown';
        if (phase === 'Running' || phase === 'Succeeded') {
          isReady = true;
          break;
        }
      } catch (e) {
        // Ignore transient K8s API read errors while pod initializes
      }
    }

    if (!isReady) {
      throw new Error(`Pod scheduling timed out for ${podName} in namespace ${namespace} on ${clusterName} (Current phase: ${lastPhase})`);
    }

    db.addLog('info', 'Provisioner', `K8s Pod ${podName} is RUNNING on ${clusterName} (namespace ${namespace})`);
  }

  private async provisionSandboxLab(session: LabSession, lab: Lab): Promise<void> {
    await new Promise((r) => setTimeout(r, 1500));
    db.addLog('info', 'Provisioner', `Sandbox session ${session.id} initialized for lab ${lab.name}`);
  }

  public async deleteLab(session: LabSession): Promise<void> {
    db.addLog('info', 'Provisioner', `Tearing down lab resources for session ${session.id}`);

    const apis = [this.standardApi, this.autopilotApi, this.defaultApi].filter((a): a is k8s.CoreV1Api => a !== null);

    for (const api of apis) {
      try {
        await api.deleteNamespace(session.namespace);
        console.log(`[K8sProvisioner] Deleted namespace ${session.namespace}`);
      } catch (err: any) {
        // Ignore if namespace not found in this cluster
      }
    }

    console.log(`[Provisioner] Resources torn down for session ${session.id}`);
  }
}

export const k8sProvisioner = new LabProvisionerService();

