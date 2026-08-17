# BYOLabs.in — Implementation Phases

## Phase 1: Core Foundation & Monorepo Infrastructure
* Monorepo setup (`apps/web`, `apps/api`, `packages/shared`).
* Database schema & migration engine (Users, Labs, Sessions, Tasks, System Settings, Audit Logs).
* Authentication system (JWT/Cookie auth, password hashing, roles: `USER` / `ADMIN`, user states: `PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED`).
* Base UI Layout & Navigation bar (Dark mode, modern developer aesthetic).

## Phase 2: Lab Catalog & Admin Management
* Lab metadata schema & database seeders (Ubuntu Playground, Linux Fundamentals, Git, Docker, Kubernetes, Ansible, Bash Scripting).
* Public & Authenticated Labs Catalog page with filtering, category tags, difficulty badges.
* Admin User Approval & Role Management workflow.
* Admin Lab CRUD interface (create, edit, publish/unpublish labs, set Docker image and CPU/Memory limits).

## Phase 3: Kubernetes Integration & Lab Provisioner Service
* `@kubernetes/client-node` integration & `LabProvisionerService`.
* Dynamic namespace creation (`lab-session-<uuid>`).
* Pod specification builder (CPU/Memory limits, TTY, env vars, startup command).
* Standalone development fallback executor for zero-dependency local testing.
* Health check APIs (`/health`, `/ready`).

## Phase 4: Browser Terminal & Task Validation Engine
* xterm.js frontend integration (`@xterm/xterm`, `@xterm/addon-fit`).
* Express WebSocket Terminal Gateway (`/api/v1/labs/:sessionId/terminal`).
* Stream bidirectional terminal input/output between browser and Pod container `exec`.
* Step-by-step Lab Instructions workspace layout with collapsible left pane.
* In-pod command task validation system with "Verify Task" execution feedback.

## Phase 5: Lab Lifecycle & Automated Cleanup
* Session state management (`CREATING`, `STARTING`, `RUNNING`, `STOPPING`, `STOPPED`, `EXPIRED`, `FAILED`).
* Explicit Stop Lab, Reset Lab, and Resume Lab workflows.
* Background garbage collection worker monitoring session timeouts and idle limits.
* ResourceQuota pre-checks and user active session concurrency limits.

## Phase 6: Admin Infrastructure Dashboard & Metrics
* Real-time Cluster Node health & CPU/Memory monitoring interface.
* Active Running Labs monitor with force-stop capabilities.
* System audit logs and event history stream.
* Deployment assets: Dockerfiles, `docker-compose.yml`, Kubernetes manifests (RBAC, Ingress, NetworkPolicy, LimitRange).
