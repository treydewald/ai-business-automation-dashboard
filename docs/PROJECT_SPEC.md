# Project Overview

## Summary

The AI Business Automation Dashboard is a full-stack web application that allows operators and developers to define, execute, monitor, and analyze multi-step business workflows through a visual control-room interface. It targets small-to-mid-size teams who need to automate repetitive operational processes — such as lead intake, classification, enrichment, and notification — without building custom orchestration infrastructure from scratch. The system provides a JSON-defined DAG execution engine on the backend and a real-time React dashboard on the frontend, combining workflow management with live execution observability. It bridges the gap between no-code tools (too limited) and raw scripting (too costly to maintain) by giving technical users a structured, API-first automation platform they own and extend. The result is a portfolio-grade project that demonstrates production-quality full-stack engineering and AI-assisted workflow automation.

## Core Value Proposition

- **What does this enable that did not exist before?** A self-hosted, code-defined workflow engine with a real-time visual dashboard — owners control the logic, data never leaves their infrastructure, and every execution step is observable with structured logs, retry policies, and success metrics.
- **Why use this over alternatives?** Zapier and Make are black-box SaaS tools with data privacy concerns and per-operation pricing. Custom scripts have no visibility layer. This system gives engineers structured workflow execution with a professional operations UI, full ownership of data, and a codebase they can demonstrate to employers or clients.

---

# Users & Use Cases

## Target Users

- **Primary**: Full-stack developers building portfolio projects that demonstrate systems design and automation engineering skills.
- **Secondary**: Small business operators or technical founders who want a lightweight self-hosted automation layer over their existing tools (CRM, Slack, email).

## Key Use Cases

1. **Lead Pipeline Automation** — An incoming lead (via webhook or API call) is automatically classified by intent level, enriched with metadata, routed to a CRM step, and a Slack notification is dispatched — all tracked in real time on the dashboard.
2. **Operational Health Monitoring** — An operator opens the dashboard to review today's workflow runs, sees success/failure rates at a glance, drills into a failed execution to inspect the specific step that errored and why.
3. **Workflow Configuration & Deployment** — A developer creates a new workflow by defining a JSON step graph, configures a webhook trigger, tests it manually from the UI, and promotes it to active status — all without touching infrastructure.

---

# Core System Definition

## Inputs

- **Workflow definitions**: JSON-described DAGs uploaded or created via the API/UI, specifying step types, configs, retry policies, and conditional routing.
- **Trigger events**: Manual trigger from the UI, incoming HTTP webhook payloads, and (future) cron schedules.
- **Integration credentials**: API keys and endpoint configs for Slack, email, CRM, or generic webhooks — stored securely as environment-scoped config.
- **User actions**: Run, edit, archive, delete, and filter commands issued from the frontend dashboard.

## Outputs

- **Execution records**: Persisted run history per workflow with start time, duration, status, and per-step results.
- **Real-time log stream**: Live event feed of each execution step (classification result, routing decision, integration call status) delivered via WebSocket or SSE to the dashboard.
- **Analytics aggregates**: Counts and rates surfaced as KPI cards — runs today, success rate, average duration, top failing steps.
- **Integration side effects**: Dispatched Slack messages, email notifications, webhook POSTs, and CRM writes (mocked in MVP, real in later phases).

## Core Workflow (Step-by-Step)

1. A trigger fires (manual UI click, incoming webhook, or schedule) and creates a new Execution record in the database with status `PENDING`.
2. The WorkflowEngine retrieves the workflow's DAG definition, validates it, and begins sequential step execution, updating status to `RUNNING`.
3. Each step executes its configured action (classification, enrichment, integration call), appends a structured log entry, and resolves its `nextStep` pointer.
4. On step failure, the retry system applies exponential backoff for the configured number of attempts before marking the step and execution as `FAILED`.
5. On full completion, the Execution status is updated to `SUCCESS`, final duration is recorded, and analytics aggregates are refreshed.
6. Throughout execution, log events are streamed to the frontend in real time; the dashboard's live log panel and status indicator update without page reload.

---

# Feature Surface Area

## Must-Have Capabilities (Core Features)

- Workflow CRUD API (`POST`, `GET`, `PUT`, `DELETE /api/workflows`)
- DAG-based step execution engine with sequential processing and context passing between steps
- Manual trigger and webhook trigger endpoints
- Execution history with per-step status tracking
- Structured JSON execution logging with timestamps
- Exponential backoff retry mechanism per step
- Real-time log streaming to the frontend (WebSocket or SSE)
- Dashboard overview: workflow list, run status indicators, execution log panel
- KPI cards: runs today, success rate, active workflow count
- Integration mock layer (Slack, email, generic webhook) so workflows complete end-to-end without real credentials

## Nice-to-Have Capabilities (Enhancements)

- Workflow step editor in the UI (visual DAG builder or form-based step config)
- Execution detail drilldown: per-step timeline, duration, input/output context
- Log search and filter by level (INFO / WARN / ERROR) and keyword
- Workflow tagging and status filters on the list view
- Cron-based scheduled triggers
- Execution replay (re-run a failed execution from the failed step)
- AI-assisted step classification using a lightweight local rule engine or OpenAI API call

## Advanced / Future Capabilities

- Full drag-and-drop visual workflow graph editor (React Flow or similar)
- Real integration connectors (live Slack, SendGrid, HubSpot, Salesforce)
- Multi-tenant support with workspace isolation and JWT-authenticated user accounts
- Workflow versioning and rollback
- Secrets vault for integration credentials (Vault, AWS Secrets Manager)
- Horizontal scaling of the execution engine with a task queue (Celery + Redis)
- Alerting rules: notify on failure rate threshold or execution duration breach

---

# Technical Direction

## Suggested Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS — component library kept minimal (no heavy UI framework), custom glassmorphism design system with Indigo/Cyan/Dark palette.
- **Backend**: Python 3.11+, FastAPI — async request handling, Pydantic v2 for schema validation, SQLAlchemy 2.0 ORM with async sessions.
- **Database**: SQLite for local development and solo MVP (zero-config); PostgreSQL migration path defined for production via the same SQLAlchemy models.
- **Real-time**: FastAPI WebSocket endpoint or Server-Sent Events (SSE) for live log streaming — no external message broker required for MVP.
- **Integrations**: Mock service layer in Python that simulates Slack/email/webhook calls and returns structured responses; real connectors are plug-in replacements behind a common interface.
- **Auth (deferred)**: JWT via `python-jose` and `passlib` — defined in architecture but not blocking MVP functionality.

---

# Constraints & Assumptions

## Constraints

- **Time**: Solo build targeting ≤14 active development days for a demo-ready MVP.
- **Infrastructure**: Runs entirely on localhost; no cloud deployment required for MVP. No external services needed — mocks satisfy all integration points.
- **Scope**: No multi-user auth, no drag-and-drop visual graph editor, no real third-party API credentials in MVP phase.
- **Data volume**: SQLite is sufficient for demo-scale data (hundreds of executions). Pagination and indexing still required to avoid UI slowdowns.

## Assumptions

- The operator has Python 3.11+ and Node 18+ installed locally.
- Workflows are authored as JSON structures — no GUI workflow builder is required for MVP; API or UI form is sufficient.
- Mock integrations are acceptable for portfolio demonstration; reviewers understand this is a simulation layer.
- A single user (no auth) is fine for MVP; the architecture must not prevent adding auth later.
- The AI "classification" step in MVP can be a deterministic rule engine (keyword scoring) rather than a live LLM call — this keeps the system self-contained and demo-stable.

---

# Scope Control

## Explicitly NOT Building

- Real third-party API integrations (live Slack, live email, live CRM) — mocked only in MVP.
- Multi-tenant user authentication and authorization system.
- Drag-and-drop visual workflow graph editor (form-based or JSON-based workflow creation is sufficient).
- Mobile-responsive layout — desktop control room interface only.
- Kubernetes, Docker Compose, or any containerized deployment setup.
- Payment, subscription, or billing logic.
- Dedicated AI/LLM model hosting — no GPU infrastructure, no fine-tuning.
- Notification delivery to external endpoints (SMS, push) beyond the mock layer.

---

# Risks & Unknowns

- **WebSocket complexity**: Real-time log streaming via WebSocket in FastAPI requires careful connection lifecycle management; SSE may be a simpler fallback if WS proves unstable.
- **DAG execution correctness**: Validating cyclic graphs, handling missing `nextStep` references, and managing branching/conditional logic without a mature orchestration library requires robust unit testing.
- **SQLite concurrency**: Concurrent webhook triggers hitting the execution engine simultaneously can cause SQLite write contention; acceptable for demo, but needs documented mitigation path (WAL mode or PostgreSQL swap).
- **AI classification accuracy**: If a live model call is added later, latency and API key management introduce reliability risk; the mock rule engine avoids this entirely for MVP.
- **Frontend state management**: Real-time WebSocket data merged with REST-fetched execution history requires careful state design — risk of stale data or duplicate log entries in the UI.
- **Unknown**: Whether the portfolio audience (hiring managers, clients) expects live integrations or accepts mocks — this may require a prominent "simulation mode" label in the UI.

---

# Roadmap Readiness Summary

## Core System

The AI Business Automation Dashboard is a full-stack workflow orchestration platform with a FastAPI execution engine that runs JSON-defined DAG workflows, a PostgreSQL/SQLite persistence layer for workflow definitions and execution history, and a React/TypeScript dashboard that provides real-time visibility into running workflows via a live log stream and KPI analytics panel. The system uses an event-based execution model — triggers fire, steps execute sequentially with retry logic, integration mocks simulate real-world side effects, and every event is logged and surfaced through the UI in real time.

## Feature Direction

- **Workflow Management**: CRUD for workflow definitions, step configuration, trigger assignment, and status control.
- **Execution Engine**: DAG parsing, sequential step execution, context propagation, retry with exponential backoff, and execution state machine.
- **Trigger System**: Manual trigger (UI button), webhook trigger (inbound HTTP), and future cron scheduling.
- **Real-Time Observability**: WebSocket/SSE log streaming, live status indicators, per-execution step timeline.
- **Analytics Layer**: KPI aggregates (runs today, success rate, avg duration), top failing workflows, execution trend over time.
- **Integration Mock Layer**: Pluggable service connectors for Slack, email, and generic webhooks — returns structured mock responses to allow end-to-end workflow completion.
- **Dashboard UI (Neon Indigo Ops)**: Dark control-room aesthetic, glassmorphism panels, glowing status indicators, sidebar navigation, workflow list, and live execution log panel.

## Build Priority Insight

Build the backend execution engine first — specifically the `Workflow` and `Execution` data models, the `WorkflowEngine` service, and the manual trigger endpoint. This creates a testable, runnable core before any UI exists. Next, add the execution log API and WebSocket streaming endpoint so the data pipeline is complete. Then build the React dashboard shell with the workflow list and live log panel to make the system visually demonstrable. Analytics, trigger management UI, and integration mocks are additive layers that enhance the demo without blocking the core proof of concept. This order ensures that at any point in development, a working end-to-end path exists from trigger → execution → log → dashboard.
