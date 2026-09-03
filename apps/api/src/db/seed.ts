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
      name: 'Docker Playground (Sidecar Engine)',
      description: 'Production-grade Multi-Container Docker Playground utilizing docker:27-cli primary container linked via TLS to a privileged docker:27-dind sidecar daemon.',
      category: 'Docker',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:27-cli',
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Docker Playground (Multi-Container Sidecar Engine)

Welcome to your isolated **Docker Playground** powered by a multi-container Kubernetes Pod architecture!

---

## Pod Architecture Breakdown
- **Primary CLI Container**: \`docker:27-cli\` connected with \`DOCKER_HOST=tcp://localhost:2376\`
- **Sidecar Daemon Container**: \`docker:27-dind\` (privileged daemon issuing TLS certs into \`/certs\`)
- **Shared Storage**: \`dind-certs\` shared \`emptyDir\` volume

---

## Guided Instructions

### Step 1: Verify Docker Daemon TLS Connection
Verify connection from \`docker:27-cli\` to the \`dind-daemon\` sidecar:

\`\`\`bash
docker version
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
          description: 'Execute `docker version` in terminal to confirm CLI connection to DinD sidecar daemon.',
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
      id: 'lab-docker-containers',
      slug: 'docker-containers',
      name: 'Docker Container Operations & Image Building',
      description: 'Learn container execution, environment injection, port mapping, container logs, and building custom images using Dockerfile in DinD environment.',
      category: 'Docker',
      difficulty: 'Beginner',
      durationMinutes: 60,
      dockerImage: 'docker:27-cli',
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Docker Container Operations & Image Building

Master essential Docker CLI commands for container lifecycle management and image creation using Dockerfile.

---

## Architecture Context
This lab runs on a **Docker DinD (Docker-in-Docker)** dual-container Pod spec:
- \`docker-cli\` (Container 1): Connects to the local daemon via TLS port 2376
- \`dind-daemon\` (Container 2): Privileged Docker daemon managing container runtimes and storage drivers

---

## Guided Exercises

### Step 1: Run Nginx Webserver Container
Run a detached Nginx container named \`my-webserver\` mapping port 8080 to 80:

\`\`\`bash
docker run -d --name my-webserver -p 8080:80 nginx:alpine
docker ps
\`\`\`

### Step 2: Test Webserver HTTP Endpoint
Verify webserver output using \`curl\`:

\`\`\`bash
curl http://localhost:8080
\`\`\`

### Step 3: Build Custom Docker Image
Create a custom Dockerfile and build an image named \`custom-app:v1\`:

\`\`\`bash
mkdir -p ~/myapp && cd ~/myapp
cat << 'EOF' > Dockerfile
FROM alpine:latest
RUN apk add --no-cache curl
CMD ["echo", "BYOLabs Docker DinD Engine Active!"]
EOF

docker build -t custom-app:v1 .
docker images | grep custom-app
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-container-1',
          title: '1. Launch Nginx Webserver Container',
          description: 'Run container named `my-webserver` using image `nginx:alpine`.',
          validationScript: 'docker ps -a | grep -q "my-webserver"',
        },
        {
          id: 'task-container-2',
          title: '2. Create custom Dockerfile',
          description: 'Create a Dockerfile inside directory `~/myapp`.',
          validationScript: 'test -f ~/myapp/Dockerfile || test -f /root/myapp/Dockerfile',
        },
        {
          id: 'task-container-3',
          title: '3. Build custom-app:v1 image',
          description: 'Build a Docker image tagged `custom-app:v1`.',
          validationScript: 'docker image inspect custom-app:v1 >/dev/null 2>&1',
        },
      ],
    },
    {
      id: 'lab-docker-volumes-networks',
      slug: 'docker-volumes-networks',
      name: 'Docker Storage Volumes & Custom Networks',
      description: 'Configure persistent Docker named volumes, custom bridge networks, and multi-container communication.',
      category: 'Docker',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:27-cli',
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '1Gi',
      storage: '1Gi',
      startupCommand: '',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Docker Storage Volumes & Custom Networks

Learn how to isolate container network traffic and persist container data using named Docker volumes.

---

## Guided Exercises

### Step 1: Create Docker Volume
Create a named persistent volume named \`app-data\`:

\`\`\`bash
docker volume create app-data
docker volume ls
\`\`\`

### Step 2: Create Custom Bridge Network
Create an isolated bridge network named \`backend-net\`:

\`\`\`bash
docker network create backend-net
docker network ls
\`\`\`

### Step 3: Attach Container to Volume and Network
Launch Redis container attached to network \`backend-net\` and volume \`app-data\`:

\`\`\`bash
docker run -d --name redis-db --net backend-net -v app-data:/data redis:alpine
docker ps
\`\`\`

---

## Tasks Checklist
      `,
      tasks: [
        {
          id: 'task-vol-net-1',
          title: '1. Create Named Volume app-data',
          description: 'Execute `docker volume create app-data`.',
          validationScript: 'docker volume inspect app-data >/dev/null 2>&1',
        },
        {
          id: 'task-vol-net-2',
          title: '2. Create Bridge Network backend-net',
          description: 'Execute `docker network create backend-net`.',
          validationScript: 'docker network inspect backend-net >/dev/null 2>&1',
        },
        {
          id: 'task-vol-net-3',
          title: '3. Run Redis container attached to network and volume',
          description: 'Launch a container named `redis-db` using image `redis:alpine` attached to `backend-net` and volume `app-data`.',
          validationScript: 'docker ps -a | grep -q "redis-db"',
        },
      ],
    },
    {
      id: 'lab-kubernetes-basics',
      slug: 'kubernetes-basics',
      name: 'Kubernetes Pods & Workload Basics',
      description: 'Learn Kubernetes concepts, pod specifications, deployments, namespaces, and YAML manifests.',
      category: 'Kubernetes',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'ubuntu:latest',
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '1Gi',
      startupCommand: '/bin/bash',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Kubernetes Basics & Workloads

Learn how Kubernetes manifests configure Pod specs and deployments.

\`\`\`bash
cat << 'EOF' > pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:alpine
EOF
cat pod.yaml
\`\`\`
      `,
      tasks: [
        {
          id: 'task-k8s-1',
          title: 'Create Pod Manifest',
          description: 'Create a file named `pod.yaml` containing a valid Kubernetes Pod specification.',
          validationScript: 'grep -i "kind: Pod" pod.yaml || grep -i "kind: Pod" ~/pod.yaml',
        },
      ],
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

---

## Guided Instructions & Reference Commands

### Task 1: Store Location in File
Create \`/root/myfile.doc\` and store the location of the \`/root\` directory within it.
\`\`\`bash
echo "/root" > /root/myfile.doc
\`\`\`

### Task 2: Simultaneous File Creation
Generate three files \`file1\`, \`file2\`, and \`file3\` simultaneously in the \`/root\` directory.
\`\`\`bash
touch /root/file1 /root/file2 /root/file3
\`\`\`

### Task 3: Store Current Date
Store current date in a file named \`/date.txt\`.
\`\`\`bash
date > /date.txt
\`\`\`

### Task 4: Retrieve \`/bin\` Directory Listing
Retrieve a list of files and directories from the \`/bin\` folder and save it in \`/list.txt\`.
\`\`\`bash
ls /bin > /list.txt
\`\`\`

### Task 5: Record User and Working Directory
Record the username and the current working directory in \`/root/mydata/userfile.txt\`.
\`\`\`bash
mkdir -p /root/mydata
echo "$(whoami) $(pwd)" > /root/mydata/userfile.txt
\`\`\`

### Task 6: Establish Collaborative Directory
Establish a collaborative directory at \`/root/unnati/cidco/aurangabad\`.
\`\`\`bash
mkdir -p /root/unnati/cidco/aurangabad
\`\`\`

### Task 7: Generate Multiple Folders
Generate ten folders named \`linuxdata1\` to \`linuxdata10\` within \`/root\`.
\`\`\`bash
mkdir -p /root/linuxdata{1..10}
\`\`\`

### Task 8: Generate Nested Directory Path & PHP Files
Create directory path \`/root/data/gdata/reddata\` and generate ten files with \`.php\` extension named \`unnati1.php\` through \`unnati10.php\`.
\`\`\`bash
mkdir -p /root/data/gdata/reddata
touch /root/data/gdata/reddata/unnati{1..10}.php
\`\`\`

### Task 9: Duplicate System Backup File
Duplicate the file \`/etc/fstab\` and store the duplicate as \`/root/mdata/fstab.backup\`.
\`\`\`bash
mkdir -p /root/mdata
cp /etc/fstab /root/mdata/fstab.backup
\`\`\`

### Task 10: Multi-Step App File Creation & Relocation
1. Create five files \`appfile1.xml\` through \`appfile5.xml\` in \`/mnt/appdata/\`.
2. Generate five files \`appfile1.html\` through \`appfile5.html\` in \`/tmp\`.
3. Move all \`.xml\` files from \`/mnt/appdata/\` to \`/tmp\`.
4. Transfer \`appfile1.html\` through \`appfile5.html\` from \`/tmp\` to \`/tmp/kdata\`.
\`\`\`bash
mkdir -p /mnt/appdata /tmp/kdata
touch /mnt/appdata/appfile{1..5}.xml
touch /tmp/appfile{1..5}.html
mv /mnt/appdata/*.xml /tmp/
mv /tmp/appfile{1..5}.html /tmp/kdata/
\`\`\`

### Task 11: Relocate Backup File
Relocate the file \`/root/mdata/fstab.backup\` to \`/tmp\`.
\`\`\`bash
mv /root/mdata/fstab.backup /tmp/
\`\`\`

### Task 12: Hidden Files Creation
Create hidden files named \`.unnati1.xls\` through \`.unnati10.xls\` within \`/root\`.
\`\`\`bash
touch /root/.unnati{1..10}.xls
\`\`\`
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
  ];

  db.seedInitialData(seedLabs, adminUser, adminPasswordHash);
  console.log('[Seeder] Seeding completed successfully!');
}
