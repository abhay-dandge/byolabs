import bcrypt from 'bcryptjs';
import { db } from './store.js';
import { User, Lab } from '@byolabs/shared';

export async function seedDatabase() {
  console.log('[Seeder] Seeding initial database records...');

  // 1. Initial Admin User
  const adminSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', adminSalt);

  const adminUser: User = {
    id: 'usr-admin-001',
    name: 'BYOLabs Administrator',
    email: 'admin@byolabs.in',
    username: 'admin',
    role: 'ADMIN',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Initial Catalog Labs
  const seedLabs: Lab[] = [
    {
      id: 'lab-ubuntu-playground',
      slug: 'ubuntu-playground',
      name: 'Ubuntu Playground',
      description: 'Full interactive Ubuntu 24.04 LTS sandbox container equipped with bash, curl, wget, git, iproute2, vim, nano, and python.',
      category: 'Linux',
      difficulty: 'Beginner',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Ubuntu 24.04 Playground

Welcome to your isolated **Ubuntu 24.04** container environment running as a Kubernetes pod.

## Prerequisites & Tools
This container comes pre-configured with:
- \`bash\`
- \`curl\`, \`wget\`, \`git\`
- \`iproute2\` (\`ip a\`, \`ip route\`), \`net-tools\`
- \`procps\` (\`ps aux\`, \`top\`)
- \`vim\`, \`nano\`

---

## Guided Exercises

### Step 1: Inspect System Release & Kernel
Run the following command in the interactive terminal on the right to view your OS version:

\`\`\`bash
cat /etc/os-release
uname -a
\`\`\`

### Step 2: Working Directory & Environment Variables
Check your current working directory and active shell environment:

\`\`\`bash
pwd
whoami
env | grep USER
\`\`\`

### Step 3: Create a DevOps Workspace Directory
Create a directory named \`devops\` in your home directory:

\`\`\`bash
mkdir -p ~/devops && cd ~/devops
pwd
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-1',
          title: 'Check Ubuntu OS Version',
          description: 'Execute `cat /etc/os-release` in the terminal to verify the container image.',
          validationScript: 'grep -i "ubuntu" /etc/os-release',
        },
        {
          id: 'task-2',
          title: 'Create ~/devops Directory',
          description: 'Create a directory named `devops` inside your home directory.',
          validationScript: 'test -d ~/devops || test -d /root/devops',
        },
        {
          id: 'task-3',
          title: 'Create hello.txt file',
          description: 'Write "Welcome to BYOLabs" into a file named `hello.txt` inside ~/devops.',
          validationScript: 'grep -i "Welcome to BYOLabs" ~/devops/hello.txt || grep -i "Welcome to BYOLabs" /root/devops/hello.txt',
        },
      ],
    },
    {
      id: 'lab-linux-fundamentals',
      slug: 'linux-fundamentals',
      name: 'Linux Fundamentals & File Permissions',
      description: 'Master core Linux shell navigation, file manipulation, file permissions (chmod, chown), and process management.',
      category: 'Linux',
      difficulty: 'Beginner',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '512Mi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Linux Fundamentals & File System Permissions

Learn essential file ownership and permission control in Linux environments.

## Quick Commands
- \`chmod 755 filename\`
- \`chown user:group filename\`
- \`ls -la\`

\`\`\`bash
touch sample.sh
chmod +x sample.sh
./sample.sh
\`\`\`
      `,
      tasks: [
        {
          id: 'task-permissions',
          title: 'Make Script Executable',
          description: 'Create a script `/tmp/run.sh` and make it executable with `chmod +x /tmp/run.sh`.',
          validationScript: 'test -x /tmp/run.sh',
        },
      ],
    },
    {
      id: 'lab-docker-playground',
      slug: 'docker-playground',
      name: 'Docker Playground',
      description: 'Interactive Docker Playground powered by official docker:dind image with instant startup and full root access.',
      category: 'Docker',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:dind',
      cpuRequest: '100m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '2Gi',
      storage: '2Gi',
      startupCommand: '/bin/sh',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Docker Playground (Ubuntu 24.04 Engine)

Welcome to your isolated **Docker Playground** running on **Ubuntu 24.04 LTS**!

---

## Environment Architecture
- **Operating System**: Ubuntu 24.04 LTS
- **Docker Engine**: Installed automatically on boot via official \`curl -fsSL https://get.docker.com | sh\` script
- **Daemon**: \`dockerd\` running natively in background with full container creation capability

---

## Guided Exercises

### Step 1: Verify Installed Docker Engine & Daemon
Verify CLI communication with the Docker daemon:

\`\`\`bash
docker version
docker info
\`\`\`

### Step 2: Test Container Lifecycle & Hello-World
Run a lightweight \`hello-world\` container:

\`\`\`bash
docker run hello-world
\`\`\`

### Step 3: Pull & Inspect Alpine Linux Image
Pull the official \`alpine\` image:

\`\`\`bash
docker pull alpine
docker images
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-docker-play-1',
          title: '1. Verify Docker Daemon Connection (docker version)',
          description: 'Execute `docker version` or `docker info` in the terminal to confirm CLI connection to the rootless daemon.',
          validationScript: 'docker version || docker info',
        },
        {
          id: 'task-docker-play-2',
          title: '2. Run Hello-World Container',
          description: 'Run `docker run hello-world` in terminal.',
          validationScript: 'docker ps -a | grep -i "hello-world" || docker images | grep -q "hello-world"',
        },
        {
          id: 'task-docker-play-3',
          title: '3. Pull Alpine Image',
          description: 'Execute `docker pull alpine` in terminal.',
          validationScript: 'docker image inspect alpine >/dev/null 2>&1 || docker images | grep -q "alpine"',
        },
      ],
    },
    {
      id: 'lab-podman-playground',
      slug: 'podman-playground',
      name: 'Podman Playground',
      description: 'Interactive Podman container sandbox running on the Standard GKE cluster with crun OCI runtime. Practice daemonless container lifecycle, image management, and Podman pods.',
      category: 'Podman',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'quay.io/podman/stable',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '2Gi',
      storage: '2Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Podman Playground (Standard GKE Cluster)

Welcome to your isolated **Podman Playground** running with full rootful container capabilities on the **Standard Kubernetes Cluster**!

---

## What is Podman?
**Podman** (Pod Manager) is an open-source, daemonless, OCI-compliant container engine developed by Red Hat. Unlike Docker, Podman:
- Operates **without a background daemon** (\`dockerd\`) — every container is a direct child of the Podman process (managed via Conmon).
- Provides native support for **Pods** (groups of containers sharing network and namespaces, identical to Kubernetes Pods).
- Can generate and play Kubernetes YAML manifests directly using \`podman kube generate\` and \`podman kube play\`.
- CLI syntax is 1:1 compatible with Docker (\`alias docker=podman\`).

---

## Guided Exercises

### Step 1: Inspect Podman Engine & Host Environment
Verify your Podman version and check the underlying OCI runtime (\`crun\`), storage graph driver (\`overlay\`), and network backend (\`netavark\`):

\`\`\`bash
podman --version
podman info
\`\`\`

### Step 2: Pull and Manage OCI Images
Pull a lightweight Alpine Linux image from Docker Hub or Fedora registry:

\`\`\`bash
podman pull alpine
podman images
\`\`\`

### Step 3: Run Interactive and Background Containers
Run a container using Podman:

\`\`\`bash
# Run a one-off Alpine container
podman run --rm alpine uname -a

# Run a named container in background
podman run --name my-alpine -d alpine sleep 3600
podman ps -a
\`\`\`

### Step 4: Work with Podman Pods
Podman's flagship feature is managing pods without requiring a Kubernetes cluster:

\`\`\`bash
# Create a new Pod named web-pod
podman pod create --name web-pod -p 8080:80

# List pods
podman pod ps

# Run a container inside the pod
podman run -d --pod web-pod --name web-server nginx:alpine
podman pod inspect web-pod
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-podman-1',
          title: '1. Verify Podman Engine & Version',
          description: 'Run `podman --version` or `podman info` in the terminal to inspect the active Podman engine.',
          validationScript: 'podman --version || podman info',
        },
        {
          id: 'task-podman-2',
          title: '2. Pull Alpine Container Image',
          description: 'Pull the `alpine` image from registry using `podman pull alpine`.',
          validationScript: 'podman images | grep -q "alpine" || podman image exists alpine',
        },
        {
          id: 'task-podman-3',
          title: '3. Run a Container with Podman',
          description: 'Run a container named `my-alpine` or any container using `podman run`.',
          validationScript: 'podman ps -a | grep -iE "alpine|my-alpine" || [ $(podman ps -a -q | wc -l) -gt 0 ]',
        },
        {
          id: 'task-podman-4',
          title: '4. Create a Podman Pod',
          description: 'Create a Podman pod named `web-pod` using `podman pod create --name web-pod`.',
          validationScript: 'podman pod exists web-pod || podman pod ps | grep -q "web-pod"',
        },
      ],
    },
    {
  id: "lab-kubernetes-basics",
  slug: "kubernetes-basics",
  name: "Kubernetes Pods & Workloads (K3s Cluster)",
  description: "Full interactive single-node Kubernetes v1.31 cluster powered by K3s. Practice writing pod specs, deployments, services, namespaces, and imperative kubectl commands.",
  category: "Kubernetes",
  difficulty: "Intermediate",
  durationMinutes: 60,
  dockerImage: "rancher/k3s:v1.31.1-k3s1",
  cpuRequest: "250m",
  cpuLimit: "1.5",
  memoryRequest: "512Mi",
  memoryLimit: "2Gi",
  storage: "2Gi",
  startupCommand: "/bin/sh",
  terminalEnabled: true,
  browserAccess: true,
  isPublished: true,
  createdAt: "2026-10-13T13:49:10.020Z",
  updatedAt: "2026-10-13T13:49:10.020Z",
  instructionsMarkdown: "\n# Kubernetes Pods & Workload Basics (K3s Cluster)\n\nWelcome to your isolated, dedicated **Kubernetes v1.31** cluster powered by K3s!\nYou have full **`cluster-admin`** privileges inside this environment.\n\n---\n\n## ⚡ Verification & Getting Started\nYour cluster bootstraps automatically on startup (~10s). Check your single-node control plane:\n\n```bash\nkubectl get nodes\nkubectl cluster-info\nalias k=kubectl\n```\n\n---\n\n## Guided Exercises\n\n### Step 1: Create a Custom Namespace\nIsolate application workloads inside a dedicated namespace:\n\n```bash\nkubectl create namespace dev\nkubectl get namespaces\n```\n\n### Step 2: Deploy an Imperative Pod\nLaunch a standalone Nginx pod inside the `dev` namespace:\n\n```bash\nkubectl run web-pod --image=nginx:alpine -n dev\nkubectl get pods -n dev\n```\n\n### Step 3: Create a Scalable Deployment\nDeploy a replicated web application:\n\n```bash\nkubectl create deployment api-server --image=nginx:alpine --replicas=2 -n dev\nkubectl get deployments -n dev\nkubectl get pods -n dev -l app=api-server\n```\n\n### Step 4: Expose the Deployment with a Service\nCreate a Service to balance traffic across the pods:\n\n```bash\nkubectl expose deployment api-server --port=80 --type=NodePort -n dev\nkubectl get svc -n dev\n```\n\n### Step 5: Declarative YAML Manifest\nPractice writing and applying a declarative YAML manifest:\n\n```bash\ncat << 'EOF' > my-app.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: demo-app\n  namespace: dev\n  labels:\n    tier: frontend\nspec:\n  containers:\n  - name: web\n    image: nginx:alpine\n    ports:\n    - containerPort: 80\nEOF\n\nkubectl apply -f my-app.yaml\nkubectl get pod demo-app -n dev\n```\n  ",
  tasks: [
    {
      id: "task-k8s-1",
      title: "1. Verify Cluster Health (kubectl get nodes)",
      description: "Run `kubectl get nodes` to verify the control-plane node is in Ready status.",
      validationScript: "kubectl get nodes --no-headers 2>/dev/null | grep -q \"Ready\""
    },
    {
      id: "task-k8s-2",
      title: "2. Create \"dev\" Namespace",
      description: "Create a namespace named `dev` using `kubectl create namespace dev`.",
      validationScript: "kubectl get ns dev >/dev/null 2>&1"
    },
    {
      id: "task-k8s-3",
      title: "3. Run \"web-pod\" in \"dev\" Namespace",
      description: "Launch a pod named `web-pod` running `nginx:alpine` inside the `dev` namespace.",
      validationScript: "kubectl get pod web-pod -n dev >/dev/null 2>&1"
    },
    {
      id: "task-k8s-4",
      title: "4. Create \"api-server\" Deployment (2 Replicas)",
      description: "Create a deployment named `api-server` with 2 replicas in the `dev` namespace.",
      validationScript: "kubectl get deployment api-server -n dev >/dev/null 2>&1"
    },
    {
      id: "task-k8s-5",
      title: "5. Expose \"api-server\" as a Service",
      description: "Expose `api-server` on port 80 as a Service in the `dev` namespace.",
      validationScript: "kubectl get svc api-server -n dev >/dev/null 2>&1"
    }
  ]
},
    {
      id: 'lab-git-playground',
      slug: 'git-playground',
      name: 'Git Version Control & Branching',
      description: 'Practice git initialization, commits, branching strategies, merge conflict resolution, and rebase operations.',
      category: 'Git',
      difficulty: 'Beginner',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '512Mi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Git Branching & Version Control

Practice initializing repositories and managing branches.

\`\`\`bash
mkdir my-repo && cd my-repo
git init
git config user.name "Student"
git config user.email "student@byolabs.in"
echo "Initial commit" > README.md
git add .
git commit -m "Initial commit"
\`\`\`
      `,
      tasks: [
        {
          id: 'task-git-1',
          title: 'Initialize Git Repo',
          description: 'Initialize a git repository in a directory named `my-repo` and create a initial commit.',
          validationScript: 'test -d my-repo/.git || test -d ~/my-repo/.git',
        },
      ],
    },
    {
      id: 'lab-rhcsa-cla-module1',
      slug: 'rhcsa-cla-module1',
      name: 'RHCSA & CLA Module 1 Gradable Tasks',
      description: 'Unnati Development and Training Center RHCSA+CLA Module 1 practical gradable task suite covering file creation, directory trees, process output redirection, file relocation, and hidden files.',
      category: 'Linux',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# RHCSA & CLA Module 1 Gradable Tasks
*Unnati Development and Training Center*

Welcome to your Linux RHCSA & CLA Module 1 practical lab environment. Execute the commands in the terminal window to fulfill all 12 gradable task requirements.
      `,
      tasks: [
        {
          id: 'task-mod1-1',
          title: '1. Create /root/myfile.doc with directory path',
          description: 'Create a file named "/root/myfile.doc" and store the location of the "/root" directory within it.',
          validationScript: 'test -f /root/myfile.doc && grep -q "/root" /root/myfile.doc',
        },
        {
          id: 'task-mod1-2',
          title: '2. Generate file1, file2, file3 simultaneously',
          description: 'Generate three files "file1", "file2", and "file3" simultaneously in the "/root" directory.',
          validationScript: 'test -f /root/file1 && test -f /root/file2 && test -f /root/file3',
        },
        {
          id: 'task-mod1-3',
          title: '3. Store current date in /date.txt',
          description: 'Store the current date output in a file named "/date.txt".',
          validationScript: 'test -s /date.txt',
        },
        {
          id: 'task-mod1-4',
          title: '4. Save /bin listing into /list.txt',
          description: 'Retrieve a list of files and directories from the "/bin" folder and save it in "/list.txt".',
          validationScript: 'test -s /list.txt',
        },
        {
          id: 'task-mod1-5',
          title: '5. Record username and working directory',
          description: 'Record the username and current working directory in "/root/mydata/userfile.txt".',
          validationScript: 'test -s /root/mydata/userfile.txt',
        },
        {
          id: 'task-mod1-6',
          title: '6. Establish directory /root/unnati/cidco/aurangabad',
          description: 'Establish a collaborative directory path at "/root/unnati/cidco/aurangabad".',
          validationScript: 'test -d /root/unnati/cidco/aurangabad',
        },
        {
          id: 'task-mod1-7',
          title: '7. Generate linuxdata1 to linuxdata10 folders',
          description: 'Generate ten folders named "linuxdata1" to "linuxdata10" within the "/root" directory.',
          validationScript: 'for i in $(seq 1 10); do test -d "/root/linuxdata$i" || exit 1; done',
        },
        {
          id: 'task-mod1-8',
          title: '8. Create reddata path and unnati1.php..10.php',
          description: 'Create directory path "/root/data/gdata/reddata" and generate ten .php files named "unnati1.php" through "unnati10.php".',
          validationScript: 'for i in $(seq 1 10); do test -f "/root/data/gdata/reddata/unnati$i.php" || exit 1; done',
        },
        {
          id: 'task-mod1-9',
          title: '9. Duplicate /etc/fstab to /root/mdata/fstab.backup',
          description: 'Duplicate the file "/etc/fstab" and store the duplicate as "/root/mdata/fstab.backup".',
          validationScript: 'test -f /root/mdata/fstab.backup',
        },
        {
          id: 'task-mod1-10',
          title: '10. Create & relocate XML and HTML app files',
          description: 'Create appfiles, move XML files to /tmp, and transfer HTML appfiles from /tmp to /tmp/kdata.',
          validationScript: 'for i in $(seq 1 5); do test -f "/tmp/appfile$i.xml" && test -f "/tmp/kdata/appfile$i.html" || exit 1; done',
        },
        {
          id: 'task-mod1-11',
          title: '11. Relocate fstab.backup to /tmp',
          description: 'Relocate the file "/root/mdata/fstab.backup" to "/tmp".',
          validationScript: 'test -f /tmp/fstab.backup && test ! -f /root/mdata/fstab.backup',
        },
        {
          id: 'task-mod1-12',
          title: '12. Create hidden files .unnati1.xls to .unnati10.xls in /root',
          description: 'Create hidden files named ".unnati1.xls" through ".unnati10.xls" within the "/root" directory.',
          validationScript: 'for i in $(seq 1 10); do test -f "/root/.unnati$i.xls" || exit 1; done',
        },
      ],
    },
    {
      id: 'lab-rhcsa-cla-module2',
      slug: 'rhcsa-cla-module2',
      name: 'RHCSA & CLA Module 2 Gradable Tasks',
      description: 'Unnati Development and Training Center RHCSA+CLA Module 2 practical gradable task suite covering user creation with UIDs/GIDs, group management, GECOS comments, non-interactive shells, secondary group assignments, password aging policies, account locking, and custom home directories.',
      category: 'Linux',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# RHCSA & CLA Module 2 Gradable Tasks
*Unnati Development and Training Center Pvt Ltd*

Welcome to your Linux RHCSA & CLA Module 2 practical lab environment. Execute the commands in the terminal window to fulfill all 14 gradable user and group administration task requirements.
      `,
      tasks: [
        {
          id: 'task-mod2-1',
          title: '1. Create user "vinay" with UID 4353',
          description: 'Create a user named "vinay" with the UID set to 4353.',
          validationScript: 'grep -q "^vinay:[^:]*:4353:" /etc/passwd || [ "$(id -u vinay 2>/dev/null | tr -d "\\r\\n")" = "4353" ]',
        },
        {
          id: 'task-mod2-2',
          title: '2. Create user "kiran" with GID 2083',
          description: 'Create a user named "kiran" with primary GID set to 2083.',
          validationScript: 'grep -q "^kiran:[^:]*:[^:]*:2083:" /etc/passwd || [ "$(id -g kiran 2>/dev/null | tr -d "\\r\\n")" = "2083" ]',
        },
        {
          id: 'task-mod2-3',
          title: '3. Set GECOS name of "vinay" as "developer2"',
          description: 'Set the GECOS name of the user "vinay" as "developer2".',
          validationScript: 'grep -q "^vinay:[^:]*:[^:]*:[^:]*:developer2" /etc/passwd || getent passwd vinay 2>/dev/null | grep -q "developer2"',
        },
        {
          id: 'task-mod2-4',
          title: '4. Create group "admin_java"',
          description: 'Create a group named "admin_java".',
          validationScript: 'grep -q "^admin_java:" /etc/group || getent group admin_java >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-5',
          title: '5. Create group "ht_java" with GID 2076',
          description: 'Create a group named "ht_java" with the ID set to 2076.',
          validationScript: 'grep -q "^ht_java:[^:]*:2076:" /etc/group || getent group ht_java 2>/dev/null | grep -q ":2076:"',
        },
        {
          id: 'task-mod2-6',
          title: '6. Create group "myadmin"',
          description: 'Create a group named "myadmin".',
          validationScript: 'grep -q "^myadmin:" /etc/group || getent group myadmin >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-7',
          title: '7. Create group "super_admin"',
          description: 'Create a group named "super_admin".',
          validationScript: 'grep -q "^super_admin:" /etc/group || getent group super_admin >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-8',
          title: '8. Create user "shrikant" with secondary groups "admin_java" and "myadmin"',
          description: 'Create a user named "shrikant" and add "shrikant" user to "admin_java" and "myadmin" secondary groups.',
          validationScript: 'id -Gn shrikant 2>/dev/null | grep -q "admin_java" && id -Gn shrikant 2>/dev/null | grep -q "myadmin"',
        },
        {
          id: 'task-mod2-9',
          title: '9. Create user "mahesh" with secondary groups "ht_java" and "super_admin"',
          description: 'Create a user named "mahesh" and add "mahesh" user to "ht_java" and "super_admin" secondary groups.',
          validationScript: 'id -Gn mahesh 2>/dev/null | grep -q "ht_java" && id -Gn mahesh 2>/dev/null | grep -q "super_admin"',
        },
        {
          id: 'task-mod2-10',
          title: '10. Create user "varsha" with UID 1089, GID 2076, and /sbin/nologin shell',
          description: 'Create user "varsha" with UID 1089, primary group GID 2076 (ht_java), and shell "/sbin/nologin".',
          validationScript: 'grep -q "^varsha:[^:]*:1089:2076:" /etc/passwd && getent passwd varsha 2>/dev/null | grep -q "nologin"',
        },
        {
          id: 'task-mod2-11',
          title: '11. Configure password max age to 90 days for user "vinay"',
          description: 'Set the maximum password age policy to 90 days for user "vinay".',
          validationScript: 'getent shadow vinay 2>/dev/null | cut -d: -f5 | grep -q "^90$" || chage -l vinay 2>/dev/null | grep -q "90"',
        },
        {
          id: 'task-mod2-12',
          title: '12. Lock user account "kiran"',
          description: 'Lock the user account for "kiran" to disable login access.',
          validationScript: 'getent shadow kiran 2>/dev/null | cut -d: -f2 | grep -q "!" || passwd -S kiran 2>/dev/null | grep -qE "L|locked"',
        },
        {
          id: 'task-mod2-13',
          title: '13. Set account expiration date for user "mahesh"',
          description: 'Set the account expiration date for user "mahesh" to 2026-12-31.',
          validationScript: 'chage -l mahesh 2>/dev/null | grep -i "expires" | grep -v "never" || getent shadow mahesh 2>/dev/null | cut -d: -f8 | grep -q "[0-9]"',
        },
        {
          id: 'task-mod2-14',
          title: '14. Create user "devops_admin" with custom home directory /home/devops_home',
          description: 'Create user "devops_admin" with home directory set to "/home/devops_home".',
          validationScript: 'grep -q "devops_admin.*:/home/devops_home:" /etc/passwd || getent passwd devops_admin 2>/dev/null | grep -q "/home/devops_home"',
        },
        ],
    },
    {
      id: 'lab-containerd-playground',
      slug: 'containerd-playground',
      name: 'Containerd & ctr Image Lifecycle Playground',
      description: 'Hands-on Containerd runtime playground. Master the industry-standard CNCF container runtime using ctr: image distribution, namespaces, container tasks, and runtime lifecycle debugging.',
      category: 'Containerd',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:dind',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '2Gi',
      storage: '2Gi',
      startupCommand: '/bin/sh',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Containerd & ctr Lifecycle Playground

Welcome to your isolated **Containerd** container environment running on the Kubernetes cluster.

---

## What is Containerd?
**Containerd** is an industry-standard, core container runtime developed as a CNCF graduated project. It powers modern Docker and manages the complete container lifecycle of Kubernetes worker nodes (via CRI).

### Core Concepts:
- **Daemon**: \`containerd\` daemon running as a background service listening on \`/run/containerd/containerd.sock\`.
- **Namespaces**: Containerd isolates images and containers within distinct namespaces (e.g. \`default\`, \`k8s.io\`, \`moby\`).
- **Containers vs Tasks**: In Containerd, a *Container* holds the metadata, configuration, and image spec. A *Task* represents the actual running process executing on the host.

---

## Guided Exercises

### Step 1: Verify Containerd Runtime & Version
Inspect the active Containerd daemon and CLI client:

\`\`\`bash
ctr version
ctr check
\`\`\`

### Step 2: Manage Containerd Namespaces
Containerd uses namespaces to prevent naming collisions between subsystems:

\`\`\`bash
# List all active namespaces
ctr namespaces list
# (or shorthand: ctr ns ls)

# Create a custom namespace for your project
ctr namespaces create devops
ctr ns ls
\`\`\`

### Step 3: Pull & Inspect OCI Images
Pull an official image from Docker Hub into Containerd:
*(Note: ctr requires fully-qualified registry references, e.g. docker.io/library/<image>:<tag>)*

\`\`\`bash
# Pull Alpine Linux into default namespace
ctr images pull docker.io/library/alpine:latest

# List pulled images
ctr images list
# (or shorthand: ctr i ls)
\`\`\`

### Step 4: Run Containers & Manage Tasks
Launch and monitor a container task:

\`\`\`bash
# 1. Run an interactive one-off command
ctr run --rm -t docker.io/library/alpine:latest test-box uname -a

# 2. Run a detached background task
ctr run -d docker.io/library/alpine:latest alpine-worker sleep 3600

# 3. List active containers and running tasks
ctr containers list
ctr tasks list
\`\`\`

### Step 5: Stop & Remove Tasks and Containers
Stop the process and clean up the container:

\`\`\`bash
# Stop/kill running task
ctr tasks kill -s SIGKILL alpine-worker

# Delete task and container definition
ctr tasks rm alpine-worker
ctr containers rm alpine-worker
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-containerd-1',
          title: '1. Verify Containerd Runtime (ctr version)',
          description: 'Run `ctr version` in your terminal to verify client and daemon connectivity.',
          validationScript: 'ctr version',
        },
        {
          id: 'task-containerd-2',
          title: '2. Create a Containerd Namespace ("devops")',
          description: 'Create a new Containerd namespace named `devops` using `ctr namespaces create devops` (or `ctr ns create devops`).',
          validationScript: 'ctr namespaces list | grep -q "devops" || ctr ns ls | grep -q "devops"',
        },
        {
          id: 'task-containerd-3',
          title: '3. Pull Alpine Image with ctr',
          description: 'Pull the official Alpine image using `ctr images pull docker.io/library/alpine:latest`.',
          validationScript: 'ctr images list | grep -q "alpine" || ctr -n devops images list | grep -q "alpine"',
        },
        {
          id: 'task-containerd-4',
          title: '4. Run an Alpine Container Task (alpine-worker)',
          description: 'Launch a container task named `alpine-worker` using `ctr run -d docker.io/library/alpine:latest alpine-worker sleep 3600`.',
          validationScript: 'ctr containers list | grep -q "alpine-worker" || ctr tasks list | grep -q "alpine-worker" || ctr -n devops containers list | grep -q "alpine-worker"',
        },
      ],
    },
    {
      id: 'lab-buildah-playground',
      slug: 'buildah-playground',
      name: 'Buildah OCI Image Builder Playground',
      description: 'Daemonless container image creation with Buildah. Build OCI images step-by-step from base images or scratch, manipulate container root filesystems directly, and compile Dockerfiles without running a Docker daemon.',
      category: 'Buildah',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'quay.io/buildah/stable',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '2Gi',
      storage: '2Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Buildah OCI Image Builder Playground

Welcome to your isolated **Buildah Playground**! Practice daemonless, secure OCI container builds without needing a running Docker daemon.

---

## What is Buildah?
**Buildah** is a command-line tool developed by Red Hat and the open-source containers community. Unlike Docker:
- **No background daemon** (\`dockerd\`) is required.
- Builds can be performed inside unprivileged containers or rootless CI/CD pipelines.
- Supports **interactive builds**: construct container images command-by-command directly from the shell or scripting.
- Allows direct host filesystem mounts of container root filesystems (\`buildah mount\`).
- Fully compatible with Dockerfiles via \`buildah bud\` (Build Using Dockerfile).

---

## Guided Exercises

### Step 1: Inspect Buildah Engine & Configuration
Verify your Buildah version and check storage configuration:

\`\`\`bash
buildah --version
buildah info
\`\`\`

### Step 2: Interactive Container Construction
Buildah lets you start a container from a base image and build up layers interactively:

\`\`\`bash
# 1. Create a working container from Alpine
container=$(buildah from alpine)
echo "Working container created: $container"

# 2. Run commands inside the build container
buildah run $container sh -c 'echo "Created with Buildah on BYOLabs" > /etc/byolabs.txt'
buildah run $container cat /etc/byolabs.txt

# 3. Configure container metadata, entrypoint, or environment variables
buildah config --author "DevOps Engineer" $container
buildah config --env APP_ENV=production $container
buildah config --entrypoint '["cat", "/etc/byolabs.txt"]' $container

# 4. Commit the container to a new OCI image
buildah commit $container my-custom-image:v1

# 5. Clean up the working container
buildah rm $container
\`\`\`

### Step 3: Declarative Image Builds with Dockerfile (buildah bud)
You can also build images using standard Dockerfiles using \`buildah bud\`:

\`\`\`bash
# Create a sample Dockerfile
mkdir -p ~/myapp && cd ~/myapp
cat << 'EOF' > Dockerfile
FROM alpine:latest
RUN echo "Hello from Buildah Dockerfile" > /hello.txt
CMD ["cat", "/hello.txt"]
EOF

# Build image tagged webapp:latest
buildah bud -t webapp:latest .

# Verify the newly built image
buildah images
\`\`\`

### Step 4: Direct Filesystem Mounts (buildah mount)
One of Buildah's most powerful features is modifying container filesystems directly on the host without starting a container process:

\`\`\`bash
new_box=$(buildah from alpine)
mountpoint=$(buildah mount $new_box)
echo "Mounted at: $mountpoint"

# Write directly to container filesystem via host path
echo "Direct disk injection" > "$mountpoint/direct.txt"
cat "$mountpoint/direct.txt"

# Unmount when done
buildah unmount $new_box
buildah rm $new_box
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-buildah-1',
          title: '1. Verify Buildah Engine (buildah --version)',
          description: 'Run `buildah --version` or `buildah info` in the terminal to inspect the Buildah runtime.',
          validationScript: 'buildah --version || buildah info',
        },
        {
          id: 'task-buildah-2',
          title: '2. Create a Working Container from Alpine',
          description: 'Create a new working container using `buildah from alpine`.',
          validationScript: 'buildah containers | grep -i "alpine" || [ $(buildah containers -q | wc -l) -gt 0 ]',
        },
        {
          id: 'task-buildah-3',
          title: '3. Commit Custom Image (my-custom-image:v1)',
          description: 'Commit your working container into a new image named `my-custom-image:v1` using `buildah commit <container> my-custom-image:v1`.',
          validationScript: 'buildah images | grep -q "my-custom-image"',
        },
        {
          id: 'task-buildah-4',
          title: '4. Build Image using Dockerfile (buildah bud -t webapp:latest .)',
          description: 'Create a Dockerfile and compile it into an image tagged `webapp:latest` using `buildah bud -t webapp:latest .`.',
          validationScript: 'buildah images | grep -q "webapp"',
        },
      ],
    },
    {
      id: 'lab-terraform-fundamentals',
      slug: 'terraform-fundamentals',
      name: "Terraform Infrastructure as Code (IaC) Fundamentals",
      description: "Master declarative Infrastructure as Code using HashiCorp Terraform. Practice HCL syntax, provider declarations, resource dependencies, local state management, execution plans, and input/output variables.",
      category: 'Terraform',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'hashicorp/terraform:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/sh',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: "\n# Terraform Infrastructure as Code (IaC) Fundamentals\n\nWelcome to your dedicated **HashiCorp Terraform** sandbox environment running in an isolated container.\n\n---\n\n## 🛠️ What is Terraform?\n**Terraform** is the industry standard for declarative **Infrastructure as Code (IaC)**. With Terraform, you describe your desired infrastructure topology in human-readable HashiCorp Configuration Language (HCL). Terraform then generates an execution plan and provisions the infrastructure safely and deterministically.\n\n### The Core Terraform Workflow:\n1. **Write**: Define resources and providers in `.tf` configuration files.\n2. **Init** (`terraform init`): Initialize the working directory and install required provider plugins.\n3. **Plan** (`terraform plan`): Preview changes that Terraform will make against the active state.\n4. **Apply** (`terraform apply`): Provision or mutate the declared resources.\n5. **Destroy** (`terraform destroy`): Tear down managed infrastructure.\n\n---\n\n## 🚀 Guided Exercises\n\n### Step 1: Verify the Terraform CLI\nCheck your installed Terraform version in the interactive terminal:\n\n```sh\nterraform version\nterraform -help\n```\n\n### Step 2: Create a Working Directory & Provider Spec\nCreate a dedicated workspace directory `/root/terraform-lab` and declare a `local` provider in `main.tf`:\n\n```sh\nmkdir -p /root/terraform-lab && cd /root/terraform-lab\n\ncat << 'EOF' > main.tf\nterraform {\n  required_providers {\n    local = {\n      source  = \"hashicorp/local\"\n      version = \"~> 2.5.0\"\n    }\n  }\n}\n\nprovider \"local\" {}\n\nresource \"local_file\" \"config\" {\n  content  = \"environment = production\\napp_name = byolabs-api\\nmanaged_by = terraform\\n\"\n  filename = \"${path.module}/app-config.conf\"\n  file_permission = \"0644\"\n}\n\nresource \"local_file\" \"inventory\" {\n  content  = \"[webservers]\\n10.0.1.10\\n10.0.1.11\\n\"\n  filename = \"${path.module}/hosts.ini\"\n}\nEOF\n```\n\n### Step 3: Initialize the Project (`terraform init`)\nDownload and initialize the local provider plugin:\n\n```sh\nterraform init\nls -la .terraform\n```\n\n### Step 4: Plan & Apply Infrastructure (`terraform apply`)\nGenerate the execution plan and apply the declared configuration:\n\n```sh\nterraform plan\nterraform apply -auto-approve\n\n# Inspect the generated configuration files\nls -la\ncat app-config.conf\ncat hosts.ini\n```\n\n### Step 5: Declare Outputs and Variables\nAdd input variables and output expressions:\n\n```sh\ncat << 'EOF' > outputs.tf\noutput \"config_file_path\" {\n  description = \"Path to generated config file\"\n  value       = local_file.config.filename\n}\n\noutput \"config_file_id\" {\n  description = \"SHA1 ID of the config file\"\n  value       = local_file.config.id\n}\nEOF\n\nterraform apply -auto-approve\nterraform output\n```\n\n### Step 6: Inspect Active State\nVerify state management commands:\n\n```sh\nterraform show\nterraform state list\n```\n\n---\n\n## 📋 Tasks Checklist\n",
      tasks: [
              {
                      "id": "task-tf-1",
                      "title": "1. Verify Terraform CLI (terraform version)",
                      "description": "Execute `terraform version` in the terminal to inspect the active Terraform installation.",
                      "validationScript": "terraform version"
              },
              {
                      "id": "task-tf-2",
                      "title": "2. Initialize Project in /root/terraform-lab",
                      "description": "Create `/root/terraform-lab`, add `main.tf` with the `local` provider, and execute `terraform init`.",
                      "validationScript": "test -d /root/terraform-lab/.terraform || test -d ~/terraform-lab/.terraform || test -d .terraform"
              },
              {
                      "id": "task-tf-3",
                      "title": "3. Provision Resources with terraform apply",
                      "description": "Apply your configuration with `terraform apply -auto-approve` to generate `app-config.conf` and the state file.",
                      "validationScript": "test -f /root/terraform-lab/app-config.conf || test -f ~/terraform-lab/app-config.conf || test -f app-config.conf"
              },
              {
                      "id": "task-tf-4",
                      "title": "4. Configure Outputs & Verify State",
                      "description": "Define outputs in `outputs.tf` and verify that `terraform state list` tracks managed resources.",
                      "validationScript": "(cd /root/terraform-lab 2>/dev/null || cd ~/terraform-lab 2>/dev/null || true) && terraform state list | grep -q \"local_file\""
              }
      ]
    },
    {
      id: 'lab-ansible-automation',
      slug: 'ansible-automation',
      name: "Ansible Automation & Playbook Fundamentals",
      description: "Master agentless IT automation with Ansible. Practice creating inventory hosts, executing ad-hoc commands, authoring YAML playbooks, managing file resources, and ensuring idempotent execution.",
      category: 'Ansible',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'cytopia/ansible:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/sh',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: "\n# Ansible Automation & Playbook Fundamentals\n\nWelcome to your dedicated **Ansible Control Node** environment running in an isolated container.\n\n---\n\n## 🛠️ What is Ansible?\n**Ansible** is an open-source, agentless IT automation engine. It automates cloud provisioning, configuration management, application deployment, and intraservice orchestration using simple, human-readable YAML playbooks.\n\n### Core Architecture Concepts:\n- **Control Node**: The machine where Ansible is installed and from which automation is run.\n- **Inventory**: A list of managed nodes (hosts) organized into groups (INI or YAML format).\n- **Modules**: Discrete units of code executed by Ansible (e.g. `ping`, `command`, `copy`, `file`).\n- **Playbooks**: YAML specifications declaring the desired end-state across managed hosts.\n- **Idempotency**: Running a playbook multiple times produces the same result without unintended changes.\n\n---\n\n## 🚀 Guided Exercises\n\n### Step 1: Verify Ansible Control Node\nCheck your installed Ansible engine and Python environment:\n\n```sh\nansible --version\nansible-config dump --only-changed\n```\n\n### Step 2: Set Up Workspace & Local Inventory\nCreate your project folder `/root/ansible-lab` and declare a local target in `inventory.ini`:\n\n```sh\nmkdir -p /root/ansible-lab && cd /root/ansible-lab\n\ncat << 'EOF' > inventory.ini\n[local]\nlocalhost ansible_connection=local ansible_python_interpreter=/usr/bin/python3\n\n[webservers]\nweb-01 ansible_connection=local\nEOF\n```\n\n### Step 3: Run Ad-Hoc Commands\nExecute immediate ad-hoc modules without writing a playbook:\n\n```sh\n# Test connectivity using the ping module\nansible localhost -i inventory.ini -m ping\n\n# Run a shell command via command module\nansible localhost -i inventory.ini -m command -a \"df -h\"\n\n# Collect system facts\nansible localhost -i inventory.ini -m setup -a \"filter=ansible_distribution*\"\n```\n\n### Step 4: Author a Multi-Task Playbook\nCreate a complete automation playbook `site.yml`:\n\n```sh\ncat << 'EOF' > site.yml\n---\n- name: Enterprise System Setup Playbook\n  hosts: localhost\n  connection: local\n  gather_facts: false\n  vars:\n    app_name: \"byolabs-worker\"\n    target_dir: \"/tmp/byolabs\"\n\n  tasks:\n    - name: Ensure target directory exists\n      ansible.builtin.file:\n        path: \"{{ target_dir }}\"\n        state: directory\n        mode: '0755'\n\n    - name: Deploy application release metadata\n      ansible.builtin.copy:\n        dest: \"{{ target_dir }}/release.json\"\n        content: |\n          {\n            \"app\": \"{{ app_name }}\",\n            \"version\": \"1.0.0\",\n            \"status\": \"ready\"\n          }\n        mode: '0644'\n\n    - name: Generate verification stamp\n      ansible.builtin.copy:\n        dest: \"/tmp/ansible-verified.txt\"\n        content: \"Ansible Playbook completed successfully on BYOLabs!\\n\"\n        mode: '0644'\nEOF\n```\n\n### Step 5: Syntax Check & Run the Playbook\nVerify YAML syntax and execute the playbook:\n\n```sh\nansible-playbook -i inventory.ini site.yml --syntax-check\nansible-playbook -i inventory.ini site.yml\n\n# Inspect the generated artifacts\ncat /tmp/byolabs/release.json\ncat /tmp/ansible-verified.txt\n```\n\n### Step 6: Test Playbook Idempotency\nRun the playbook a second time. Notice that tasks report `ok` instead of `changed`:\n\n```sh\nansible-playbook -i inventory.ini site.yml\n```\n\n---\n\n## 📋 Tasks Checklist\n",
      tasks: [
              {
                      "id": "task-ansible-1",
                      "title": "1. Verify Ansible Installation (ansible --version)",
                      "description": "Execute `ansible --version` in the terminal to inspect the active Ansible installation.",
                      "validationScript": "ansible --version"
              },
              {
                      "id": "task-ansible-2",
                      "title": "2. Configure Inventory with Local Target",
                      "description": "Create `/root/ansible-lab/inventory.ini` containing `localhost` configured with `ansible_connection=local`.",
                      "validationScript": "grep -q \"ansible_connection=local\" /root/ansible-lab/inventory.ini || grep -q \"ansible_connection=local\" ~/ansible-lab/inventory.ini || grep -q \"ansible_connection=local\" inventory.ini"
              },
              {
                      "id": "task-ansible-3",
                      "title": "3. Execute Successful Ad-hoc Ping",
                      "description": "Execute `ansible localhost -i inventory.ini -m ping` to test local module execution.",
                      "validationScript": "ansible localhost -i /root/ansible-lab/inventory.ini -m ping 2>/dev/null | grep -q \"SUCCESS\" || ansible localhost -i ~/ansible-lab/inventory.ini -m ping 2>/dev/null | grep -q \"SUCCESS\" || ansible localhost -m ping 2>/dev/null | grep -q \"SUCCESS\""
              },
              {
                      "id": "task-ansible-4",
                      "title": "4. Execute Playbook and Generate Artifacts",
                      "description": "Run `site.yml` using `ansible-playbook` to generate `/tmp/ansible-verified.txt` and `/tmp/byolabs/release.json`.",
                      "validationScript": "test -f /tmp/ansible-verified.txt && test -f /tmp/byolabs/release.json"
              }
      ]
    },
    {
      id: 'lab-opensuse-playground',
      slug: 'opensuse-playground',
      name: "openSUSE Leap Administration & Zypper Playground",
      description: "Hands-on openSUSE Leap enterprise sandbox. Master the Zypper package manager (zypper refresh, install, search), RPM repository administration, user management, and openSUSE system administration.",
      category: 'Linux',
      difficulty: 'Beginner',
      durationMinutes: 60,
      dockerImage: 'opensuse/leap:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: "\n# openSUSE Leap Administration & Zypper Playground\n\nWelcome to your isolated **openSUSE Leap** container environment running as a Kubernetes pod.\n\n---\n\n## 🦎 What is openSUSE Leap?\n**openSUSE Leap** is a community Linux distribution that shares its core codebase with **SUSE Linux Enterprise (SLE)**. It is known for its rock-solid stability, enterprise-grade package management, and system administration tooling.\n\n### The Zypper Package Manager:\n`zypper` is the powerful command-line interface for the `libzypp` package management library. Common commands include:\n- `zypper lr`: List configured repositories.\n- `zypper ref`: Refresh metadata from remote repositories.\n- `zypper in <pkg>`: Install a package.\n- `zypper rm <pkg>`: Remove a package.\n- `zypper se <pkg>`: Search for available packages.\n- `zypper info <pkg>`: View detailed package metadata.\n\n---\n\n## 🚀 Guided Exercises\n\n### Step 1: Inspect openSUSE System Information\nVerify your OS release and kernel details in the interactive terminal:\n\n```bash\ncat /etc/os-release\ncat /etc/SUSE-brand\nuname -a\n```\n\n### Step 2: Query Zypper Repositories\nInspect the active openSUSE repositories:\n\n```bash\n# List repositories with detailed URLs and aliases\nzypper lr -d\n\n# Refresh repository metadata caches\nzypper refresh\n```\n\n### Step 3: Search and Query Packages\nSearch the repositories for system tools:\n\n```bash\nzypper search --details curl\nzypper info vim\n```\n\n### Step 4: Install System Utilities with Zypper\nInstall packages non-interactively:\n\n```bash\nzypper --non-interactive install -y tree vim\n\n# Verify installed binaries\nwhich tree\ntree --version\n```\n\n### Step 5: System Administration & User Provisioning\nCreate a new administrative user following openSUSE defaults:\n\n```bash\nuseradd -m -s /bin/bash -c \"SUSE Systems Admin\" suseadmin\nid suseadmin\nls -la /home/suseadmin\n```\n\n### Step 6: Query RPM Database Directly\nInspect installed packages using the low-level RPM command:\n\n```bash\nrpm -qa | grep -i opensuse\nrpm -qil tree\n```\n\n---\n\n## 📋 Tasks Checklist\n",
      tasks: [
              {
                      "id": "task-suse-1",
                      "title": "1. Inspect openSUSE OS Release",
                      "description": "Execute `cat /etc/os-release` in the terminal to inspect the openSUSE distribution.",
                      "validationScript": "grep -i \"opensuse\" /etc/os-release"
              },
              {
                      "id": "task-suse-2",
                      "title": "2. Query Active Zypper Repositories",
                      "description": "Run `zypper lr` in the terminal to inspect active package repositories.",
                      "validationScript": "zypper lr 2>/dev/null | grep -qE \"repo|Alias|Name|#\""
              },
              {
                      "id": "task-suse-3",
                      "title": "3. Install \"tree\" via Zypper",
                      "description": "Install the `tree` utility using `zypper --non-interactive install -y tree`.",
                      "validationScript": "command -v tree >/dev/null 2>&1 || rpm -q tree >/dev/null 2>&1"
              },
              {
                      "id": "task-suse-4",
                      "title": "4. Create Administrative User \"suseadmin\"",
                      "description": "Create user `suseadmin` with a home directory and bash shell using `useradd -m -s /bin/bash suseadmin`.",
                      "validationScript": "id suseadmin >/dev/null 2>&1 && test -d /home/suseadmin"
              }
      ]
    },
    {
      id: 'lab-git-advanced-workflows',
      slug: 'git-advanced-workflows',
      name: "Git Branching, Merge Conflicts & Interactive Rebase",
      description: "Master real-world Git version control workflows. Practice feature branching, simulating and resolving three-way merge conflicts, rebasing feature commits onto main, and inspecting DAG commit history.",
      category: 'Git',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '250m',
      cpuLimit: '1',
      memoryRequest: '256Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: "\n# Git Branching, Merge Conflicts & Interactive Rebase\n\nWelcome to your dedicated **Git Advanced Workflows** container environment.\n\n---\n\n## 🛠️ What You Will Master\nIn enterprise DevOps and software engineering, engineers collaborate across multiple feature branches. Merges don't always apply cleanly, and linear Git histories require mastering rebasing. This lab guides you through:\n1. Branch creation and HEAD pointers.\n2. Generating divergent commits across parallel branches.\n3. Understanding Git merge conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`).\n4. Manually resolving conflicts and recording clean merge commits.\n5. Rebasing feature branches onto `main` for a clean, linear commit graph.\n\n---\n\n## 🚀 Guided Exercises\n\n### Step 1: Configure Git Identity & Initialize Workspace\nSet up global identity and create the workspace directory `/root/git-advanced`:\n\n```bash\ngit config --global user.name \"DevOps Engineer\"\ngit config --global user.email \"engineer@byolabs.in\"\ngit config --global init.defaultBranch main\n\nmkdir -p /root/git-advanced && cd /root/git-advanced\ngit init\n```\n\n### Step 2: Create Main Branch with Initial Codebase\nCreate `app.py` and commit it to the `main` branch:\n\n```bash\ncat << 'EOF' > app.py\n# BYOLabs Web Application Core\nVERSION = \"1.0.0\"\n\ndef get_status():\n    return {\"status\": \"ok\", \"service\": \"api-gateway\"}\n\ndef handle_request():\n    print(\"Processing request standard pipeline\")\nEOF\n\ngit add app.py\ngit commit -m \"feat: initial commit with api-gateway core\"\ngit branch -M main\n```\n\n### Step 3: Create Feature Branch \"feature/auth\"\nBranch off `main` and make modifications to `app.py`:\n\n```bash\ngit checkout -b feature/auth\n\ncat << 'EOF' > app.py\n# BYOLabs Web Application Core\nVERSION = \"1.1.0-auth\"\n\ndef get_status():\n    return {\"status\": \"ok\", \"service\": \"api-gateway\", \"auth\": \"jwt\"}\n\ndef handle_request():\n    print(\"Processing request with OAuth2 JWT validator\")\nEOF\n\ngit commit -am \"feat(auth): integrate JWT token validation pipeline\"\n```\n\n### Step 4: Create Divergent Commit on Main Branch\nSwitch back to `main` and make a conflicting edit to `app.py`:\n\n```bash\ngit checkout main\n\ncat << 'EOF' > app.py\n# BYOLabs Web Application Core\nVERSION = \"1.1.0-metrics\"\n\ndef get_status():\n    return {\"status\": \"ok\", \"service\": \"api-gateway\", \"telemetry\": \"prometheus\"}\n\ndef handle_request():\n    print(\"Processing request with OpenTelemetry metrics\")\nEOF\n\ngit commit -am \"feat(telemetry): add Prometheus metrics collector\"\n```\n\n### Step 5: Merge and Resolve Conflict\nTrigger a merge conflict and resolve it cleanly:\n\n```bash\n# Trigger the merge conflict\ngit merge feature/auth || true\n\n# Inspect the conflict markers\ncat app.py\n\n# Resolve the conflict by combining both features\ncat << 'EOF' > app.py\n# BYOLabs Web Application Core\nVERSION = \"1.1.0\"\n\ndef get_status():\n    return {\"status\": \"ok\", \"service\": \"api-gateway\", \"auth\": \"jwt\", \"telemetry\": \"prometheus\"}\n\ndef handle_request():\n    print(\"Processing request with OAuth2 JWT validator and OpenTelemetry metrics\")\nEOF\n\ngit add app.py\ngit commit -m \"merge: resolve conflict combining auth and telemetry\"\n```\n\n### Step 6: Rebase a Feature Branch onto Main\nCreate a second feature branch and rebase it linearly onto updated `main`:\n\n```bash\ngit checkout -b feature/cache\necho '# Redis cache client' > cache.py\ngit add cache.py\ngit commit -m \"feat(cache): add redis caching interface\"\n\n# Rebase cleanly onto main\ngit rebase main\n\n# Inspect the commit DAG graph\ngit log --graph --oneline --decorate --all\n```\n\n---\n\n## 📋 Tasks Checklist\n",
      tasks: [
              {
                      "id": "task-gitadv-1",
                      "title": "1. Initialize /root/git-advanced & Configure Identity",
                      "description": "Initialize git in `/root/git-advanced` and configure `user.name` and `user.email`.",
                      "validationScript": "test -d /root/git-advanced/.git && git -C /root/git-advanced config user.name >/dev/null"
              },
              {
                      "id": "task-gitadv-2",
                      "title": "2. Create Base Commit on \"main\" Branch",
                      "description": "Create `app.py` and commit it to the `main` branch with `git commit`.",
                      "validationScript": "test -f /root/git-advanced/app.py && git -C /root/git-advanced rev-parse --verify main >/dev/null 2>&1"
              },
              {
                      "id": "task-gitadv-3",
                      "title": "3. Create \"feature/auth\" Branch with Custom Commit",
                      "description": "Create and checkout branch `feature/auth`, modify `app.py`, and commit changes.",
                      "validationScript": "git -C /root/git-advanced rev-parse --verify feature/auth >/dev/null 2>&1"
              },
              {
                      "id": "task-gitadv-4",
                      "title": "4. Merge \"feature/auth\" into \"main\" & Resolve Conflicts",
                      "description": "Merge `feature/auth` into `main`, resolve conflict markers in `app.py`, and complete the merge commit.",
                      "validationScript": "git -C /root/git-advanced log --merges -n 1 >/dev/null 2>&1 && ! grep -q \"<<<<<<\" /root/git-advanced/app.py"
              },
              {
                      "id": "task-gitadv-5",
                      "title": "5. Create & Rebase \"feature/cache\" onto \"main\"",
                      "description": "Create branch `feature/cache` with `cache.py`, and rebase it onto `main` with `git rebase main`.",
                      "validationScript": "git -C /root/git-advanced rev-parse --verify feature/cache >/dev/null 2>&1 && [ \"$(git -C /root/git-advanced merge-base main feature/cache)\" = \"$(git -C /root/git-advanced rev-parse main)\" ]"
              }
      ]
    }
  ];

  db.seedInitialData(seedLabs, adminUser, adminPasswordHash);
  console.log('[Seeder] Seeding completed successfully!');
}

if (process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch(console.error);
}
