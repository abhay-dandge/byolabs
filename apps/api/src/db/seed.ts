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
      id: 'lab-docker-fundamentals',
      slug: 'docker-fundamentals',
      name: 'Docker Fundamentals & Containers',
      description: 'Learn container mechanics, image inspection, container lifecycle management, port mapping, and volume persistence.',
      category: 'Docker',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:dind',
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '512Mi',
      memoryLimit: '1Gi',
      startupCommand: '',
      terminalEnabled: true,
      browserAccess: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructionsMarkdown: `
# Docker Fundamentals

Explore container primitives and image inspection in an isolated container sandbox.

\`\`\`bash
uname -a
echo "Testing Docker environment..."
\`\`\`
      `,
      tasks: [
        {
          id: 'task-docker-1',
          title: 'Verify Alpine Environment',
          description: 'Verify your container environment with `cat /etc/os-release` or docker daemon.',
          validationScript: 'test -f /etc/alpine-release || test -f /etc/os-release',
        },
      ],
    },
    {
      id: 'lab-docker-dind',
      slug: 'docker-dind-lab',
      name: 'Docker-in-Docker (DinD) & Image Management',
      description: 'Interactive container lab running official Docker-in-Docker (docker:dind) image to pull Docker images, manage container layers, and run sub-containers.',
      category: 'Docker',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      dockerImage: 'docker:dind',
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
# Docker-in-Docker (DinD) & Container Operations

Welcome to your **Docker-in-Docker (\`docker:dind\`)** interactive lab environment! In this lab, you will learn how to pull Docker images, manage containers, and work with container registries using the official Docker daemon.

---

## Key Learning Objectives
1. **Pull Images**: Download container images from public registries using \`docker pull\`.
2. **Inspect Images & Layers**: List local images and view image configuration details.
3. **Run Containers**: Launch lightweight sub-containers inside your DinD environment.
4. **Tag & Export**: Assign custom tags to Docker images.

---

## Guided Steps

### Step 1: Pull the Official Docker Image
Pull the official \`docker\` image into your local docker storage:

\`\`\`bash
docker pull docker
\`\`\`

### Step 2: Pull the Lightweight Alpine Linux Image
Download the \`alpine\` image from Docker Hub:

\`\`\`bash
docker pull alpine
\`\`\`

### Step 3: Inspect Local Image Inventory
List all downloaded images in your local daemon and save the inventory output:

\`\`\`bash
docker images > /tmp/images.txt
cat /tmp/images.txt
\`\`\`

### Step 4: Tag a Local Docker Image
Create a custom tag \`my-docker:latest\` for the pulled \`docker\` image:

\`\`\`bash
docker tag docker my-docker:latest
\`\`\`

---

## Tasks Checklist
Execute the steps above in the terminal, then click **Verify Task** on each item to submit for grading.
      `,
      tasks: [
        {
          id: 'task-dind-1',
          title: '1. Pull Official Docker Image (docker pull docker)',
          description: 'Execute `docker pull docker` in the terminal to pull the official Docker image from Docker Hub.',
          validationScript: 'docker image inspect docker >/dev/null 2>&1 || docker images | grep -q "docker" || test -f /tmp/pulled_docker.txt',
        },
        {
          id: 'task-dind-2',
          title: '2. Pull Alpine Linux Image (docker pull alpine)',
          description: 'Execute `docker pull alpine` in the terminal to pull the Alpine Linux image.',
          validationScript: 'docker image inspect alpine >/dev/null 2>&1 || docker images | grep -q "alpine"',
        },
        {
          id: 'task-dind-3',
          title: '3. Save Image Inventory to /tmp/images.txt',
          description: 'Run `docker images > /tmp/images.txt` to export the list of local docker images.',
          validationScript: 'test -s /tmp/images.txt',
        },
        {
          id: 'task-dind-4',
          title: '4. Tag Docker Image as my-docker:latest',
          description: 'Execute `docker tag docker my-docker:latest` to assign a local tag.',
          validationScript: 'docker image inspect my-docker:latest >/dev/null 2>&1 || docker images | grep -q "my-docker"',
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
