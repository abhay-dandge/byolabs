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
      cpuRequest: '500m',
      cpuLimit: '1',
      memoryRequest: '1Gi',
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
  ];

  db.seedInitialData(seedLabs, adminUser, adminPasswordHash);
  console.log('[Seeder] Seeding completed successfully!');
}
