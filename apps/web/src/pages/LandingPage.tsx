import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, Shield, Cpu, Layers, Play, CheckCircle2, ArrowRight, 
  Sparkles, Code, Server, Flame, Award, Clock, Activity,
  ChevronRight, ExternalLink, RefreshCw, Zap, BookOpen, X
} from 'lucide-react';

interface TerminalPosition {
  top: number;
  left: number;
  rotation: number;
  scale: number;
}

interface FloatingTerminalData {
  id: string;
  title: string;
  command: string;
  output: string;
  tag: string;
  tagColor: string;
  statusColor: string;
  posRight: TerminalPosition; // When module is on the RIGHT (Stage 0, 2, 4)
  posLeft: TerminalPosition;  // When module is on the LEFT (Stage 1, 3)
  animationClass: string;
  depth: number;
  flyDelay: string;
}

const HERO_TERMINALS: FloatingTerminalData[] = [
  {
    id: 'term-docker',
    title: 'docker • alpine',
    command: '$ docker run -d nginx',
    output: 'Container started ✓',
    tag: 'DOCKER',
    tagColor: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/60',
    statusColor: 'text-emerald-400',
    posRight: { top: -42, left: 24, rotation: -4, scale: 1 },
    posLeft:  { top: -46, left: 10, rotation: 3, scale: 0.96 },
    animationClass: 'animate-float-1',
    depth: 1.3,
    flyDelay: '0ms'
  },
  {
    id: 'term-k8s',
    title: 'k8s • live-pod',
    command: '$ kubectl get pods',
    output: 'NAME      READY   STATUS\nnginx     1/1     Running',
    tag: 'K8S',
    tagColor: 'text-indigo-400 border-indigo-800/80 bg-indigo-950/60',
    statusColor: 'text-emerald-400',
    posRight: { top: -14, left: 114, rotation: 5, scale: 1.02 },
    posLeft:  { top: -18, left: -54, rotation: -6, scale: 1.02 },
    animationClass: 'animate-float-2',
    depth: 1.8,
    flyDelay: '80ms'
  },
  {
    id: 'term-tf',
    title: 'terraform • vpc',
    command: '$ terraform apply',
    output: 'Apply complete! ✓',
    tag: 'IAC',
    tagColor: 'text-purple-400 border-purple-800/80 bg-purple-950/60',
    statusColor: 'text-purple-300',
    posRight: { top: 92, left: -24, rotation: -3, scale: 0.96 },
    posLeft:  { top: 102, left: 26, rotation: 5, scale: 0.96 },
    animationClass: 'animate-float-3',
    depth: 1.5,
    flyDelay: '320ms'
  },
  {
    id: 'term-ansible',
    title: 'ansible • deploy',
    command: '$ ansible-playbook deploy.yml',
    output: 'ok=5  changed=3  failed=0',
    tag: 'ANSIBLE',
    tagColor: 'text-rose-400 border-rose-800/80 bg-rose-950/60',
    statusColor: 'text-emerald-400',
    posRight: { top: 96, left: 62, rotation: 4, scale: 1 },
    posLeft:  { top: 94, left: -44, rotation: -5, scale: 1 },
    animationClass: 'animate-float-4',
    depth: 1.2,
    flyDelay: '240ms'
  },
  {
    id: 'term-git',
    title: 'git • main',
    command: '$ git push origin main',
    output: 'Pipeline triggered ✓',
    tag: 'GITOPS',
    tagColor: 'text-amber-400 border-amber-800/80 bg-amber-950/60',
    statusColor: 'text-cyan-400',
    posRight: { top: 44, left: 118, rotation: -5, scale: 0.98 },
    posLeft:  { top: 40, left: -60, rotation: 4, scale: 0.98 },
    animationClass: 'animate-float-2',
    depth: 1.6,
    flyDelay: '160ms'
  }
];

const ECOSYSTEM_TECHNOLOGIES = [
  {
    id: 'docker',
    name: 'Docker',
    command: '$ docker ps',
    output: `CONTAINER ID   IMAGE          COMMAND                  STATUS          PORTS
4f9e8a71b2d0   nginx:alpine   "/docker-entrypoint.…"   Up 14 minutes   0.0.0.0:80->80/tcp
8a1b2c3d4e5f   redis:7-alpine "docker-entrypoint.s…"   Up 22 minutes   6379/tcp`,
    category: 'Containers',
    tag: 'ENGINE',
    description: 'Build, run, and isolate containerized microservices directly in your browser terminal.'
  },
  {
    id: 'k8s',
    name: 'Kubernetes',
    command: '$ kubectl get pods -n production',
    output: `NAME                                READY   STATUS    RESTARTS   AGE
api-gateway-7b9f84d94c-2x8w2        1/1     Running   0          42m
auth-service-5d6c8b749f-k9plq       1/1     Running   0          42m
postgres-db-0                       1/1     Running   0          2h
redis-cluster-cache-6df8b89c4-mz7v1 1/1     Running   0          18m`,
    category: 'Orchestration',
    tag: 'CLUSTER',
    description: 'Provision dedicated namespaces, deployments, services, and ingress rules in live clusters.'
  },
  {
    id: 'terraform',
    name: 'Terraform',
    command: '$ terraform plan',
    output: `Terraform used the selected providers to generate the following execution plan:
  + aws_vpc.byolabs_vpc (10.0.0.0/16)
  + aws_subnet.public_subnet_a (10.0.1.0/24)
  + aws_security_group.allow_tls (ports 443, 80)
  + aws_instance.k8s_worker (t3.medium)

Plan: 4 to add, 0 to change, 0 to destroy.`,
    category: 'IaC',
    tag: 'AUTOMATION',
    description: 'Declare immutable cloud infrastructure with HCL code and validate state changes in real time.'
  },
  {
    id: 'ansible',
    name: 'Ansible',
    command: '$ ansible-playbook -i hosts deploy.yml',
    output: `PLAY [Configure Production Web Servers] ****************************************
TASK [Gathering Facts] *********************************************************
ok: [web-node-01]
ok: [web-node-02]
TASK [Install Nginx & UFW firewall] ********************************************
changed: [web-node-01]
changed: [web-node-02]

PLAY RECAP *********************************************************************
web-node-01: ok=5  changed=3  unreachable=0  failed=0
web-node-02: ok=5  changed=3  unreachable=0  failed=0`,
    category: 'Config Mgmt',
    tag: 'PLAYBOOK',
    description: 'Automate multi-node configuration drift resolution and orchestrate application rollouts.'
  },
  {
    id: 'aws',
    name: 'AWS Cloud',
    command: '$ aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]"',
    output: `[
    [
        "i-07f89d2c4e1b",
        "running",
        "54.210.88.192"
    ],
    [
        "i-08a1b2c3d4e5",
        "running",
        "34.201.45.110"
    ]
]`,
    category: 'Cloud',
    tag: 'INFRASTRUCTURE',
    description: 'Interact with cloud APIs, security groups, IAM roles, and storage buckets from the CLI.'
  },
  {
    id: 'git',
    name: 'Git & GitOps',
    command: '$ git status && git log -1 --oneline',
    output: `On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   k8s/deployment.yaml
	modified:   k8s/service.yaml

46638e9 (HEAD -> main, origin/main) feat: deploy production v2.4 image with zero downtime`,
    category: 'Version Control',
    tag: 'GITOPS',
    description: 'Master branch workflows, merge conflict resolutions, and automated GitOps triggers.'
  }
];

const FEATURED_LABS = [
  {
    title: 'Docker Fundamentals & Containerization',
    technology: 'Docker',
    difficulty: 'Beginner',
    duration: '45 mins',
    status: 'Ready to Launch',
    commandPreview: '$ docker build -t myapp:1.0 . && docker run -p 8080:80 myapp:1.0',
    slug: 'docker-fundamentals',
    bgBadge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
  },
  {
    title: 'Kubernetes Basics & Pod Lifecycle',
    technology: 'Kubernetes',
    difficulty: 'Beginner',
    duration: '60 mins',
    status: 'Ready to Launch',
    commandPreview: '$ kubectl create deployment web --image=nginx && kubectl expose ...',
    slug: 'kubernetes-basics',
    bgBadge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
  },
  {
    title: 'Linux Administration & Shell Scripting',
    technology: 'Linux',
    difficulty: 'Beginner',
    duration: '45 mins',
    status: 'Ready to Launch',
    commandPreview: '$ chmod +x deploy.sh && ./deploy.sh | tee /var/log/deploy.log',
    slug: 'linux-administration',
    bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
  },
  {
    title: 'Terraform on AWS Infrastructure',
    technology: 'Terraform',
    difficulty: 'Intermediate',
    duration: '60 mins',
    status: 'Ready to Launch',
    commandPreview: '$ terraform init && terraform validate && terraform apply',
    slug: 'terraform-aws',
    bgBadge: 'bg-purple-950/80 text-purple-300 border-purple-800'
  },
  {
    title: 'Ansible Configuration Automation',
    technology: 'Ansible',
    difficulty: 'Intermediate',
    duration: '45 mins',
    status: 'Ready to Launch',
    commandPreview: '$ ansible-inventory --graph && ansible-playbook site.yml',
    slug: 'ansible-automation',
    bgBadge: 'bg-rose-950/80 text-rose-300 border-rose-800'
  },
  {
    title: 'CI/CD with Jenkins Pipelines',
    technology: 'CI/CD',
    difficulty: 'Intermediate',
    duration: '60 mins',
    status: 'Ready to Launch',
    commandPreview: '$ jenkins-cli build deploy-pipeline -s -v',
    slug: 'jenkins-cicd',
    bgBadge: 'bg-amber-950/80 text-amber-300 border-amber-800'
  },
  {
    title: 'Prometheus & Grafana Observability',
    technology: 'Monitoring',
    difficulty: 'Advanced',
    duration: '75 mins',
    status: 'Ready to Launch',
    commandPreview: '$ promtool check config prom.yml && curl localhost:9090/metrics',
    slug: 'prometheus-grafana',
    bgBadge: 'bg-orange-950/80 text-orange-300 border-orange-800'
  },
  {
    title: 'OpenShift Enterprise Fundamentals',
    technology: 'OpenShift',
    difficulty: 'Advanced',
    duration: '90 mins',
    status: 'Ready to Launch',
    commandPreview: '$ oc new-project devops && oc new-app nodejs~https://github.com/...',
    slug: 'openshift-fundamentals',
    bgBadge: 'bg-red-950/80 text-red-300 border-red-800'
  }
];

const LEARNING_PATHS = [
  {
    id: 'container-k8s',
    title: 'Container & Kubernetes Cloud Architect',
    stages: ['Linux Basics', 'Docker Containers', 'Kubernetes Orchestration', 'Production DevOps'],
    commandSnippet: '$ kubectl scale deployment microservice --replicas=5',
    focus: 'Master container isolation, pod networking, Helm charts, and multi-tenant clusters.',
    badge: '4 Courses • 24 Labs'
  },
  {
    id: 'iac-cloud',
    title: 'Infrastructure as Code (IaC) & Cloud Engineering',
    stages: ['Terraform HCL', 'AWS Cloud VPC', 'GitOps Workflows', 'Enterprise Automation'],
    commandSnippet: '$ terraform apply -var-file=prod.tfvars',
    focus: 'Declare cloud infrastructure declaratively with zero manual AWS console clicks.',
    badge: '3 Courses • 18 Labs'
  },
  {
    id: 'cicd-automation',
    title: 'Continuous Integration & Continuous Delivery (CI/CD)',
    stages: ['Git Version Control', 'Jenkins Pipelines', 'Artifact Registries', 'ArgoCD Deployment'],
    commandSnippet: '$ git push origin main && argocd app sync production-app',
    focus: 'Automate build, test, container packaging, and automated blue-green rollouts.',
    badge: '4 Courses • 20 Labs'
  },
  {
    id: 'sre-monitoring',
    title: 'Site Reliability & Observability Engineer (SRE)',
    stages: ['System Internals', 'Prometheus Metrics', 'Grafana Dashboards', 'Alertmanager & SRE'],
    commandSnippet: '$ curl -s http://localhost:9090/api/v1/query?query=up',
    focus: 'Instrument microservices, analyze latency metrics, and craft real-time alert policies.',
    badge: '3 Courses • 15 Labs'
  }
];

const MISSIONS = [
  {
    number: 'MISSION 01',
    title: 'Deploy a Production Web Server',
    objective: 'Install Nginx, configure custom reverse proxy with gzip compression, and verify SSL.',
    cliSnippet: '$ nginx -t && systemctl reload nginx && curl -I https://localhost',
    validationCheck: '[PASS] HTTP/2 200 OK | TLSv1.3 | Cache-Control verified',
    badge: 'LINUX & NGINX',
    difficulty: 'Level 1'
  },
  {
    number: 'MISSION 02',
    title: 'Troubleshoot a Crashing Kubernetes Cluster',
    objective: 'Investigate CrashLoopBackOff pods, diagnose OOMKilled errors, and patch resource limits.',
    cliSnippet: '$ kubectl describe pod api-7f8d && kubectl logs -p && kubectl edit deployment',
    validationCheck: '[PASS] Pod api-7f8d status: Running (1/1) | Zero restarts',
    badge: 'K8S SRE',
    difficulty: 'Level 2'
  },
  {
    number: 'MISSION 03',
    title: 'Build an Automated CI/CD Pipeline',
    objective: 'Trigger automated unit tests, build Docker images, and deploy to staging on git push.',
    cliSnippet: '$ git commit -m "feat: v2.4" && git push && jenkins-job-status --watch',
    validationCheck: '[PASS] Build #48 SUCCESS | 0 vulnerabilities found | Staging Live',
    badge: 'DEVOPS PIPELINE',
    difficulty: 'Level 2'
  },
  {
    number: 'MISSION 04',
    title: 'Provision Multi-Tier AWS Cloud Infrastructure',
    objective: 'Use Terraform to declare a resilient VPC, public/private subnets, and autoscaled EC2 pool.',
    cliSnippet: '$ terraform init && terraform plan -out=tfplan && terraform apply tfplan',
    validationCheck: '[PASS] 8 cloud resources provisioned in us-east-1 with zero errors',
    badge: 'IAC ARCHITECT',
    difficulty: 'Level 3'
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Choose a Lab',
    command: '$ byolabs select lab-k8s-basics',
    output: 'Selected: Kubernetes Basics (Isolated Ubuntu 24.04 Environment)',
    icon: BookOpen
  },
  {
    step: '02',
    title: 'Launch Environment',
    command: '$ k8s provision --ns user-workspace --cpu 1 --mem 1Gi',
    output: 'Provisioning dedicated namespace & pod in GKE... READY in 4.2s ✓',
    icon: Server
  },
  {
    step: '03',
    title: 'Open Browser Terminal',
    command: '$ xterm-connect ws://gateway.byolabs.in/session-7f8d29',
    output: 'TTY WebSocket stream connected. True Linux bash shell active.',
    icon: Terminal
  },
  {
    step: '04',
    title: 'Complete Mission',
    command: '$ vim playbook.yml && ansible-playbook deploy.yml',
    output: 'PLAY RECAP: ok=5 changed=3 failed=0 (Configuration applied)',
    icon: Code
  },
  {
    step: '05',
    title: 'Automatic Validation',
    command: '$ byolabs verify --task 01',
    output: 'Running in-pod verification script... ALL TESTS PASSED ✓',
    icon: CheckCircle2
  },
  {
    step: '06',
    title: 'Earn Achievement',
    command: '$ byolabs cert --generate',
    output: 'Verified Certificate Generated. Saved to student profile. 🎓',
    icon: Award
  }
];

const TESTIMONIALS = [
  {
    id: 'alex_k',
    name: 'Alex K.',
    role: 'Site Reliability Engineer @ CloudTech',
    labsCount: '34 Labs Completed',
    quote: 'Finally, a platform where I can actually practice DevOps instead of just watching videos. The instant Kubernetes pods and in-terminal validation scripts are game changers.'
  },
  {
    id: 'priya_s',
    name: 'Priya S.',
    role: 'DevOps Engineer @ FinScale',
    labsCount: '28 Labs Completed',
    quote: 'No fake simulation. You get a real Ubuntu terminal with root access and live kubectl. Troubleshooting real Linux errors taught me more in 2 weeks than months of passive courses.'
  },
  {
    id: 'marcus_t',
    name: 'Marcus T.',
    role: 'Cloud Infrastructure Architect',
    labsCount: '42 Labs Completed',
    quote: 'The 30-hour monthly lab quota and mission-based structure allowed our entire engineering cohort to get certified on Docker and Terraform in record time.'
  }
];

interface ScrollStage {
  label: string;
  headline: string;
  description: string;
  cliCommand: string;
  ctaText: string;
  ctaLink: string;
  hasSparkle: boolean;
  side: 'left' | 'right';
}

const SCROLL_STAGES: ScrollStage[] = [
  {
    label: 'DEVOPS LABS ONLINE',
    headline: 'Learn DevOps by Doing',
    description: 'Real browser-based environments. Real commands. Real hands-on practice.',
    cliCommand: '$ byolabs run --lab linux-admin',
    ctaText: 'Start a Lab',
    ctaLink: '/register',
    hasSparkle: true,
    side: 'left',
  },
  {
    label: 'BUILD',
    headline: 'Build Real Skills',
    description: 'Practice Linux, Docker, Kubernetes, Terraform and more in real browser-based environments.',
    cliCommand: '$ docker compose up -d production',
    ctaText: 'Explore Labs',
    ctaLink: '/labs',
    hasSparkle: false,
    side: 'right',
  },
  {
    label: 'PRACTICE',
    headline: 'Real Commands. Real Environments.',
    description: 'Stop watching tutorials. Launch a real lab and solve practical DevOps challenges.',
    cliCommand: '$ kubectl scale deployment web --replicas=3',
    ctaText: 'Start Practicing',
    ctaLink: '/labs',
    hasSparkle: false,
    side: 'left',
  },
  {
    label: 'MASTER DEVOPS',
    headline: 'From First Command to Production',
    description: 'Learn by solving realistic DevOps missions with automated validation and instant feedback.',
    cliCommand: '$ terraform apply -var-file=prod.tfvars',
    ctaText: 'Explore Missions',
    ctaLink: '/labs',
    hasSparkle: false,
    side: 'right',
  },
  {
    label: 'YOUR LAB IS READY',
    headline: 'Learn. Build. Deploy.',
    description: 'Everything you need to practice modern DevOps — directly in your browser.',
    cliCommand: '$ byolabs enter --sandbox live-pod',
    ctaText: 'Enter BYOLabs',
    ctaLink: '/register',
    hasSparkle: false,
    side: 'left',
  },
];

function getStageStyle(index: number, progress: number): React.CSSProperties {
  const ranges = [
    { start: 0.0, peakStart: 0.0, peakEnd: 0.16, end: 0.20 },
    { start: 0.17, peakStart: 0.21, peakEnd: 0.36, end: 0.40 },
    { start: 0.37, peakStart: 0.41, peakEnd: 0.56, end: 0.60 },
    { start: 0.57, peakStart: 0.61, peakEnd: 0.76, end: 0.80 },
    { start: 0.77, peakStart: 0.81, peakEnd: 0.91, end: 0.95 },
  ];

  const r = ranges[index];

  if (progress < r.start || progress > r.end) {
    return {
      opacity: 0,
      transform: progress < r.start ? 'translateY(14px)' : 'translateY(-14px)',
      filter: 'blur(5px)',
      pointerEvents: 'none',
      visibility: 'hidden',
    };
  }

  let opacity = 1;
  let translateY = 0;
  let blur = 0;

  if (progress < r.peakStart && r.peakStart > r.start) {
    const t = (progress - r.start) / (r.peakStart - r.start);
    opacity = t;
    translateY = (1 - t) * 14;
    blur = (1 - t) * 5;
  } else if (progress > r.peakEnd) {
    const t = (progress - r.peakEnd) / (r.end - r.peakEnd);
    opacity = 1 - t;
    translateY = -t * 14;
    blur = t * 5;
  }

  return {
    opacity,
    transform: `translateY(${translateY.toFixed(1)}px)`,
    filter: `blur(${blur.toFixed(1)}px)`,
    pointerEvents: opacity > 0.4 ? 'auto' : 'none',
    visibility: opacity > 0.01 ? 'visible' : 'hidden',
    transition: 'opacity 0.15s ease-out, transform 0.15s ease-out, filter 0.15s ease-out',
  };
}

// Smooth position function for floating module: 0 = RIGHT, 1 = LEFT
function getModulePosition(progress: number): number {
  const smoothstep = (min: number, max: number, value: number) => {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  };

  // Stage 0 (0-20%): RIGHT (0)
  // Transition 0 -> 1: [0.17, 0.22]
  // Stage 1 (20-40%): LEFT (1)
  // Transition 1 -> 0: [0.37, 0.42]
  // Stage 2 (40-60%): RIGHT (0)
  // Transition 2 -> 3: [0.57, 0.62]
  // Stage 3 (60-80%): LEFT (1)
  // Transition 3 -> 4: [0.77, 0.82]
  // Stage 4 (80-95%): RIGHT (0)

  if (progress < 0.17) return 0;
  if (progress < 0.22) return smoothstep(0.17, 0.22, progress);
  if (progress < 0.37) return 1;
  if (progress < 0.42) return 1 - smoothstep(0.37, 0.42, progress);
  if (progress < 0.57) return 0;
  if (progress < 0.62) return smoothstep(0.57, 0.62, progress);
  if (progress < 0.77) return 1;
  if (progress < 0.82) return 1 - smoothstep(0.77, 0.82, progress);
  return 0;
}

import { ScrollSequenceCanvas } from '../components/ScrollSequenceCanvas';

export const LandingPage: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState(ECOSYSTEM_TECHNOLOGIES[0]);
  const [showFloater, setShowFloater] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyCommand = (e: React.MouseEvent, cmd: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth mouse parallax for the 3D DevOps Laboratory Machine
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // Module fades out smoothly between 88% and 95% progress
  const moduleOpacity = scrollProgress >= 0.88 
    ? Math.max(0, (0.95 - scrollProgress) / 0.07) 
    : 1;

  // Horizontal position: 0 = RIGHT, 1 = LEFT
  const modulePos = getModulePosition(scrollProgress);
  const translateXPercent = isDesktop ? modulePos * 100 : 0;

  return (
    <div className="space-y-32 pb-24 overflow-x-clip terminal-dot-bg">
      {/* =========================================================================
          HERO SECTION: TALL SCROLL AREA WITH STICKY CANVAS ANIMATION (400vh)
         ========================================================================= */}
      <div 
        ref={scrollContainerRef}
        className="relative h-[400vh] select-none"
      >
        {/* Sticky Full-Screen Viewport pinned during 400vh scroll */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#090a10]">
          
          {/* Cinematic Scroll-Linked Image Sequence Canvas */}
          <ScrollSequenceCanvas 
            containerRef={scrollContainerRef} 
            onProgressChange={setScrollProgress}
          />

          {/* Subtle radial lighting gradient behind 3D machine on the right */}
          <div className="absolute top-1/4 right-1/10 w-[650px] h-[650px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-900/15 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Delicate subtle vertical grid line running down center (like reference) */}
          <div 
            style={{ opacity: moduleOpacity, transition: 'opacity 0.2s ease-out' }}
            className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/[0.04] pointer-events-none hidden lg:block"
          ></div>

          {/* Existing Hero UI with Alternating Left-Right Text & Inverse Floating Module */}
          <div 
            ref={heroRef}
            onMouseMove={handleMouseMove}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 min-h-[560px] lg:min-h-[640px]"
          >
            {/* -------------------------------------------------------------
                DYNAMIC TEXT STAGES: ALTERNATING LEFT <-> RIGHT (0-95%)
               ------------------------------------------------------------- */}
            <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[640px]">
              {SCROLL_STAGES.map((stage, idx) => {
                const style = getStageStyle(idx, scrollProgress);
                const isLeft = stage.side === 'left';
                const isCopied = copiedCommand === stage.cliCommand;

                return (
                  <div
                    key={stage.label}
                    style={{
                      ...style,
                      transform: `${style.transform} perspective(1000px) rotateX(${mousePos.y * -7}deg) rotateY(${mousePos.x * 7}deg) translate3d(${mousePos.x * -14}px, ${mousePos.y * -14}px, 0px)`,
                    }}
                    className={`absolute inset-y-0 ${
                      isLeft ? 'left-0 text-left items-start' : 'right-0 text-right items-end'
                    } w-full lg:w-[48%] flex flex-col justify-center space-y-6 sm:space-y-7 pointer-events-auto`}
                  >
                    {/* Small badge matching reference pill with interactive hover */}
                    <div className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                      <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1b152d]/90 border border-[#482d77]/60 text-[#c894ff] text-[11px] font-mono font-bold tracking-widest uppercase shadow-lg shadow-purple-950/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105 transition-all cursor-pointer group">
                        {stage.hasSparkle ? (
                          <Sparkles className="w-3.5 h-3.5 text-[#c894ff] animate-pulse group-hover:rotate-12 transition-transform" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                        )}
                        <span>{stage.label}</span>
                      </span>
                    </div>

                    {/* Main Headline with 3D text hover and live blinking terminal cursor */}
                    <div className="w-full">
                      {(() => {
                        const words = stage.headline.split(' ');
                        const allButLast = words.slice(0, -1).join(' ');
                        const lastWord = words[words.length - 1];
                        return (
                          <h1 className={`text-5xl sm:text-6xl lg:text-[64px] xl:text-[72px] font-extrabold text-white tracking-tight leading-[1.06] ${
                            isLeft ? 'text-left' : 'text-right'
                          } transition-all duration-300 hover:text-cyan-100 hover:drop-shadow-[0_0_35px_rgba(56,189,248,0.4)] cursor-default select-text group`}>
                            <span>{allButLast ? `${allButLast} ` : ''}</span>
                            <span className="inline-block whitespace-nowrap">
                              {lastWord}
                              <span className="inline-block w-2.5 sm:w-3 lg:w-3.5 h-8 sm:h-10 lg:h-12 bg-cyan-400 ml-2 animate-terminal-blink align-middle rounded-sm shadow-[0_0_12px_rgba(34,211,238,0.9)]"></span>
                            </span>
                          </h1>
                        );
                      })()}
                    </div>

                    {/* Interactive CLI Command Bar: Click-to-Copy */}
                    <div className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} pointer-events-auto`}>
                      <button
                        onClick={(e) => handleCopyCommand(e, stage.cliCommand)}
                        title="Click to copy command"
                        className={`inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-[#090e1a]/90 border ${
                          isCopied 
                            ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                            : 'border-slate-800 hover:border-cyan-500/80 text-slate-300 hover:text-white shadow-lg hover:shadow-cyan-500/15'
                        } font-mono text-xs transition-all duration-300 group cursor-pointer hover:scale-[1.02]`}
                      >
                        <span className="text-cyan-400 font-bold">$</span>
                        <span className="truncate max-w-[260px] sm:max-w-none">{stage.cliCommand.replace(/^\$\s*/, '')}</span>
                        <span className="w-1.5 h-3 bg-cyan-400/80 animate-terminal-blink"></span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-950/80 transition-colors ml-1">
                          {isCopied ? 'COPIED ✓' : 'COPY'}
                        </span>
                      </button>
                    </div>

                    {/* Supporting text */}
                    <div className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} pt-1`}>
                      <p className={`text-slate-300 text-sm sm:text-base lg:text-[17px] leading-relaxed font-normal max-w-lg select-text ${
                        isLeft ? 'text-left' : 'text-right'
                      }`}>
                        {stage.description}
                      </p>
                    </div>

                    {/* CTA Buttons matching reference high-contrast pill styling */}
                    <div className={`w-full flex flex-wrap items-center ${
                      isLeft ? 'justify-start' : 'justify-end'
                    } gap-4 pt-2 pointer-events-auto`}>
                      <Link
                        to={stage.ctaLink}
                        className="px-7 py-3.5 rounded-full bg-[#f5b738] hover:bg-[#e4a82b] text-[#121118] font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center space-x-3 shadow-xl shadow-amber-500/20 transition-all transform hover:scale-105 group"
                      >
                        <span>{stage.ctaText}</span>
                        <div className="w-6 h-6 rounded-full bg-[#121118] text-[#f5b738] flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowRight className="w-3.5 h-3.5 transform -rotate-45" />
                        </div>
                      </Link>

                      {idx === 0 && (
                        <Link
                          to="/labs"
                          className="px-6 py-3.5 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400/80 text-slate-200 hover:text-white font-mono text-xs sm:text-sm font-semibold flex items-center space-x-2 transition backdrop-blur-sm hover:scale-105"
                        >
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span>Explore Labs</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -------------------------------------------------------------
                FLOATING MODULE: INVERSE POSITION OF TEXT (RIGHT <-> LEFT)
               ------------------------------------------------------------- */}
            <div 
              style={{
                opacity: moduleOpacity,
                pointerEvents: moduleOpacity > 0.4 ? 'auto' : 'none',
                transform: `translate3d(-${translateXPercent}%, 0, 0)`,
                transition: 'opacity 0.2s ease-out, transform 0.3s ease-out',
              }}
              className="relative lg:absolute inset-y-0 right-0 w-full lg:w-[50%] flex items-center justify-center pointer-events-none"
            >
              
              {/* 3D Interactive Container with Mouse Parallax Tilt */}
              <div 
                className="relative w-full max-w-[560px] transition-transform duration-700 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${mousePos.y * -14}deg) rotateY(${mousePos.x * 16}deg) translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 0px)`
                }}
              >
                
                {/* 3D Isometric DevOps Machine Render (Rich SVG & Layers) */}
                <div className="relative w-full aspect-[4/3] rounded-3xl p-2 flex items-center justify-center">
                  <svg
                    viewBox="0 0 600 480"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
                  >
                    <defs>
                      <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#323846" />
                        <stop offset="50%" stopColor="#1e2330" />
                        <stop offset="100%" stopColor="#141824" />
                      </linearGradient>
                      <linearGradient id="chamberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2a2040" />
                        <stop offset="100%" stopColor="#130d22" />
                      </linearGradient>
                      <linearGradient id="goldCoin" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffe685" />
                        <stop offset="50%" stopColor="#f5b738" />
                        <stop offset="100%" stopColor="#b27912" />
                      </linearGradient>
                      <linearGradient id="cyanCoin" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0e7490" />
                      </linearGradient>
                      <linearGradient id="purplePipe" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7952b3" />
                        <stop offset="100%" stopColor="#563d7c" />
                      </linearGradient>
                    </defs>

                    {/* Base Ground Shadow */}
                    <ellipse cx="300" cy="410" rx="240" ry="45" fill="#04060a" opacity="0.85" />

                    {/* Machine 1: Power & Cooling Unit (Left Module) */}
                    <path d="M70 200 L170 145 L240 185 L140 240 Z" fill="#2d3342" />
                    <path d="M70 200 L140 240 L140 310 L70 270 Z" fill="#1b202c" />
                    <path d="M140 240 L240 185 L240 255 L140 310 Z" fill="#242a38" />

                    {/* Cooling Turbine / Fan inside Left Module */}
                    <circle cx="190" cy="210" r="32" fill="#12151d" stroke="#f5b738" strokeWidth="2.5" />
                    <g className="animate-spin-slow" style={{ transformOrigin: '190px 210px' }}>
                      <line x1="190" y1="182" x2="190" y2="238" stroke="#f5b738" strokeWidth="3" strokeLinecap="round" />
                      <line x1="162" y1="210" x2="218" y2="210" stroke="#f5b738" strokeWidth="3" strokeLinecap="round" />
                      <line x1="170" y1="190" x2="210" y2="230" stroke="#f5b738" strokeWidth="2" strokeLinecap="round" />
                      <line x1="210" y1="190" x2="170" y2="230" stroke="#f5b738" strokeWidth="2" strokeLinecap="round" />
                    </g>
                    <circle cx="190" cy="210" r="8" fill="#f5b738" />

                    {/* Machine 2: Main Processing Chamber (Central/Right Module) */}
                    <path d="M220 150 L380 70 L480 125 L320 205 Z" fill="#323847" />
                    <path d="M220 150 L320 205 L320 310 L220 255 Z" fill="#1b202b" />
                    <path d="M320 205 L480 125 L480 230 L320 310 Z" fill="#252b39" />

                    {/* Chamber Inset Glowing Cavity */}
                    <path d="M250 170 L360 115 L440 155 L330 210 Z" fill="url(#chamberGrad)" stroke="#7c3aed" strokeWidth="1.5" />

                    {/* Conveyor Belt Track */}
                    <path d="M270 185 L350 145 L420 180 L340 220 Z" fill="#0d1017" stroke="#334155" strokeWidth="1" />
                    <line x1="290" y1="175" x2="315" y2="232" stroke="#1e293b" strokeWidth="2" />
                    <line x1="320" y1="160" x2="345" y2="217" stroke="#1e293b" strokeWidth="2" />
                    <line x1="350" y1="145" x2="375" y2="202" stroke="#1e293b" strokeWidth="2" />
                    <line x1="380" y1="130" x2="405" y2="187" stroke="#1e293b" strokeWidth="2" />

                    {/* Glowing Technology Tokens moving along Conveyor Belt */}
                    {/* Token 1: Docker (Cyan Token) */}
                    <g className="animate-conveyor-token" style={{ transformOrigin: '320px 170px' }}>
                      <ellipse cx="320" cy="180" rx="16" ry="9" fill="url(#cyanCoin)" />
                      <ellipse cx="320" cy="177" rx="16" ry="9" fill="#22d3ee" />
                      <path d="M314 176 h12 v2 h-12 Z" fill="#083344" />
                    </g>

                    {/* Token 2: Kubernetes (Gold Token) */}
                    <g className="animate-conveyor-token" style={{ animationDelay: '0.6s', transformOrigin: '365px 155px' }}>
                      <ellipse cx="365" cy="165" rx="17" ry="10" fill="url(#goldCoin)" />
                      <ellipse cx="365" cy="162" rx="17" ry="10" fill="#fde047" />
                      <circle cx="365" cy="162" r="5" fill="#713f12" />
                    </g>

                    {/* Token 3: Terraform (Gold Token) */}
                    <g className="animate-conveyor-token" style={{ animationDelay: '1.2s', transformOrigin: '405px 140px' }}>
                      <ellipse cx="405" cy="150" rx="15" ry="9" fill="url(#goldCoin)" />
                      <ellipse cx="405" cy="147" rx="15" ry="9" fill="#facc15" />
                    </g>

                    {/* Output Pedestal 1 (Right Front) */}
                    <path d="M410 250 L470 220 L510 240 L450 270 Z" fill="#2d3342" />
                    <path d="M410 250 L450 270 L450 320 L410 300 Z" fill="#1c202a" />
                    <path d="M450 270 L510 240 L510 290 L450 320 Z" fill="#252b38" />
                    {/* Glowing Gold Ring / Token on Pedestal 1 */}
                    <ellipse cx="460" cy="245" rx="18" ry="10" fill="none" stroke="#f5b738" strokeWidth="2.5" />
                    <ellipse cx="460" cy="242" rx="16" ry="9" fill="url(#goldCoin)" className="animate-pulse" />

                    {/* Output Pedestal 2 (Far Right) */}
                    <path d="M480 180 L530 155 L565 170 L515 195 Z" fill="#2d3342" />
                    <path d="M480 180 L515 195 L515 240 L480 225 Z" fill="#1c202a" />
                    <path d="M515 195 L565 170 L565 215 L515 240 Z" fill="#252b38" />
                    <ellipse cx="522" cy="178" rx="16" ry="9" fill="url(#goldCoin)" className="animate-pulse" />

                    {/* Animated Neon Violet Conduit Cables linking Modules */}
                    <path d="M140 280 C 180 320, 240 330, 290 280" stroke="#7952b3" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M140 280 C 180 320, 240 330, 290 280" stroke="#c084fc" strokeWidth="1.5" fill="none" className="animate-cable" />

                    <path d="M150 295 C 190 335, 250 345, 300 295" stroke="#7952b3" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M150 295 C 190 335, 250 345, 300 295" stroke="#c084fc" strokeWidth="1.5" fill="none" className="animate-cable" />

                    {/* Side Telemetry Monitor on Chamber Body */}
                    <rect x="230" y="210" width="34" height="24" rx="3" fill="#080b12" stroke="#334155" strokeWidth="1" />
                    <polyline points="234,226 240,220 246,224 252,216 258,222" fill="none" stroke="#f5b738" strokeWidth="1.5" />

                    {/* LED Array Indicators */}
                    <circle cx="236" cy="242" r="2" fill="#22c55e" />
                    <circle cx="244" cy="242" r="2" fill="#22c55e" />
                    <circle cx="252" cy="242" r="2" fill="#f5b738" />
                  </svg>
                </div>

                {/* Floating Realistic Terminal Cards around the 3D Machine */}
                {HERO_TERMINALS.map((t) => {
                  const isLeftModule = modulePos >= 0.5;
                  const pos = isLeftModule ? t.posLeft : t.posRight;
                  return (
                    <div
                      key={t.id}
                      className="absolute pointer-events-auto hidden sm:block will-change-transform"
                      style={{
                        top: `${pos.top}%`,
                        left: `${pos.left}%`,
                        transform: `translate3d(${mousePos.x * t.depth * 25}px, ${mousePos.y * t.depth * 25}px, ${t.depth * 20}px) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                        zIndex: Math.round(t.depth * 10),
                        transitionProperty: 'top, left, transform',
                        transitionDuration: '950ms',
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
                        transitionDelay: t.flyDelay,
                      }}
                    >
                      <div className={`${t.animationClass} hover:scale-105 transition-transform duration-300`}>
                        <div className="w-56 lg:w-64 bg-[#090d16]/95 border border-slate-700/80 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(56,189,248,0.12)] backdrop-blur-md overflow-hidden hover:border-cyan-400/80 transition-all">
                          {/* Terminal Chrome */}
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800">
                            <div className="flex space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                              <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{t.title}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${t.tagColor}`}>
                              {t.tag}
                            </span>
                          </div>

                          {/* Terminal Code Body */}
                          <div className="p-3 font-mono text-xs space-y-1 text-left bg-[#070910]">
                            <div className="text-cyan-400 flex items-center font-bold">
                              <span>{t.command}</span>
                              <span className="w-1.5 h-3 bg-cyan-400 ml-1 animate-terminal-blink"></span>
                            </div>
                            <pre className={`${t.statusColor} text-[11px] whitespace-pre-line font-mono`}>
                              {t.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* -------------------------------------------------------------
                    BOTTOM-RIGHT / BOTTOM-LEFT FLOATING GLASS WIDGET
                   ------------------------------------------------------------- */}
                {showFloater && (
                  <div 
                    className="absolute -bottom-6 sm:-bottom-8 z-30 max-w-[280px] sm:max-w-[310px] p-4 rounded-2xl bg-[#141224]/85 border border-[#3b2a5c]/80 backdrop-blur-xl shadow-2xl shadow-purple-950/50 space-y-3 text-left transition-all duration-700 pointer-events-auto"
                    style={{
                      left: modulePos >= 0.5 ? '0%' : '52%',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Terminal className="w-4 h-4 text-white" />
                      </div>
                      <button 
                        onClick={() => setShowFloater(false)}
                        className="text-slate-400 hover:text-white p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 font-normal leading-relaxed">
                      Live Kubernetes Pod Engine: Dedicated container sandbox provisioned in &lt;4s with zero local setup.
                    </p>

                    <div>
                      <Link
                        to="/register"
                        className="inline-block px-4 py-1.5 rounded-full bg-[#f5b738] hover:bg-[#e4a82b] text-[#121118] font-bold text-[11px] tracking-wide transition shadow-md"
                      >
                        Launch Sandbox
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================================
          SCROLL STORYTELLING: CONVERGENCE REVEAL
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 max-w-xl text-left">
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Interactive Laboratory Experience</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                100+ Hands-on DevOps Labs
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Step into dedicated terminal environments pre-configured with industry tools. Practice configuration, deployment, debugging, and cloud infrastructure with zero setup.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <div className="text-2xl font-extrabold text-white">30 Hours</div>
                <div className="text-[11px] text-slate-400 uppercase">Monthly Free Quota</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <div className="text-2xl font-extrabold text-cyan-400">&lt; 5 Sec</div>
                <div className="text-[11px] text-slate-400 uppercase">Pod Provisioning</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <div className="text-2xl font-extrabold text-emerald-400">100%</div>
                <div className="text-[11px] text-slate-400 uppercase">Real Shell Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TECHNOLOGY ECOSYSTEM: FLOATING TERMINAL COMMANDS
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/60">
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Command Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Technology Ecosystem
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Not ordinary logo cards. Explore technologies as live terminal commands and realistic output.
          </p>
        </div>

        {/* Technology Selector Tabs (as CLI buttons) */}
        <div className="flex flex-wrap justify-center gap-3">
          {ECOSYSTEM_TECHNOLOGIES.map((tech) => {
            const isSelected = selectedTech.id === tech.id;
            return (
              <button
                key={tech.id}
                onClick={() => setSelectedTech(tech)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 scale-105'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-cyan-400">$</span>
                <span>{tech.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-cyan-800 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tech.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Terminal Output for Selected Technology */}
        <div className="max-w-4xl mx-auto bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel glow-indigo">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">
                {selectedTech.name} Live Sandbox • {selectedTech.category}
              </span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
              INTERACTIVE CLI
            </span>
          </div>

          <div className="p-6 font-mono text-xs sm:text-sm space-y-4 text-left bg-[#07090f]">
            <div className="text-cyan-400 font-bold flex items-center">
              <span>{selectedTech.command}</span>
              <span className="w-2 h-4 bg-cyan-400 ml-1.5 animate-terminal-blink"></span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {selectedTech.output}
            </pre>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/60 flex justify-between items-center">
              <span>{selectedTech.description}</span>
              <Link 
                to="/labs" 
                className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center text-xs"
              >
                Practice in Lab <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED LABS SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Kubernetes Workspaces</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Featured Labs
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Launch dedicated container environments with pre-loaded tools, instructions, and automatic objective verification.
            </p>
          </div>

          <Link
            to="/labs"
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white text-xs font-mono font-bold flex items-center space-x-2 transition hover:border-cyan-500"
          >
            <span>View All 100+ Labs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 8 Lab Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_LABS.map((lab) => (
            <div
              key={lab.title}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4 shadow-xl hover:-translate-y-1 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${lab.bgBadge}`}>
                    {lab.technology}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {lab.duration}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {lab.title}
                </h3>

                <div className="bg-[#07090f] p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 truncate">
                  <span className="text-cyan-400">$ </span>
                  <span>{lab.commandPreview.replace('$ ', '')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Difficulty: <strong className="text-slate-200">{lab.difficulty}</strong>
                </span>

                <Link
                  to="/labs"
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-mono text-xs font-bold flex items-center space-x-1 transition shadow-md"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Lab</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          LEARNING PATHS: ANIMATED TERMINAL CONNECTIONS
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/60">
            <Layers className="w-3.5 h-3.5" />
            <span>Structured DevOps Curriculum</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Learning Paths
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            From absolute Linux terminal basics to enterprise cloud architecture. Follow step-by-step career progressions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {LEARNING_PATHS.map((path) => (
            <div
              key={path.id}
              className="p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl hover:border-indigo-500/50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800/60 font-bold">
                    {path.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">{path.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {path.focus}
              </p>

              <div className="bg-[#07090f] p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Interactive Path Pipeline</div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  {path.stages.map((stage, idx) => (
                    <React.Fragment key={stage}>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold">
                        {stage}
                      </span>
                      {idx < path.stages.length - 1 && (
                        <span className="text-cyan-400 font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="font-mono text-xs text-cyan-300 truncate max-w-[280px]">
                  {path.commandSnippet}
                </div>
                <Link
                  to="/labs"
                  className="text-xs font-mono text-indigo-400 hover:text-white font-bold inline-flex items-center"
                >
                  <span>Explore Path</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          MISSION-BASED LABS SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800/60">
            <Flame className="w-3.5 h-3.5" />
            <span>Scenario-Driven Challenges</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Mission-Based Labs
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Real incident simulations and real objectives. Solve mission scenarios and earn verifiable skill badges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MISSIONS.map((m) => (
            <div
              key={m.number}
              className="p-7 rounded-2xl bg-[#090d16] border border-slate-800 space-y-5 shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-extrabold text-cyan-400 tracking-wider">
                  {m.number} • {m.difficulty}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {m.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {m.objective}
                </p>
              </div>

              <div className="bg-[#05070c] p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px]">Required Commands:</div>
                <div className="text-cyan-400 truncate">{m.cliSnippet}</div>
                <div className="text-emerald-400 text-[11px] pt-1 border-t border-slate-800/60 font-semibold">
                  {m.validationCheck}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  to="/labs"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-950/50 flex items-center space-x-1.5 transition"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Accept Mission</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          HOW BYOLABS WORKS: 6-STAGE WORKFLOW
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/60">
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Workflow Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How BYOLabs Works
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            From lab selection to in-pod verification, everything executes seamlessly in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKFLOW_STEPS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">
                      {item.step}
                    </span>
                    <IconComponent className="w-5 h-5 text-slate-400" />
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>

                  <div className="bg-[#06080e] p-3 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1">
                    <div className="text-cyan-400 truncate">{item.command}</div>
                    <div className="text-slate-400 text-[11px] truncate">{item.output}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          STUDENT PROGRESS: LIVE TERMINAL METRICS DASHBOARD
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
            <Activity className="w-3.5 h-3.5" />
            <span>Real-time Learning Telemetry</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Student Progress Dashboard
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Track your hours, completion milestones, and technology mastery with terminal-inspired indicators.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel glow-emerald">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">
                student-dashboard • session: abhay_d (Pro Tier)
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800/60 font-bold">
              ● 12 DAY STREAK
            </span>
          </div>

          <div className="p-8 font-mono space-y-8 bg-[#07090f]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">Labs Completed</div>
                <div className="text-2xl font-extrabold text-white mt-1">24 / 30</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">80% of goal</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">Practice Hours</div>
                <div className="text-2xl font-extrabold text-cyan-400 mt-1">38.5 hrs</div>
                <div className="text-[10px] text-slate-400 mt-0.5">30h monthly reset</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">Tech Mastered</div>
                <div className="text-2xl font-extrabold text-indigo-400 mt-1">8 Tools</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Linux, K8s, Docker...</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">Certifications</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">3 Verified</div>
                <div className="text-[10px] text-amber-300 mt-0.5">Credible & Shareable</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs uppercase text-slate-400 tracking-wider">
                Technology Competency Bars
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-cyan-400 font-bold">Kubernetes</span>
                    <span className="text-slate-300">80% (16 labs)</span>
                  </div>
                  <div className="text-cyan-300 tracking-widest font-mono">
                    [████████░░] 80%
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-cyan-400 font-bold">Docker Containers</span>
                    <span className="text-emerald-400 font-bold">100% (12 labs) ✓</span>
                  </div>
                  <div className="text-emerald-400 tracking-widest font-mono">
                    [██████████] 100%
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-indigo-400 font-bold">Terraform IaC</span>
                    <span className="text-slate-300">60% (9 labs)</span>
                  </div>
                  <div className="text-indigo-300 tracking-widest font-mono">
                    [██████░░░░] 60%
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-bold">Linux Administration</span>
                    <span className="text-slate-300">90% (18 labs)</span>
                  </div>
                  <div className="text-emerald-300 tracking-widest font-mono">
                    [█████████░] 90%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TESTIMONIALS: TERMINAL WINDOWS AS TESTIMONIAL CARDS
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60">
            <Award className="w-3.5 h-3.5" />
            <span>Learner Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            What DevOps Engineers Say
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Real feedback from software engineers, SREs, and DevOps professionals who practice on BYOLabs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-[#090d16] border border-slate-800 rounded-2xl shadow-xl overflow-hidden glass-panel flex flex-col justify-between hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">student --review</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">VERIFIED</span>
              </div>

              <div className="p-6 font-mono text-xs space-y-4 text-left bg-[#070a10] flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-cyan-400 font-bold">
                    $ student --review --id={t.id}
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1">
                  <div className="font-bold text-white text-xs">{t.name}</div>
                  <div className="text-[11px] text-slate-400">{t.role}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center pt-0.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {t.labsCount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          FINAL CTA: CONVERGING CENTRAL TERMINAL
         ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel glow-cyan text-left">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-mono text-slate-300 ml-2 font-bold">
                byolabs-terminal • main
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400 flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5 animate-ping"></span>
              SESSION READY
            </span>
          </div>

          <div className="p-8 sm:p-10 font-mono text-sm sm:text-base space-y-5 bg-[#06080e]">
            <div className="text-cyan-400 font-bold">
              $ byolabs start
            </div>

            <div className="text-slate-300 space-y-2 text-xs sm:text-sm">
              <p className="text-indigo-300 font-semibold">
                Initializing your DevOps journey...
              </p>
              <div className="space-y-1 text-slate-400">
                <div className="flex items-center text-emerald-400">
                  <span className="w-24">Linux</span> <span>✓ Subsystem Ready</span>
                </div>
                <div className="flex items-center text-emerald-400">
                  <span className="w-24">Docker</span> <span>✓ Daemon Online</span>
                </div>
                <div className="flex items-center text-cyan-400">
                  <span className="w-24">Kubernetes</span> <span>→ Connecting to Pods...</span>
                </div>
                <div className="flex items-center text-indigo-400">
                  <span className="w-24">Terraform</span> <span>→ Cloud Provider Loaded...</span>
                </div>
                <div className="flex items-center text-purple-400">
                  <span className="w-24">Cloud</span> <span>→ 30-Hour Quota Initialized...</span>
                </div>
              </div>

              <p className="text-white font-bold pt-2">
                Ready to build.
              </p>
            </div>

            <div className="flex items-center text-cyan-400 pt-2 border-t border-slate-800">
              <span>$ &nbsp;</span>
              <span className="w-2.5 h-5 bg-cyan-400 animate-terminal-blink"></span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700 hover:from-cyan-400 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
              >
                <span>Start Your First Lab →</span>
              </Link>
              <Link
                to="/labs"
                className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-sm flex items-center justify-center space-x-2 transition"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Explore Lab Catalog</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER: TERMINAL TELEMETRY & NAV
         ========================================================================= */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center">
              BYOLabs<span className="text-cyan-400">.in</span>
            </span>
            <span className="text-xs font-mono text-slate-500">|</span>
            <span className="text-xs font-mono text-slate-400">
              Interactive Kubernetes Pod Labs
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Cluster 1 (US-East): Online
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Cluster 2 (AP-South): Online
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono text-slate-400">
            <Link to="/labs" className="hover:text-cyan-400 transition">Labs</Link>
            <Link to="/login" className="hover:text-cyan-400 transition">Sign In</Link>
            <Link to="/register" className="hover:text-cyan-400 transition">Register</Link>
            <span className="text-slate-600">root@byolabs:~# exit</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
