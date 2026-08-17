# BYOLabs.in — Architectural & Security Rules

## 1. Security Rules
1. **Zero Host Access**: User lab pods must NEVER mount `/var/run/docker.sock`, host root filesystem, host network namespace (`hostNetwork: true`), or host PID namespace (`hostPID: true`).
2. **No Arbitrary Kubeconfig Exposure**: Client browser applications must NEVER possess Kubernetes admin tokens, service account tokens, or direct access to the K8s API server. All interaction passes through the API WebSocket proxy.
3. **Namespace & RBAC Guardrails**: Backend operates using a strictly scoped Kubernetes `ServiceAccount` and `Role` bound to managed lab namespaces (allowing `create`, `get`, `delete`, `watch` on Pods, Services, ConfigMaps, Namespaces, and `pods/exec`). `cluster-admin` binding is strictly prohibited.
4. **Input Validation**: All client parameters (`labId`, `sessionId`, `taskId`, input credentials, form data) MUST be sanitized server-side using schemas (Zod). NEVER construct shell commands by string concatenation of untrusted client input.
5. **Error Sanitization**: Never leak raw Kubernetes API internal stack traces or 403 Forbidden service account messages to end users. Always wrap infrastructure errors in user-friendly localized messages while logging detailed diagnostics internally.

## 2. Resource & Quota Control Rules
1. Every lab pod spec MUST enforce explicit `resources.requests` and `resources.limits` for both CPU and Memory (e.g. CPU request 250m, CPU limit 1000m; Memory request 256Mi, Memory limit 1Gi).
2. Every generated lab namespace MUST include a `ResourceQuota` object capping total CPU, Memory, and Pod counts.
3. Quota Pre-check: Prior to scheduling a pod, the API MUST evaluate active cluster pod limits and user active session limits (default max 2 concurrent labs per user).

## 3. Codebase & Development Standards
1. **Strict TypeScript**: Use explicit type definitions across frontend, backend, and shared packages. Zero `any` casting.
2. **Monorepo Modularization**: Shared business logic, interfaces, and validation schemas reside in `packages/shared`.
3. **Idempotency**: All cleanup operations (`deleteLab`, `expireSessions`, namespace teardown) MUST be idempotent and safe to retry without crashing on missing resources.
4. **Clean API Layer**: Controller routes MUST NOT directly manipulate Kubernetes API primitives; all pod lifecycle operations delegate to `LabProvisionerService`.
