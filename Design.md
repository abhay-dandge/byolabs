# BYOLabs.in — Design System & UI/UX Guidelines

## 1. Aesthetic Vision
**BYOLabs.in** standardizes on a high-end, dark-first modern developer theme inspired by GitHub Codespaces, Warp terminal, and Killercoda.

* **Color Palette**:
  * Background: Slate/Zinc Deep Dark (`#090d16`, `#0d1117`, `#161b22`)
  * Surface/Card Background: `#1c2128`, `#21262d`
  * Borders: `#30363d`, `#38444d`
  * Accent Primary: Cyan / Indigo Gradient (`#38bdf8` / `#6366f1`)
  * Text Primary: `#f0f6fc`
  * Text Muted: `#8b949e`
  * Status Colors:
    * Running / Approved: Emerald (`#10b981`)
    * Pending / Creating: Amber (`#f59e0b`)
    * Failed / Suspended: Rose (`#f43f5e`)

* **Typography**:
  * Headings & Body: Inter / System UI
  * Monospace / Terminal: `Fira Code`, `JetBrains Mono`, `Consolas`, monospace.

---

## 2. Main Page Layouts

### 2.1 Landing Page (`/`)
* Hero Section: "Master Linux & DevOps in Real Kubernetes Containers".
* Live Terminal Mockup preview with interactive typing animation.
* Interactive Lab Catalog highlights (Ubuntu, Docker, Kubernetes, Git, Ansible, Terraform).
* Architecture highlight diagram showing true pod isolation.

### 2.2 Dashboard (`/dashboard`)
* User status alert (e.g. "Account Pending Approval" banner if applicable).
* Active running labs quick access card ("Resume Workspace").
* Lab progress overview & recommended labs.

### 2.3 Lab Workspace (`/lab/:sessionId`)
* Top Navigation: Lab Name, Status Badge, Time Remaining Countdown, Reset Button, Stop Button, Theme toggle.
* Split Pane:
  * Left Pane (35% width): Step-by-step Markdown Instructions, Prerequisites, Task Checklist, "Verify Task" action buttons with pass/fail indicators.
  * Right Pane (65% width): xterm.js Canvas with full TTY controls, reconnect bar, fullscreen toggle, copy terminal output, clear screen.

### 2.4 Admin Dashboard (`/admin`)
* Key metrics grid: Total Users, Pending Approvals, Active Pods, CPU Utilization, Memory Utilization.
* Tabs:
  * `Users`: Table with Search, Filter by Status, Approve / Reject / Suspend / Reactivate controls.
  * `Labs`: Catalog management form & list of labs with publish toggle.
  * `Running Labs`: Real-time session table with user details, namespace, pod uptime, and force terminate.
  * `Cluster Status`: Node capacity, CPU/Memory gauges, and K8s namespace stats.
