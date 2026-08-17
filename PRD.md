# BYOLabs.in — Product Requirement Document (PRD)

## 1. Executive Summary
**BYOLabs.in** is an interactive DevOps and Linux hands-on learning platform (inspired by Killercoda and GitHub Codespaces). It provides isolated, dynamically provisioned Kubernetes pod environments accessible directly via browser-based interactive xterm.js terminals.

---

## 2. Target Persona & Use Cases
* **DevOps Engineers / Linux Learners**: Practicing bash scripting, networking, Docker, Kubernetes, Ansible, Git, Terraform, AWS CLI in clean, isolated sandbox environments.
* **Platform Administrators & Instructors**: Defining custom labs with docker images, resource limits, step-by-step instructions, and automated bash task validation scripts.

---

## 3. Key Functional Requirements

### 3.1 Authentication & User Lifecycle
* **Registration**: Name, Email, Username, Password.
* **Account Status**:
  * `PENDING`: Initial state upon registration. User cannot launch labs until approved.
  * `APPROVED`: Admin has approved the account. User can launch labs.
  * `SUSPENDED`: User blocked from starting new lab environments.
  * `REJECTED`: User registration rejected by Admin.
* **Roles**: `USER` and `ADMIN`.
* **Security**: Bcrypt password hashing, JWT/Cookie session handling, server-side RBAC verification.

### 3.2 Lab Catalog & Configuration
* Labs possess metadata: ID, Slug, Name, Category, Difficulty, Duration, Docker Image, Resource Limits (CPU/Memory requests & limits), Environment variables, Startup command, Markdown Instructions, Task list with Validation rules.
* Out-of-the-box Labs: Ubuntu Playground, Linux Fundamentals, Git Playground, Docker Fundamentals, Kubernetes Basics, Ansible Basics, Terraform Basics, Bash Scripting, Nginx, AWS CLI.

### 3.3 Lab Environment Lifecycle & Isolation
* **Isolation**: Dynamic dedicated namespace (e.g. `lab-session-<uuid>`) per session or dedicated lab namespace containing isolated Pod, Service, and ConfigMap.
* **Pod Security**: Non-privileged user context option, no host filesystem mounts, no `docker.sock` host binding, explicit CPU/Memory Request & Limit enforcement, NetworkPolicy isolation.
* **Session Lifecycle**:
  `CREATING` -> `STARTING` -> `RUNNING` -> `IDLE` / `STOPPING` -> `STOPPED` / `EXPIRED` / `FAILED`.
* **Automatic Expiration & Cleanup**: Configurable max session duration (e.g. 60m) and idle timeout (e.g. 30m). Idempotent background garbage collection of expired Kubernetes resources and active DB sessions.

### 3.4 Interactive Browser Terminal (xterm.js + WebSockets)
* Integrated xterm.js terminal panel.
* Real-time bidirectional streaming over WebSocket (`/api/v1/labs/:id/terminal`).
* Backend handles streaming execution via `@kubernetes/client-node` `Exec` stream (or simulated sandbox engine for standalone local node verification).
* Full support for terminal resize (TTY resize events), copy/paste, keyboard shortcuts, clear screen, and reconnects.

### 3.5 Lab Instructions & Interactive Task Validation
* Split UI layout: Left pane for step-by-step Markdown instructions and task checklist; Right pane for the interactive terminal workspace.
* Automated Task Verification: Clicking "Verify Task" triggers server-side validation command execution inside the user's running pod, returning pass/fail feedback and updating progress state.

### 3.6 Admin Dashboard & Management
* User Approval Workflow: Approve, Reject, Suspend, Reactivate, or Delete accounts.
* Lab Management (CRUD): Create, edit, publish/unpublish lab definitions, configure docker images, startup commands, and resource limits.
* Active Labs Overview: View all currently running pods across users with force-stop capabilities.
* Cluster Metrics & Monitoring: Visual node health, CPU/Memory utilization, pod counts, system logs, and platform settings.

---

## 4. Technical Non-Functional Requirements
* **Security**: Strict server-side RBAC validation. Zero host access for lab pods. Error message sanitization preventing sensitive infrastructure leakage.
* **Scalability**: Decoupled API and background worker queue architecture for provisioning and resource cleanup.
* **User Experience**: Fast workspace initialization, sub-second terminal response, clean modern dark-mode developer aesthetics.
