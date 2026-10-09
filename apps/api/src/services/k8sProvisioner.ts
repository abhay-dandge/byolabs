import * as k8s from '@kubernetes/client-node';
import { Lab, LabSession, ClusterInfo, NodeMetrics } from '@byolabs/shared';
import { db } from '../db/store.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LabProvisionerService {
  private kubeConfig: k8s.KubeConfig | null = null;
  private standardApi: k8s.CoreV1Api | null = null;
  private defaultApi: k8s.CoreV1Api | null = null;
  private isK8sAvailable: boolean = false;
  private metricsCache: { timestamp: number; data: ClusterInfo } | null = null;

  constructor() {
    this.initK8sClient();
  }

  private initK8sClient() {
    const standardContext = process.env.STANDARD_K8S_CONTEXT || process.env.K8S_CONTEXT || 'gke_gdg-test-458407_us-central1-a_byo-dind-cluster';

    try {
      const kc = new k8s.KubeConfig();
      if (process.env.KUBERNETES_SERVICE_HOST && !process.env.STANDARD_K8S_CONTEXT && !process.env.K8S_CONTEXT) {
        kc.loadFromCluster();
        this.standardApi = kc.makeApiClient(k8s.CoreV1Api);
        this.defaultApi = this.standardApi;
        console.log('[K8sProvisioner] In-cluster K8s detected via pod ServiceAccount');
      } else if (process.env.STANDARD_K8S_HOST && process.env.STANDARD_K8S_TOKEN) {
        const cluster = {
          name: 'byo-dind-cluster',
          server: process.env.STANDARD_K8S_HOST,
          skipTLSVerify: !process.env.STANDARD_K8S_CA_DATA,
          caData: process.env.STANDARD_K8S_CA_DATA,
        };
        const user = { name: 'byolabs-user', token: process.env.STANDARD_K8S_TOKEN };
        kc.loadFromClusterAndUser(cluster, user);
        this.standardApi = kc.makeApiClient(k8s.CoreV1Api);
        this.defaultApi = this.standardApi;
        console.log(`[K8sProvisioner] Initialized Standard Cluster client via env endpoint (${process.env.STANDARD_K8S_HOST})`);
      } else {
        kc.loadFromDefault();
        try {
          kc.setCurrentContext(standardContext);
        } catch (ctxErr: any) {
          console.warn(`[K8sProvisioner] Could not bind Standard cluster context '${standardContext}':`, ctxErr?.message);
        }
        this.standardApi = kc.makeApiClient(k8s.CoreV1Api);
        this.defaultApi = this.standardApi;
        console.log(`[K8sProvisioner] Initialized Standard Cluster client (${kc.currentContext || standardContext})`);
      }

      this.kubeConfig = kc;
      if (this.standardApi || this.defaultApi) {
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

  public getKubeConfigForSession(session: LabSession): k8s.KubeConfig | null {
    const standardContext = process.env.STANDARD_K8S_CONTEXT || process.env.K8S_CONTEXT || 'gke_gdg-test-458407_us-central1-a_byo-dind-cluster';

    try {
      const kc = new k8s.KubeConfig();
      if (process.env.KUBERNETES_SERVICE_HOST && !process.env.STANDARD_K8S_CONTEXT && !process.env.K8S_CONTEXT) {
        kc.loadFromCluster();
        return kc;
      }

      if (process.env.STANDARD_K8S_HOST && process.env.STANDARD_K8S_TOKEN) {
        const cluster = {
          name: 'byo-dind-cluster',
          server: process.env.STANDARD_K8S_HOST,
          skipTLSVerify: !process.env.STANDARD_K8S_CA_DATA,
          caData: process.env.STANDARD_K8S_CA_DATA,
        };
        const user = { name: 'byolabs-user', token: process.env.STANDARD_K8S_TOKEN };
        kc.loadFromClusterAndUser(cluster, user);
        return kc;
      }

      kc.loadFromDefault();
      try {
        kc.setCurrentContext(standardContext);
      } catch (e) {}
      return kc;
    } catch (err: any) {
      console.warn(`[K8sProvisioner] Failed to load KubeConfig for session ${session.id} (Context: ${standardContext}):`, err?.message);
      return this.kubeConfig;
    }
  }

  public getClusterContextForSession(_session: LabSession): string {
    return process.env.STANDARD_K8S_CONTEXT || process.env.K8S_CONTEXT || 'gke_gdg-test-458407_us-central1-a_byo-dind-cluster';
  }

  public async getClusterMetrics(): Promise<ClusterInfo> {
    // Return cached metrics if within 5s TTL
    if (this.metricsCache && Date.now() - this.metricsCache.timestamp < 5000) {
      return this.metricsCache.data;
    }

    const activeSessions = db.getSessions().filter((s) => s.status === 'RUNNING' || s.status === 'STARTING');
    const totalMaxCapacity = db.getSettings().maxClusterLabs || 50;
    const standardContext = process.env.STANDARD_K8S_CONTEXT || process.env.K8S_CONTEXT || 'gke_gdg-test-458407_us-central1-a_byo-dind-cluster';

    // Baseline fallback values
    let nodes: NodeMetrics[] = [
      {
        name: 'gke-byo-dind-cluster-pool-standard-4',
        status: 'Ready',
        role: 'worker',
        cpuUsage: '2%',
        memoryUsage: '9%',
        podsCount: activeSessions.length + 15,
      },
    ];
    let totalCpuUsagePercent = 2;
    let totalMemoryUsagePercent = 9;
    let controlPlaneReady = this.isK8sAvailable;

    if (this.isK8sAvailable) {
      try {
        let topNodesSuccess = false;

        // Strategy 1: Fast kubectl top nodes and pod list
        try {
          const contextArg = standardContext ? ` --context=${standardContext}` : '';
          const { stdout: topOutput } = await execAsync(`kubectl top nodes${contextArg} --no-headers`, { timeout: 7000 });

          if (topOutput && topOutput.trim().length > 0) {
            const podCounts: Record<string, number> = {};
            try {
              const { stdout: podsOutput } = await execAsync(`kubectl get pods -A${contextArg} --no-headers -o wide`, { timeout: 7000 });
              for (const line of podsOutput.trim().split('\n')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 8) {
                  const nodeName = parts[7];
                  if (nodeName && nodeName !== '<none>') {
                    podCounts[nodeName] = (podCounts[nodeName] || 0) + 1;
                  }
                }
              }
            } catch (pErr) {
              // Pod count query fallback
            }

            const parsedNodes: NodeMetrics[] = [];
            let sumCpu = 0;
            let sumMem = 0;

            const lines = topOutput.trim().split('\n');
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 5) {
                const nodeName = parts[0];
                const cpuUsed = parts[1];
                const cpuPct = parseInt(parts[2].replace('%', ''), 10) || 0;
                const memUsed = parts[3];
                const memPct = parseInt(parts[4].replace('%', ''), 10) || 0;

                parsedNodes.push({
                  name: nodeName,
                  status: 'Ready',
                  role: nodeName.includes('master') || nodeName.includes('control') ? 'control-plane' : 'worker',
                  cpuUsage: `${cpuUsed} (${cpuPct}%)`,
                  memoryUsage: `${memUsed} (${memPct}%)`,
                  podsCount: podCounts[nodeName] ?? (activeSessions.length + 15),
                });

                sumCpu += cpuPct;
                sumMem += memPct;
              }
            }

            if (parsedNodes.length > 0) {
              nodes = parsedNodes;
              totalCpuUsagePercent = Math.round(sumCpu / parsedNodes.length);
              totalMemoryUsagePercent = Math.round(sumMem / parsedNodes.length);
              controlPlaneReady = true;
              topNodesSuccess = true;
            }
          }
        } catch (kubectlErr) {
          // kubectl execution failed, fall back to native client
        }

        // Strategy 2: Native Kubernetes client-node (listNode + metrics.k8s.io)
        if (!topNodesSuccess && this.standardApi) {
          try {
            const kc = this.getKubeConfig() || new k8s.KubeConfig();
            const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

            const [nodesRes, podsRes, metricsRes] = await Promise.all([
              this.standardApi.listNode(),
              this.standardApi.listPodForAllNamespaces().catch(() => null),
              customApi.getClusterCustomObject('metrics.k8s.io', 'v1beta1', 'nodes', '').catch(() => null),
            ]);

            const podCounts: Record<string, number> = {};
            if (podsRes?.body?.items) {
              for (const pod of podsRes.body.items) {
                const nodeName = pod.spec?.nodeName;
                if (nodeName) {
                  podCounts[nodeName] = (podCounts[nodeName] || 0) + 1;
                }
              }
            }

            const metricsMap: Record<string, { cpuNano: number; memBytes: number }> = {};
            if ((metricsRes as any)?.body?.items) {
              for (const item of (metricsRes as any).body.items) {
                const nodeName = item.metadata?.name;
                const cpuStr = item.usage?.cpu || '0';
                const memStr = item.usage?.memory || '0';

                let cpuNano = 0;
                if (cpuStr.endsWith('n')) cpuNano = parseInt(cpuStr, 10);
                else if (cpuStr.endsWith('u')) cpuNano = parseInt(cpuStr, 10) * 1000;
                else if (cpuStr.endsWith('m')) cpuNano = parseInt(cpuStr, 10) * 1000000;
                else cpuNano = parseFloat(cpuStr) * 1000000000;

                let memBytes = 0;
                if (memStr.endsWith('Ki')) memBytes = parseInt(memStr, 10) * 1024;
                else if (memStr.endsWith('Mi')) memBytes = parseInt(memStr, 10) * 1024 * 1024;
                else if (memStr.endsWith('Gi')) memBytes = parseInt(memStr, 10) * 1024 * 1024 * 1024;
                else memBytes = parseInt(memStr, 10);

                metricsMap[nodeName] = { cpuNano, memBytes };
              }
            }

            if (nodesRes?.body?.items && nodesRes.body.items.length > 0) {
              const parsedNodes: NodeMetrics[] = [];
              let sumCpu = 0;
              let sumMem = 0;

              for (const n of nodesRes.body.items) {
                const name = n.metadata?.name || 'unknown';
                const isReady = n.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True') ?? true;
                const role = n.metadata?.labels?.['node-role.kubernetes.io/control-plane'] || n.metadata?.labels?.['node-role.kubernetes.io/master'] ? 'control-plane' : 'worker';

                const allocCpuStr = n.status?.allocatable?.cpu || '4';
                let allocCpuNano = 4 * 1000000000;
                if (allocCpuStr.endsWith('m')) allocCpuNano = parseInt(allocCpuStr, 10) * 1000000;
                else allocCpuNano = parseFloat(allocCpuStr) * 1000000000;

                const allocMemStr = n.status?.allocatable?.memory || '16Gi';
                let allocMemBytes = 16 * 1024 * 1024 * 1024;
                if (allocMemStr.endsWith('Ki')) allocMemBytes = parseInt(allocMemStr, 10) * 1024;
                else if (allocMemStr.endsWith('Mi')) allocMemBytes = parseInt(allocMemStr, 10) * 1024 * 1024;
                else if (allocMemStr.endsWith('Gi')) allocMemBytes = parseInt(allocMemStr, 10) * 1024 * 1024 * 1024;

                const nodeMetrics = metricsMap[name];
                let cpuPct = 2;
                let cpuDisplay = '2%';
                let memPct = 9;
                let memDisplay = '9%';

                if (nodeMetrics) {
                  cpuPct = Math.min(100, Math.max(1, Math.round((nodeMetrics.cpuNano / allocCpuNano) * 100)));
                  const cpuMillicores = Math.round(nodeMetrics.cpuNano / 1000000);
                  cpuDisplay = `${cpuMillicores}m (${cpuPct}%)`;

                  memPct = Math.min(100, Math.max(1, Math.round((nodeMetrics.memBytes / allocMemBytes) * 100)));
                  const memMiB = Math.round(nodeMetrics.memBytes / (1024 * 1024));
                  memDisplay = `${memMiB}Mi (${memPct}%)`;
                }

                parsedNodes.push({
                  name,
                  status: isReady ? 'Ready' : 'NotReady',
                  role,
                  cpuUsage: cpuDisplay,
                  memoryUsage: memDisplay,
                  podsCount: podCounts[name] ?? (activeSessions.length + 15),
                });

                sumCpu += cpuPct;
                sumMem += memPct;
              }

              if (parsedNodes.length > 0) {
                nodes = parsedNodes;
                totalCpuUsagePercent = Math.round(sumCpu / parsedNodes.length);
                totalMemoryUsagePercent = Math.round(sumMem / parsedNodes.length);
                controlPlaneReady = true;
              }
            }
          } catch (clientErr) {
            console.warn('[K8sProvisioner] Failed to query native K8s metrics:', clientErr);
          }
        }
      } catch (err) {
        console.warn('[K8sProvisioner] Error gathering cluster metrics:', err);
      }
    }

    const clusterData: ClusterInfo = {
      id: 'byo-dind-cluster',
      name: 'GKE DinD Cluster (byo-dind-cluster)',
      region: 'us-central1-a (Google Cloud)',
      type: 'Production K8s Cluster',
      controlPlaneReady,
      activeLabsCount: activeSessions.length,
      maxLabsCapacity: totalMaxCapacity,
      nodes,
      totalCpuUsagePercent,
      totalMemoryUsagePercent,
    };

    this.metricsCache = {
      timestamp: Date.now(),
      data: clusterData,
    };

    return clusterData;
  }

  private getClusterApiForLab(_lab: Lab): { api: k8s.CoreV1Api; clusterName: string } {
    if (this.standardApi) {
      return { api: this.standardApi, clusterName: 'Standard GKE (byo-dind-cluster)' };
    }
    if (this.defaultApi) {
      return { api: this.defaultApi, clusterName: 'Standard GKE' };
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
    const { api: coreV1Api, clusterName } = this.getClusterApiForLab(lab);

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
    const isPodmanLab = lab.category === 'Podman' || lab.slug?.includes('podman') || (lab.dockerImage && lab.dockerImage.includes('podman'));
    const isBuildahLab = lab.category === 'Buildah' || lab.slug?.includes('buildah') || (lab.dockerImage && lab.dockerImage.includes('buildah'));
    const isContainerdLab = lab.category === 'Containerd' || lab.slug?.includes('containerd') || (lab.dockerImage && lab.dockerImage.includes('containerd'));
    const isHeavyRuntime = isSidecarDind || isPodmanLab || isBuildahLab || isContainerdLab;

    // 2. Create ResourceQuota in namespace
    const quotaSpec: k8s.V1ResourceQuota = {
      metadata: { name: 'lab-quota', namespace },
      spec: {
        hard: {
          pods: '1',
          'requests.cpu': isHeavyRuntime ? (lab.cpuRequest || '100m') : (lab.cpuRequest || '250m'),
          'requests.memory': isHeavyRuntime ? (lab.memoryRequest || '512Mi') : (lab.memoryRequest || '256Mi'),
          'limits.cpu': isHeavyRuntime ? (lab.cpuLimit || '1') : (lab.cpuLimit || '1'),
          'limits.memory': isHeavyRuntime ? (lab.memoryLimit || '2Gi') : (lab.memoryLimit || '1Gi'),
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

    const isPrivilegedLab = isDind || isHeavyRuntime;
    const securityContext: k8s.V1SecurityContext = isPrivilegedLab
      ? { privileged: true, allowPrivilegeEscalation: true, readOnlyRootFilesystem: false }
      : { privileged: false, allowPrivilegeEscalation: true, readOnlyRootFilesystem: false };

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
              image: lab.dockerImage && lab.dockerImage !== 'ubuntu:24.04' ? lab.dockerImage : 'docker:dind',
              securityContext: {
                privileged: true,
                allowPrivilegeEscalation: true,
                readOnlyRootFilesystem: false,
              },
              volumeMounts: [
                {
                  name: 'docker-storage',
                  mountPath: '/var/lib/docker',
                },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: lab.cpuRequest || '100m', memory: lab.memoryRequest || '512Mi' },
                limits: { cpu: lab.cpuLimit || '1', memory: lab.memoryLimit || '2Gi' },
              },
            },
          ],
          volumes: [
            {
              name: 'docker-storage',
              emptyDir: {},
            },
          ],
          restartPolicy: 'Never',
        },
      };
    } else if (isPodmanLab) {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'podman-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'lab-container',
              image: lab.dockerImage || 'quay.io/podman/stable',
              command: ['/bin/sh', '-c', 'trap : TERM INT; sleep infinity & wait'],
              securityContext: {
                privileged: true,
                allowPrivilegeEscalation: true,
                readOnlyRootFilesystem: false,
              },
              volumeMounts: [
                {
                  name: 'podman-storage',
                  mountPath: '/var/lib/containers',
                },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: lab.cpuRequest || '100m', memory: lab.memoryRequest || '512Mi' },
                limits: { cpu: lab.cpuLimit || '1', memory: lab.memoryLimit || '2Gi' },
              },
            },
          ],
          volumes: [
            {
              name: 'podman-storage',
              emptyDir: {},
            },
          ],
          restartPolicy: 'Never',
        },
      };
    } else if (isBuildahLab) {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'buildah-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'lab-container',
              image: lab.dockerImage || 'quay.io/buildah/stable',
              command: ['/bin/sh', '-c', 'trap : TERM INT; sleep infinity & wait'],
              env: [
                { name: 'BUILDAH_ISOLATION', value: 'chroot' },
                { name: 'STORAGE_DRIVER', value: 'vfs' },
              ],
              securityContext: {
                privileged: true,
                allowPrivilegeEscalation: true,
                readOnlyRootFilesystem: false,
              },
              volumeMounts: [
                {
                  name: 'buildah-storage',
                  mountPath: '/var/lib/containers',
                },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: lab.cpuRequest || '100m', memory: lab.memoryRequest || '512Mi' },
                limits: { cpu: lab.cpuLimit || '1', memory: lab.memoryLimit || '2Gi' },
              },
            },
          ],
          volumes: [
            {
              name: 'buildah-storage',
              emptyDir: {},
            },
          ],
          restartPolicy: 'Never',
        },
      };
    } else if (isContainerdLab) {
      podSpec = {
        metadata: {
          name: podName,
          namespace,
          labels: {
            app: 'containerd-lab',
            'session-id': session.id,
            'user-id': session.userId,
            'lab-type': lab.slug,
          },
        },
        spec: {
          containers: [
            {
              name: 'lab-container',
              image: lab.dockerImage || 'docker:dind',
              command: [
                '/bin/sh',
                '-c',
                'mkdir -p /run/containerd /var/lib/containerd && containerd > /var/log/containerd.log 2>&1 & sleep 2 && trap : TERM INT; sleep infinity & wait',
              ],
              env: [
                { name: 'CONTAINERD_ADDRESS', value: '/run/containerd/containerd.sock' },
                { name: 'CONTAINERD_NAMESPACE', value: 'default' },
              ],
              securityContext: {
                privileged: true,
                allowPrivilegeEscalation: true,
                readOnlyRootFilesystem: false,
              },
              volumeMounts: [
                {
                  name: 'containerd-storage',
                  mountPath: '/var/lib/containerd',
                },
                {
                  name: 'containerd-run',
                  mountPath: '/run/containerd',
                },
              ],
              stdin: true,
              tty: true,
              resources: {
                requests: { cpu: lab.cpuRequest || '100m', memory: lab.memoryRequest || '512Mi' },
                limits: { cpu: lab.cpuLimit || '1', memory: lab.memoryLimit || '2Gi' },
              },
            },
          ],
          volumes: [
            {
              name: 'containerd-storage',
              emptyDir: {},
            },
            {
              name: 'containerd-run',
              emptyDir: {},
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

    const apis = [this.standardApi, this.defaultApi].filter((a): a is k8s.CoreV1Api => a !== null);
    const uniqueApis = Array.from(new Set(apis));

    for (const api of uniqueApis) {
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

