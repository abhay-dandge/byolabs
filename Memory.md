# BYOLabs.in — Memory & Architectural Log

## 1. System Summary
**BYOLabs.in** is a production-grade interactive DevOps/Linux lab platform powered by dynamically provisioned Kubernetes pod container environments with browser-based interactive xterm.js terminals.

---

## 2. Key Technical & Architectural Decisions
* **Monorepo Setup**: Divided into `@byolabs/shared` (TypeScript schemas and contracts), `@byolabs/api` (Express backend, K8s provisioner, WebSocket gateway, task validator, background cleanup worker), and `@byolabs/web` (Vite, React, Tailwind CSS, Lucide icons, xterm.js).
* **Kubernetes Integration (`LabProvisionerService`)**:
  * Utilizes `@kubernetes/client-node` for live Kubernetes control planes.
  * Provisions dynamic namespaces (`lab-session-<uuid>`), ResourceQuotas (`requests.cpu`, `limits.cpu`, `requests.memory`, `limits.memory`), Pod specs with stdin/tty enabled, and Services.
  * Features a high-performance Sandbox fallback runner for local dev/testing environments when a live K8s cluster is not present.
* **Interactive Terminal Gateway (`TerminalGateway`)**:
  * Streams bidirectional binary/text PTY data over WebSockets (`/api/v1/labs/:sessionId/terminal?token=JWT`).
  * Attaches directly to container `exec` with ANSI color formatting, TTY resize support, copy/paste, clear screen, and reconnect capabilities.
* **In-Pod Task Validation (`TaskValidatorService`)**:
  * Executes validation shell scripts inside the user's running pod/environment when "Verify Task" is triggered.
  * Updates session completion progress in real-time.
* **Authentication & User Lifecycle**:
  * User account status lifecycle: `PENDING` -> `APPROVED` / `SUSPENDED` / `REJECTED`.
  * RBAC roles: `USER` and `ADMIN`.
  * Pre-seeded default admin account (`admin@byolabs.in` / `Admin@123456`).
* **Automated Session Garbage Collector (`CleanupWorkerService`)**:
  * Scans for expired session limits and idle timeouts every 30 seconds.
  * Idempotently deletes K8s namespaces (garbage-collecting Pods and resources).

---

## 3. Verified State & Acceptance Criteria
* [x] Monorepo architecture & workspace build configuration (`packages/shared`, `apps/api`, `apps/web`).
* [x] Database persistence store & seeder script (`seedDatabase`).
* [x] Authentication & RBAC middleware with admin approval requirement.
* [x] K8s Provisioner with namespace creation, pod specs, resource limits, and sandbox fallback.
* [x] WebSocket Terminal Gateway for xterm.js browser terminal streaming.
* [x] Split workspace UI layout (Markdown instructions, steps, task checklist, interactive verification buttons, xterm.js terminal canvas).
* [x] Admin dashboard (User approvals, Lab CRUD editor, Active Pod monitor & force stop, Cluster health stats, System logs, Settings).
* [x] Infrastructure deployments (`docker-compose.yml`, `rbac.yaml`, `backend-deployment.yaml`, `pod-template-example.yaml`, `Dockerfile.api`, `Dockerfile.web`).
* [x] Clean compilation across all TypeScript packages (`npm run build`).
