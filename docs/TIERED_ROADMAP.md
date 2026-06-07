# Tiered Feature Roadmap
## AI Business Automation Dashboard

---

## Tier 1 — Core (Required for MVP)

### 1. Database Schema & Persistence Layer
- **Description**: Define and migrate all SQLAlchemy ORM models required for the system. This is the data foundation every other feature depends on.
- **Key Components**:
  - `Workflow` model: id, name, description, steps (JSON), status, created_at, updated_at
  - `Execution` model: id, workflow_id, status (PENDING / RUNNING / SUCCESS / FAILED), started_at, completed_at, duration_ms
  - `ExecutionStep` model: id, execution_id, step_name, status, started_at, completed_at, output (JSON)
  - `ExecutionLog` model: id, execution_id, step_name, level (INFO / WARN / ERROR), message, timestamp
  - `Trigger` model: id, workflow_id, type (manual / webhook), config (JSON), created_at
  - Alembic migration file generating all tables
  - SQLite database config for local dev; PostgreSQL connection string accepted via env var

---

### 2. Workflow Management API
- **Description**: REST API endpoints for full CRUD operations on workflow definitions. Enables creation, retrieval, update, and deletion of workflows without any UI.
- **Key Components**:
  - `POST /api/workflows` — create workflow from JSON body, validate DAG structure
  - `GET /api/workflows` — list all workflows with id, name, status, step count, last_run
  - `GET /api/workflows/{id}` — fetch single workflow with full step definitions
  - `PUT /api/workflows/{id}` — update workflow definition or status
  - `DELETE /api/workflows/{id}` — soft-delete (set status to `archived`)
  - Pydantic v2 request/response schemas for all endpoints
  - DAG validation: detect cycles, validate `nextStep` references exist, enforce required step fields

---

### 3. Workflow Execution Engine
- **Description**: The core service that takes a workflow's DAG definition and executes each step sequentially, passing context between steps and maintaining execution state.
- **Key Components**:
  - `WorkflowEngine` class: `execute(workflow_id, trigger_payload)` entry point
  - DAG parser: resolves step order from `nextStep` references, detects terminal steps
  - Step executor: dispatches each step to its registered handler by `type` field
  - Context object: dict passed between steps carrying accumulated outputs
  - Execution state machine: transitions `PENDING → RUNNING → SUCCESS | FAILED`
  - Per-step result writer: persists `ExecutionStep` record after each step completes
  - Unit tests covering: sequential execution, context passing, missing step references, terminal step detection

---

### 4. Retry System with Exponential Backoff
- **Description**: Wraps each step execution attempt with configurable retry logic. Steps that fail are retried up to a max count with increasing wait intervals before the execution is marked failed.
- **Key Components**:
  - `RetryPolicy` config per step: `max_attempts` (default 3), `base_delay_ms` (default 500), `backoff_multiplier` (default 2.0)
  - Retry decorator or wrapper applied inside `WorkflowEngine` step dispatch
  - Log entry written on each retry attempt: attempt number, delay, error message
  - Step marked `FAILED` only after all attempts exhausted
  - Execution marked `FAILED` when any non-retryable or exhausted step fails
  - Unit tests: verify retry count, verify backoff timing, verify failure propagation

---

### 5. Trigger System (Manual + Webhook)
- **Description**: Two trigger types that initiate workflow execution. Manual trigger is called directly via API. Webhook trigger exposes a public endpoint that accepts an inbound payload and maps it to a workflow.
- **Key Components**:
  - `POST /api/workflows/{id}/run` — manual trigger; accepts optional payload body; creates Execution and dispatches to engine
  - `POST /api/triggers/webhook/{trigger_id}` — webhook trigger; validates trigger exists and is active; extracts payload; calls engine
  - `Trigger` record creation and retrieval endpoints: `POST /api/triggers`, `GET /api/triggers`, `DELETE /api/triggers/{id}`
  - Trigger-to-workflow resolution: look up workflow from trigger_id before execution
  - Trigger log: record each trigger firing with timestamp, source, and resulting execution_id

---

### 6. Execution History API
- **Description**: REST endpoints that expose persisted execution data — list of past runs, per-execution detail, and per-step status — needed by both the dashboard and drilldown views.
- **Key Components**:
  - `GET /api/executions` — paginated list; filter by workflow_id, status, date range; returns id, workflow name, status, started_at, duration
  - `GET /api/executions/{id}` — full execution detail with ordered list of ExecutionStep records
  - `GET /api/executions/{id}/logs` — ordered ExecutionLog entries for an execution; filter by level
  - Pagination: `limit` / `offset` query params with total count in response envelope
  - Index on `workflow_id`, `status`, `started_at` for query performance

---

### 7. Integration Mock Layer
- **Description**: A pluggable service layer that simulates real third-party integrations (Slack, email, generic webhook). Each mock accepts a structured config, logs the simulated action, and returns a success response — allowing workflows to complete end-to-end without real credentials.
- **Key Components**:
  - `IntegrationService` abstract base class with `execute(config, context) -> IntegrationResult`
  - `SlackMockService`: logs channel + message text, returns `{"status": "sent", "channel": "...", "mock": true}`
  - `EmailMockService`: logs to/subject/body, returns `{"status": "sent", "to": "...", "mock": true}`
  - `WebhookMockService`: logs target URL + payload, returns `{"status": "posted", "url": "...", "mock": true}`
  - Step type `integration` in the engine dispatches to `IntegrationService` registry by `integration_type` config field
  - All mock calls write an INFO-level `ExecutionLog` entry with the simulated result

---

### 8. Real-Time Log Streaming Endpoint
- **Description**: A server-side endpoint that streams live execution log events to the frontend as they are written during workflow execution. Enables the dashboard's live log panel to update without polling.
- **Key Components**:
  - `GET /api/executions/{id}/stream` — SSE (Server-Sent Events) endpoint using FastAPI `StreamingResponse`
  - Event format: `data: {"level": "INFO", "message": "...", "step": "...", "timestamp": "..."}` followed by `\n\n`
  - Async generator that reads from an in-memory queue populated by the execution engine during step processing
  - Connection cleanup on client disconnect
  - Fallback behavior: if execution is already complete when client connects, stream full log history then close
  - Frontend EventSource client hook that appends events to log panel state

---

### 9. Dashboard Shell & Navigation
- **Description**: The React application skeleton — routing, sidebar navigation, layout structure, and design system tokens. All other UI features are mounted within this shell.
- **Key Components**:
  - Sidebar: Workflows, Triggers, Logs, Integrations, Analytics, Settings navigation items with active state
  - Top bar: app title, system status badge ("All Systems Operational" / "Degraded")
  - React Router v6 route definitions for each section
  - Tailwind CSS config: custom color tokens (`indigo-600`, `cyan-400`, `navy-950`), `Inter` and `JetBrains Mono` font loading
  - Glassmorphism panel component: `backdrop-blur`, `bg-white/5`, `border border-white/10` base styles
  - Grid background texture on root layout
  - Responsive breakpoint: desktop only (min-width 1024px)

---

### 10. Workflow List View
- **Description**: The primary dashboard screen listing all workflows with their current status, last run time, and quick-action controls. This is the first screen a user sees on login.
- **Key Components**:
  - `WorkflowCard` component: workflow name, description, status badge (Active / Inactive / Archived), step count, last_run timestamp
  - Status badge: color-coded glowing indicator (green for Active, gray for Inactive, amber for Archived)
  - "Run Workflow" button per card: calls `POST /api/workflows/{id}/run` and navigates to execution detail
  - "Create Workflow" button: opens workflow creation form/modal
  - Data fetch via `GET /api/workflows` on mount; loading skeleton while pending
  - Empty state illustration when no workflows exist

---

### 11. Live Execution Log Panel
- **Description**: A real-time scrolling log viewer embedded in the workflow detail and execution detail views. Connects to the SSE stream endpoint and renders color-coded log lines as they arrive.
- **Key Components**:
  - `LogPanel` component: fixed-height scrollable container using `JetBrains Mono` font
  - `LogLine` component: timestamp, level badge (INFO=cyan, WARN=amber, ERROR=red), step name, message text
  - `useExecutionStream` hook: wraps browser `EventSource`, appends events to local state, closes on unmount
  - Auto-scroll to bottom on new entries; pause auto-scroll when user scrolls up
  - "RUNNING" status indicator with pulsing glow animation while stream is open
  - Graceful end-of-stream handling: status transitions to SUCCESS or FAILED badge when stream closes

---

### 12. KPI Analytics Cards
- **Description**: Four summary metric cards displayed at the top of the dashboard providing at-a-glance system health. Data is fetched from a dedicated analytics endpoint on page load.
- **Key Components**:
  - `GET /api/analytics/summary` backend endpoint: returns `runs_today`, `success_rate_pct`, `active_workflow_count`, `avg_duration_ms`
  - `KpiCard` component: metric value (large), label (small), optional trend arrow (up/down vs. prior day)
  - Cards: "Runs Today", "Success Rate", "Active Workflows", "Avg Duration"
  - Glassmorphism card style with subtle indigo border glow
  - Data refresh on 30-second interval while dashboard is open

---

## Tier 2 — Enhancements (Improves Product Value)

### 1. Execution Detail Drilldown View
- **Description**: A dedicated page for a single execution showing a timeline of each step — status, start time, duration, input context, and output — enabling post-mortem analysis of failures.
- **Key Components**:
  - Route: `/executions/{id}`
  - `StepTimeline` component: ordered list of steps with status icon, duration bar, expandable input/output JSON viewer
  - Step status icons: checkmark (SUCCESS), spinner (RUNNING), X (FAILED), clock (PENDING)
  - `ExecutionMeta` header: workflow name, trigger type, total duration, overall status badge
  - "Re-run from here" button stub (wired in Tier 2 Replay feature)
  - Link from WorkflowCard's last-run timestamp to this view

---

### 2. Workflow Creation Form
- **Description**: A structured multi-field form in the UI for creating a new workflow without manually authoring raw JSON. Produces a valid workflow definition submitted to the API.
- **Key Components**:
  - Fields: Name, Description, Status toggle
  - Dynamic step builder: add/remove steps; per-step fields: Step Name, Type (action / integration / decision), Config (key-value pairs), Retry max attempts, Next Step selector
  - Real-time DAG preview: text-based step chain visualization (`Lead → Classify → Notify`)
  - Client-side validation: required fields, no duplicate step IDs, nextStep references must exist in defined steps
  - Submit calls `POST /api/workflows`; on success navigates to workflow detail

---

### 3. Log Search & Level Filter
- **Description**: Search and filter controls on the log panel allowing users to isolate specific events within a large execution log.
- **Key Components**:
  - Level filter buttons: ALL / INFO / WARN / ERROR — toggleable, highlighted when active
  - Text search input: filters visible log lines by substring match on message field (client-side)
  - Result count badge: "Showing 12 of 87 entries"
  - Clear filters button
  - Persists filter state in component (not URL) for simplicity

---

### 4. Workflow Status Filters & Tags
- **Description**: Filter and tag controls on the Workflow List view enabling users to narrow the list by status or custom labels.
- **Key Components**:
  - Filter bar: status pills (All / Active / Inactive / Archived) — single-select
  - Tag input on workflow creation/edit form: free-text tags stored in `tags` JSON field on Workflow model
  - Tag filter chips on list view: multi-select
  - `GET /api/workflows?status=active&tags=lead,crm` query param support on backend
  - Clear all filters button

---

### 5. AI Classification Step (Rule Engine)
- **Description**: A built-in step type that scores incoming payload text against configurable keyword rules and outputs an intent classification label (e.g., HIGH_INTENT, LOW_INTENT, SPAM). Replaces the need for a live LLM call.
- **Key Components**:
  - Step type `classify` registered in the WorkflowEngine step handler registry
  - `ClassificationService`: accepts `text` field from context, applies weighted keyword rules from step config, returns `classification` and `confidence_score`
  - Rule config format: `{"rules": [{"keyword": "demo", "weight": 2, "label": "HIGH_INTENT"}, ...]}`
  - Threshold config: `high_intent_threshold`, `spam_threshold`
  - Classification result written to execution context under `classification_result` key
  - Unit tests: multi-keyword scoring, threshold boundary behavior, unknown input default

---

### 6. Cron Trigger (Scheduled Execution)
- **Description**: A trigger type that fires a workflow on a cron schedule, enabling time-based automation without external schedulers.
- **Key Components**:
  - `schedule` trigger type in `Trigger` model; `cron_expression` field (e.g., `0 9 * * 1-5`)
  - APScheduler integration in FastAPI startup: load all active schedule triggers, register jobs
  - `SchedulerService`: `add_job(trigger)`, `remove_job(trigger_id)`, `list_jobs()`
  - Reschedule on trigger update; remove job on trigger delete
  - Next-run-at timestamp exposed in `GET /api/triggers` response
  - Cron expression validator on trigger creation (reject invalid expressions)

---

### 7. Execution Replay
- **Description**: Allows a user to re-run a failed or completed execution, either from the beginning or from the first failed step, without reconfiguring the trigger.
- **Key Components**:
  - `POST /api/executions/{id}/replay` — creates a new Execution record cloned from the source, optionally with `resume_from_step` param
  - WorkflowEngine `replay` mode: skip steps before `resume_from_step`, carry forward context from the original execution's successful steps
  - "Replay" button on Execution Detail view; sends API call and navigates to new execution's detail view
  - Original execution_id stored as `parent_execution_id` on the replayed record for lineage tracking

---

### 8. Integration Status Panel
- **Description**: A dedicated UI section showing the health and usage of each configured integration mock, so users can see which connectors are active and how often they've been called.
- **Key Components**:
  - `GET /api/integrations` endpoint: returns list of registered integration types with call count, last_called_at, status (active / inactive)
  - `IntegrationCard` component: integration name, icon, call count, last call timestamp, status indicator
  - "Test Connection" button: calls `POST /api/integrations/{type}/test`; displays success/fail result inline
  - Mock layer increments call counter in a lightweight in-memory or DB-backed counter per integration type

---

## Tier 3 — Advanced (Future / Complex)

### 1. Visual Drag-and-Drop Workflow Graph Editor
- **Description**: A canvas-based workflow editor where steps are represented as nodes and connections are drawn as edges. Replaces the form-based step builder with a fully visual interface.
- **Key Components**:
  - React Flow integration as graph canvas
  - Custom node types: ActionNode, IntegrationNode, DecisionNode, StartNode, EndNode
  - Edge drawing between nodes produces `nextStep` references in the underlying workflow JSON
  - Config sidebar panel: clicking a node opens its step config form
  - Export button: serializes the graph to the same JSON format accepted by `POST /api/workflows`
  - Read-only replay mode: animate step highlights during live execution using the SSE stream

---

### 2. Real Integration Connectors
- **Description**: Replace mock service implementations with live API calls to real third-party services. Each connector authenticates, sends the real request, and handles errors from the provider.
- **Key Components**:
  - `SlackConnector`: posts to real Slack channel via Incoming Webhooks URL from env config
  - `SendGridConnector`: sends transactional email via SendGrid v3 API
  - `HubSpotConnector`: creates or updates CRM contact via HubSpot Contacts API
  - `GenericWebhookConnector`: HTTP POST to any configured URL with configurable headers and body template
  - Credentials stored in environment variables; never persisted in the database
  - Per-connector error classification: rate limit (retry), auth failure (fail immediately), timeout (retry)

---

### 3. Multi-Tenant Authentication & Workspace Isolation
- **Description**: User account system with JWT authentication that scopes all workflows, executions, and triggers to an individual user's workspace.
- **Key Components**:
  - `User` model: id, email, hashed_password, created_at
  - `POST /auth/register`, `POST /auth/login` endpoints returning JWT access token
  - JWT middleware: validates Bearer token on all `/api/*` routes; injects `current_user` dependency
  - All ORM queries filtered by `owner_id` FK on Workflow, Trigger, and Execution models
  - React auth context: store token in memory (not localStorage); attach to all API requests via Axios interceptor
  - Protected route wrapper: redirect to login if no valid token

---

### 4. Workflow Versioning & Rollback
- **Description**: Every save to a workflow definition creates an immutable version snapshot. Users can view version history and roll back to any prior version.
- **Key Components**:
  - `WorkflowVersion` model: id, workflow_id, version_number, definition (JSON), created_at, created_by
  - Version snapshot written on every `PUT /api/workflows/{id}` call
  - `GET /api/workflows/{id}/versions` — list all versions with version number and timestamp
  - `POST /api/workflows/{id}/rollback/{version}` — overwrites current definition with versioned snapshot, creates new version entry
  - Version diff view in UI: side-by-side step list comparison between two selected versions

---

### 5. Execution Engine Horizontal Scaling (Task Queue)
- **Description**: Decouple workflow execution from the FastAPI request thread by dispatching executions to a Celery task queue backed by Redis. Enables concurrent execution of multiple workflows and removes request timeout risk.
- **Key Components**:
  - Redis as Celery broker and result backend
  - `execute_workflow` Celery task wrapping `WorkflowEngine.execute()`
  - FastAPI trigger endpoints enqueue the task and return `{"execution_id": "...", "status": "QUEUED"}` immediately
  - Celery worker process runs separately; executions are fully async from the API server
  - `GET /api/executions/{id}` polls the DB record updated by the worker for status
  - Docker Compose file: `api`, `worker`, `redis`, `db` services

---

### 6. Alerting Rules Engine
- **Description**: User-configurable rules that trigger notifications when execution metrics breach defined thresholds — such as failure rate exceeding 10% or a workflow not running for 24 hours.
- **Key Components**:
  - `AlertRule` model: id, workflow_id (nullable for global rules), metric (failure_rate / no_run_since / duration_exceeded), threshold, notification_channel, enabled
  - `AlertEvaluator` service: runs after each execution completes; evaluates all applicable rules against current metrics
  - Alert notification dispatch: writes to `AlertEvent` log; optionally calls integration connector
  - `GET /api/alerts` — list all alert events with rule, triggered_at, metric_value, resolved status
  - Alert badge in top bar: count of unresolved alert events with red glow indicator

---

# Dependency Notes

- **Feature 2 (Workflow Management API)** must be complete before Features 3, 5, 10, and 11 — the API is the data source for all workflow-dependent features.
- **Feature 3 (Execution Engine)** depends on Feature 1 (Database Schema) and Feature 7 (Integration Mock Layer) to complete end-to-end execution without errors.
- **Feature 4 (Retry System)** is an internal component of Feature 3 — it must be built as part of the engine, not after.
- **Feature 6 (Execution History API)** depends on Feature 3 producing `Execution` and `ExecutionLog` records in the database.
- **Feature 8 (SSE Streaming)** depends on Feature 3 emitting log events to the in-memory queue during execution.
- **Feature 9 (Dashboard Shell)** must be scaffolded before Features 10, 11, and 12 can be mounted as routes/components.
- **Feature 11 (Live Log Panel)** depends on Feature 8 (SSE endpoint) being live and Feature 9 (shell) being in place.
- **Feature 12 (KPI Cards)** depends on the analytics summary endpoint, which requires Feature 3 to be producing execution records.
- **Tier 2 — Feature 5 (AI Classification Step)** depends on Feature 3 (step handler registry) existing.
- **Tier 2 — Feature 6 (Cron Trigger)** depends on Feature 5 (Trigger System) and requires APScheduler wired into FastAPI startup.
- **Tier 2 — Feature 7 (Execution Replay)** depends on Feature 3 (engine) and Feature 1 (execution records with step-level detail).
- **Tier 3 — Feature 3 (Multi-Tenant Auth)** must be in place before Tier 3 Feature 5 (scaling) to avoid retrofitting auth into a distributed worker system.
- **Tier 3 — Feature 5 (Task Queue)** depends on Tier 2 Feature 6 (Cron) being migrated to Celery beat; architecture must be planned together.

---

# Execution Order Recommendation

1. **Feature T1-1: Database Schema & Persistence Layer** — every other feature reads or writes to these models; nothing can be built without this foundation.
2. **Feature T1-3 + T1-4: Workflow Execution Engine + Retry System** — build together as a single unit; the engine is the core product and is testable in isolation via unit tests before any API or UI exists.
3. **Feature T1-7: Integration Mock Layer** — wire in before running end-to-end executions so workflow steps resolve without errors.
4. **Feature T1-2: Workflow Management API** — expose the engine over HTTP; enables full workflow CRUD and first real API-driven test run.
5. **Feature T1-5: Trigger System (Manual + Webhook)** — add the `POST /run` endpoint so executions can be initiated from outside the codebase.
6. **Feature T1-6: Execution History API** — expose execution records; required by the frontend before any dashboard data can be displayed.
7. **Feature T1-8: Real-Time Log Streaming (SSE)** — complete the data pipeline; the live log panel is the highest-impact visual feature of the MVP.
8. **Feature T1-9: Dashboard Shell & Navigation** — scaffold the React app with routing and design system; required before any UI component can be developed.
9. **Feature T1-10: Workflow List View** — first visual screen; confirms frontend-to-backend integration is working.
10. **Feature T1-11: Live Execution Log Panel** — highest-impact demo feature; validates the full path from trigger → engine → SSE → UI.
11. **Feature T1-12: KPI Analytics Cards** — completes the MVP dashboard; system is now fully demo-ready at this point.
12. **Tier 2 Features** — build in priority order: Execution Detail Drilldown → Workflow Creation Form → AI Classification Step → Log Filters → Status Filters → Cron Trigger → Execution Replay → Integration Status Panel.
13. **Tier 3 Features** — tackle only after Tier 2 is stable; start with Real Integration Connectors (highest demo value), then Auth, then Versioning, then scaling infrastructure.
