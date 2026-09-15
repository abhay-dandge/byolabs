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
      cpuLimit: '2',
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

---

## Guided Instructions & Reference Commands

### Task 1: Create User "vinay" with UID 4353
Create a user named \`vinay\` with the UID set to \`4353\`.
\`\`\`bash
useradd -u 4353 vinay
\`\`\`

### Task 2: Create User "kiran" with GID 2083
Create a user named \`kiran\` with the GID set to \`2083\`. *(Note: Create group with GID 2083 first)*
\`\`\`bash
groupadd -g 2083 kiran_grp
useradd -g 2083 kiran
\`\`\`

### Task 3: Set GECOS Name for "vinay"
Set the GECOS name of the user \`vinay\` as \`developer2\`.
\`\`\`bash
usermod -c "developer2" vinay
\`\`\`

### Task 4: Create Group "admin_java"
Create a group named \`admin_java\`.
\`\`\`bash
groupadd admin_java
\`\`\`

### Task 5: Create Group "ht_java" with GID 2076
Create a group named \`ht_java\` with the ID set to \`2076\`.
\`\`\`bash
groupadd -g 2076 ht_java
\`\`\`

### Task 6: Create Group "myadmin"
Create a group named \`myadmin\`.
\`\`\`bash
groupadd myadmin
\`\`\`

### Task 7: Create Group "super_admin"
Create a group named \`super_admin\`.
\`\`\`bash
groupadd super_admin
\`\`\`

### Task 8: User "shrikant" with Secondary Groups
Create a user named \`shrikant\` and add \`shrikant\` user to \`admin_java\` and \`myadmin\` secondary groups.
\`\`\`bash
useradd -G admin_java,myadmin shrikant
\`\`\`

### Task 9: User "mahesh" with Secondary Groups
Create a user named \`mahesh\` and add \`mahesh\` user to \`ht_java\` and \`super_admin\` secondary groups.
\`\`\`bash
useradd -G ht_java,super_admin mahesh
\`\`\`

### Task 10: User "varsha" with UID 1089, GID 2076, and Non-login Shell
Create user \`varsha\` with UID \`1089\`, primary group GID \`2076\` (\`ht_java\`), and shell \`/sbin/nologin\`.
\`\`\`bash
useradd -u 1089 -g 2076 -s /sbin/nologin varsha
\`\`\`

### Task 11: Configure Password Max Age Policy for "vinay"
Set the maximum password age policy to \`90\` days for user \`vinay\`.
\`\`\`bash
chage -M 90 vinay
\`\`\`

### Task 12: Lock User Account "kiran"
Lock the user account for \`kiran\` to disable login access.
\`\`\`bash
usermod -L kiran
\`\`\`

### Task 13: Set Account Expiration Date for "mahesh"
Set the account expiration date for user \`mahesh\` to \`2026-12-31\`.
\`\`\`bash
chage -E 2026-12-31 mahesh
\`\`\`

### Task 14: User "devops_admin" with Custom Home Directory
Create user \`devops_admin\` with home directory set to \`/home/devops_home\`.
\`\`\`bash
useradd -m -d /home/devops_home devops_admin
\`\`\`
      `,
      tasks: [
        {
          id: 'task-mod2-1',
          title: '1. Create user "vinay" with UID 4353',
          description: 'Create a user named "vinay" with the UID set to 4353.',
          validationScript: 'id -u vinay 2>/dev/null | grep -q "^4353$"',
        },
        {
          id: 'task-mod2-2',
          title: '2. Create user "kiran" with GID 2083',
          description: 'Create a user named "kiran" with primary GID set to 2083.',
          validationScript: 'id -g kiran 2>/dev/null | grep -q "^2083$"',
        },
        {
          id: 'task-mod2-3',
          title: '3. Set GECOS name of "vinay" as "developer2"',
          description: 'Set the GECOS name of the user "vinay" as "developer2".',
          validationScript: 'getent passwd vinay 2>/dev/null | cut -d: -f5 | grep -q "developer2"',
        },
        {
          id: 'task-mod2-4',
          title: '4. Create group "admin_java"',
          description: 'Create a group named "admin_java".',
          validationScript: 'getent group admin_java >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-5',
          title: '5. Create group "ht_java" with GID 2076',
          description: 'Create a group named "ht_java" with the ID set to 2076.',
          validationScript: 'getent group ht_java 2>/dev/null | cut -d: -f3 | grep -q "^2076$"',
        },
        {
          id: 'task-mod2-6',
          title: '6. Create group "myadmin"',
          description: 'Create a group named "myadmin".',
          validationScript: 'getent group myadmin >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-7',
          title: '7. Create group "super_admin"',
          description: 'Create a group named "super_admin".',
          validationScript: 'getent group super_admin >/dev/null 2>&1',
        },
        {
          id: 'task-mod2-8',
          title: '8. Create user "shrikant" with secondary groups "admin_java" and "myadmin"',
          description: 'Create a user named "shrikant" and add "shrikant" user to "admin_java" and "myadmin" secondary groups.',
          validationScript: 'id -Gn shrikant 2>/dev/null | grep -w "admin_java" | grep -q -w "myadmin"',
        },
        {
          id: 'task-mod2-9',
          title: '9. Create user "mahesh" with secondary groups "ht_java" and "super_admin"',
          description: 'Create a user named "mahesh" and add "mahesh" user to "ht_java" and "super_admin" secondary groups.',
          validationScript: 'id -Gn mahesh 2>/dev/null | grep -w "ht_java" | grep -q -w "super_admin"',
        },
        {
          id: 'task-mod2-10',
          title: '10. Create user "varsha" with UID 1089, GID 2076, and /sbin/nologin shell',
          description: 'Create user "varsha" with UID 1089, primary group GID 2076 (ht_java), and shell "/sbin/nologin".',
          validationScript: '[ "$(id -u varsha 2>/dev/null)" = "1089" ] && [ "$(id -g varsha 2>/dev/null)" = "2076" ] && getent passwd varsha 2>/dev/null | grep -qE "nologin"',
        },
        {
          id: 'task-mod2-11',
          title: '11. Configure password max age to 90 days for user "vinay"',
          description: 'Set the maximum password age policy to 90 days for user "vinay".',
          validationScript: 'chage -l vinay 2>/dev/null | grep -i "Maximum number of days between password change" | grep -q "90"',
        },
        {
          id: 'task-mod2-12',
          title: '12. Lock user account "kiran"',
          description: 'Lock the user account for "kiran" to disable login access.',
          validationScript: 'passwd -S kiran 2>/dev/null | grep -qE "L|locked" || getent shadow kiran 2>/dev/null | cut -d: -f2 | grep -q "!"',
        },
        {
          id: 'task-mod2-13',
          title: '13. Set account expiration date for user "mahesh"',
          description: 'Set the account expiration date for user "mahesh" to 2026-12-31.',
          validationScript: 'chage -l mahesh 2>/dev/null | grep -i "Account expires" | grep -q "2026"',
        },
        {
          id: 'task-mod2-14',
          title: '14. Create user "devops_admin" with custom home directory /home/devops_home',
          description: 'Create user "devops_admin" with home directory set to "/home/devops_home".',
          validationScript: 'getent passwd devops_admin 2>/dev/null | cut -d: -f6 | grep -q "/home/devops_home" && test -d /home/devops_home',
        },
        ],
    },
  ];

  db.seedInitialData(seedLabs, adminUser, adminPasswordHash);
  console.log('[Seeder] Seeding completed successfully!');
}
