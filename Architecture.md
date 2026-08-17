# BYOLabs.in — System Architecture

## 1. High-Level System Architecture

```text
                                  +-----------------------+
                                  |     User Browser      |
                                  | (React + xterm.js UI) |
                                  +-----------+-----------+
                                              |
                        HTTP / REST           |  WebSocket Stream
                       (API Requests)         | (/api/v1/labs/:id/terminal)
                                              v
                                  +-----------------------+
                                  |    BYOLabs Web API    |
                                  |  (Node.js / Express)  |
                                  +---+---------------+---+
                                      |               |
             SQL Queries              |               |  Kubernetes API Client
           (PostgreSQL / SQLite)      |               |  (@kubernetes/client-node)
                                      v               v
                        +-----------------+   +---------------------------------+
                        | Database Layer  |   |    Kubernetes Cluster Control   |
                        | (Lab Sessions,  |   | (ServiceAccount / RBAC Scoped)  |
                        |  Users, Tasks)  |   +---------------+-----------------+
                        +-----------------+                   |
                                                              v
                                              +---------------------------------+
                                              | Dedicated Namespace per Session |
                                              |   e.g. namespace: lab-7f8d29    |
                                              |   +---------------------------+ |
                                              |   | User Pod (ubuntu/docker)  | |
                                              |   | Interactive TTY (/bin/bash)| |
                                              |   +---------------------------+ |
                                              +---------------------------------+
```

---

## 2. Component Design

### 2.1 Apps & Monorepo Directory Layout
* `apps/web`: Frontend single-page React app (TypeScript, Vite, Tailwind CSS, Lucide icons, xterm.js, `@xterm/addon-fit`, `@xterm/addon-web-links`).
* `apps/api`: REST API backend and WebSocket Terminal Gateway (Express, `@kubernetes/client-node`, `ws`, `pg` / `better-sqlite3` storage adapter, JWT auth).
* `packages/shared`: Shared TypeScript types, validation logic (Zod), status enums, API request/response contracts.
* `infrastructure/`: Kubernetes manifests (ServiceAccount, RBAC roles, LimitRange, ResourceQuota, NetworkPolicy, Dockerfiles, docker-compose.yml).
* `labs/`: Default lab configurations, step-by-step instructions, and automated task validation scripts.

### 2.2 Terminal Gateway & Exec Streaming
1. Browser opens WebSocket connection to `ws://host/api/v1/labs/:sessionId/terminal?token=JWT`.
2. Gateway authenticates JWT token and checks DB session ownership (`session.userId === req.user.id` and `session.status === 'RUNNING'`).
3. Gateway invokes `@kubernetes/client-node` `Exec` stream API on target pod container stdin/stdout/stderr with TTY resize parameters.
4. If running in local standalone development mode without an active K8s cluster, Gateway falls back gracefully to a secure isolated child process sandbox engine (pty/spawn) so full terminal functionality works end-to-end anywhere.

### 2.3 Provisioning Workflow
1. User clicks **START LAB**.
2. API verifies user status is `APPROVED` and checks user active lab quota (max 2 active labs per user).
3. API checks overall cluster resource capacity (Max cluster pods / memory budget).
4. `LabProvisioner` generates unique `session_id` (e.g., `lab-7f8d29c4`).
5. `LabProvisioner` creates target K8s Namespace (`lab-session-<id>`).
6. `LabProvisioner` applies ResourceQuota and LimitRange to namespace.
7. `LabProvisioner` creates Pod with specified image (e.g. `ubuntu:24.04`), CPU/memory requests/limits, TTY enabled, and initial startup command.
8. API waits for Pod state `Ready` with timeout check (30s max).
9. Database session record updated to `RUNNING` with `expires_at` timestamp.
10. API returns session details to frontend; frontend transitions to `/lab/:sessionId` workspace.

### 2.4 Automatic Lifecycle & Cleanup Engine
* Periodic background worker (runs every 30s) scans database for expired sessions (`expires_at < NOW()` or `last_activity_at + idle_timeout < NOW()`).
* For each expired session:
  * Triggers `LabProvisioner.deleteLab(sessionId)`.
  * Deletes namespace `lab-session-<id>` (which recursively garbage-collects Pod, Services, PVCs).
  * Updates database state to `EXPIRED` or `STOPPED`.

---

## 3. Database Schema Overview
* **users**: `id`, `name`, `email`, `username`, `password_hash`, `role` (`USER`|`ADMIN`), `status` (`PENDING`|`APPROVED`|`SUSPENDED`|`REJECTED`), `created_at`, `updated_at`.
* **labs**: `id`, `slug`, `name`, `description`, `category`, `difficulty`, `duration_minutes`, `docker_image`, `cpu_request`, `cpu_limit`, `memory_request`, `memory_limit`, `storage`, `environment_variables`, `startup_command`, `instructions_markdown`, `tasks_json`, `is_published`, `created_at`.
* **lab_sessions**: `id`, `user_id`, `lab_id`, `namespace`, `pod_name`, `status` (`CREATING`|`STARTING`|`RUNNING`|`IDLE`|`STOPPING`|`STOPPED`|`FAILED`|`EXPIRED`), `created_at`, `started_at`, `expires_at`, `last_activity_at`.
* **lab_task_progress**: `id`, `session_id`, `user_id`, `task_id`, `completed`, `completed_at`.
* **system_settings**: Key-value settings for max active labs per user, max cluster labs, default timeout.
* **audit_logs**: `id`, `user_id`, `action`, `details`, `ip_address`, `timestamp`.
