# System Architecture

## Overview

The AI Business Automation Dashboard is built using a modular, microservices-ready architecture that separates concerns across frontend, backend, and data layers.

## High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│         (Dashboard, Workflow Manager, Logs)              │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API / WebSocket
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend                         │
├─────────────────────────────────────────────────────────┤
│  API Layer (Routers)                                     │
│  ├── /api/workflows     - Workflow CRUD                 │
│  ├── /api/executions    - Execution history             │
│  ├── /api/triggers      - Trigger management            │
│  ├── /api/integrations  - Integration config            │
│  └── /api/health        - System health                 │
│                                                          │
│  Service Layer                                           │
│  ├── WorkflowEngine     - DAG execution & orchestration │
│  ├── ClassificationService - AI-powered routing         │
│  ├── TriggerManager     - Event detection & dispatch    │
│  ├── IntegrationManager - Third-party connectors        │
│  └── LoggingService     - Event streaming               │
│                                                          │
│  Core Components                                         │
│  ├── Database Layer     - SQLAlchemy ORM                │
│  ├── Authentication     - JWT tokens                     │
│  ├── Configuration      - Environment-based config       │
│  └── Error Handling     - Centralized exception mgmt     │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐   ┌──────────────────┐
│   PostgreSQL     │   │   Event Stream   │
│  - Workflows     │   │  - Execution logs│
│  - Executions    │   │  - Triggers      │
│  - Integrations  │   │  - Errors        │
└──────────────────┘   └──────────────────┘
```

## Core Entities

### 1. Workflow
Represents a business process as a directed acyclic graph (DAG) of steps.

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: Trigger[];
  status: "active" | "inactive" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "decision" | "integration";
  config: Record<string, any>;
  nextSteps: string[]; // IDs of next steps
  retryPolicy: RetryPolicy;
}
```

### 2. Trigger
Defines when and how a workflow is activated.

```typescript
interface Trigger {
  id: string;
  workflowId: string;
  type: "manual" | "api" | "schedule" | "webhook";
  config: Record<string, any>;
  active: boolean;
}
```

### 3. Execution
A single instance of a workflow run.

```typescript
interface Execution {
  id: string;
  workflowId: string;
  status: "running" | "success" | "failed" | "paused";
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  steps: ExecutionStep[];
  errors: Error[];
}

interface ExecutionStep {
  id: string;
  workflowStepId: string;
  status: "pending" | "running" | "success" | "failed";
  output: Record<string, any>;
  error?: string;
  executedAt: Date;
}
```

### 4. Integration
External service connection (Slack, CRM, Email, etc).

```typescript
interface Integration {
  id: string;
  name: string;
  type: "slack" | "email" | "webhook" | "crm";
  credentials: EncryptedCredentials;
  active: boolean;
}
```

## Workflow Engine

### Execution Model

1. **Trigger Detection**: System monitors for workflow triggers (API, schedule, webhook)
2. **Execution Creation**: New execution instance created with initial state
3. **Step Iteration**: Walk through DAG, executing each step sequentially
4. **Decision Logic**: Conditional steps determine next steps in graph
5. **Integration Calls**: Service steps invoke external APIs
6. **Error Handling**: Failures trigger retry logic with exponential backoff
7. **Completion**: Execution marked complete with success/failure status

### DAG Execution Algorithm

```python
def execute_workflow(workflow, execution, context):
    execution.status = "running"
    execution.startedAt = now()
    
    queue = [workflow.startStep]
    completed = set()
    
    while queue and execution.status == "running":
        step = queue.pop(0)
        
        if step.id in completed:
            continue
        
        try:
            # Execute with retries
            result = execute_step_with_retries(step, context)
            
            # Update execution log
            log_execution(step, result)
            
            # Evaluate conditional logic
            nextSteps = evaluate_conditions(step, result)
            queue.extend(nextSteps)
            
            completed.add(step.id)
        
        except Exception as e:
            if should_retry(step):
                queue.append(step)  # Retry
            else:
                execution.status = "failed"
                execution.errors.append(e)
                break
    
    execution.status = "success"
    execution.completedAt = now()
```

### Retry Policy

- **Max Retries**: Configurable per step (default: 3)
- **Backoff Strategy**: Exponential (1s, 2s, 4s, 8s...)
- **Jitter**: Random ±20% to prevent thundering herd
- **Dead Letter Queue**: Failed steps after max retries logged separately

## Classification Service

### AI-Powered Routing

The classification service uses an LLM to intelligently route workflows based on request content.

```
Request Input
    ↓
Feature Extraction (text embeddings, metadata)
    ↓
ML Model (classification or few-shot prompting)
    ↓
Confidence Scoring
    ↓
Route Decision (HIGH/MEDIUM/LOW)
    ↓
Assign Workflow
```

### Integration Points

- **Incoming Leads**: Classify lead quality from form submission
- **Support Tickets**: Determine urgency and assign to workflow
- **API Requests**: Route based on intent classification
- **Data Enrichment**: Smart field mapping based on content

## Integration Manager

### Pluggable Architecture

```python
class IntegrationProvider(ABC):
    @abstractmethod
    def authenticate(self, credentials):
        pass
    
    @abstractmethod
    def execute(self, action, params):
        pass
    
    @abstractmethod
    def validate_credentials(self):
        pass

class SlackProvider(IntegrationProvider):
    # Implementation
    pass

class CRMProvider(IntegrationProvider):
    # Implementation
    pass
```

### Available Integrations (Phase 1)

- **Slack**: Send messages, post updates
- **Email**: Send emails via SMTP
- **Webhooks**: Generic HTTP endpoints
- **CRM**: Salesforce/HubSpot lead updates

### Integration Lifecycle

1. **Configuration**: User adds API credentials
2. **Validation**: Test connection and permissions
3. **Encryption**: Store credentials securely in database
4. **Execution**: Call provider during workflow step
5. **Error Handling**: Retry with backoff, log failures
6. **Monitoring**: Track success rates per integration

## Frontend Architecture

### Component Hierarchy

```
App
├── Navigation
├── Sidebar
├── MainContent
│   ├── WorkflowDashboard
│   │   ├── WorkflowList
│   │   │   └── WorkflowCard
│   │   ├── WorkflowEditor
│   │   │   ├── StepBuilder
│   │   │   └── PreviewPanel
│   │   └── ExecutionHistory
│   │       └── ExecutionLog
│   ├── TriggerManager
│   ├── IntegrationCenter
│   └── Analytics
└── Footer
```

### State Management

- **Local State**: React hooks for component-level state
- **Global State**: Context API for workflow, execution, and UI state
- **API Caching**: React Query for server state
- **Real-time**: WebSocket for live execution logs

### Styling Strategy

- **Theme**: Dark mode with neon indigo accent (#6366F1)
- **Design System**: Tailwind CSS + custom components
- **Responsive**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,
    triggers JSONB NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Executions
CREATE TABLE executions (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    steps JSONB,
    errors JSONB,
    created_at TIMESTAMP
);

-- Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    credentials BYTEA, -- encrypted
    active BOOLEAN,
    created_at TIMESTAMP
);

-- Execution Logs
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY,
    execution_id UUID REFERENCES executions(id),
    step_id UUID,
    message TEXT,
    level VARCHAR(20), -- INFO, WARN, ERROR
    created_at TIMESTAMP
);
```

### Indexes

- `workflows.status` for filtering active workflows
- `executions.workflow_id` for execution history
- `executions.created_at` for time-based queries
- `execution_logs.execution_id` for log retrieval
- `execution_logs.created_at` for time-series data

## API Design

### RESTful Conventions

```
GET    /api/workflows              - List workflows
POST   /api/workflows              - Create workflow
GET    /api/workflows/{id}         - Get workflow
PUT    /api/workflows/{id}         - Update workflow
DELETE /api/workflows/{id}         - Delete workflow

GET    /api/workflows/{id}/executions    - Execution history
POST   /api/workflows/{id}/run           - Trigger execution
GET    /api/executions/{id}              - Get execution details
GET    /api/executions/{id}/logs         - Get execution logs
```

### WebSocket Endpoints

```
WS /api/ws/executions/{execution_id}
   - Real-time execution log streaming
   - Step completion notifications
   - Error alerts
```

## Error Handling

### Error Categories

1. **Validation Errors**: 400 Bad Request
2. **Authentication Errors**: 401 Unauthorized
3. **Authorization Errors**: 403 Forbidden
4. **Not Found**: 404
5. **Server Errors**: 500 Internal Server Error
6. **Service Errors**: 503 Service Unavailable

### Error Response Format

```json
{
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow with ID 'abc123' not found",
    "details": {
      "workflowId": "abc123"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_xyz789"
  }
}
```

## Security Considerations

1. **Input Validation**: Pydantic schemas validate all API inputs
2. **Credential Storage**: Encrypted at rest in database
3. **API Authentication**: JWT tokens with expiration
4. **CORS**: Restricted to known frontend origins
5. **Rate Limiting**: Per-user/IP to prevent abuse
6. **Audit Logging**: Track all workflow executions
7. **SQL Injection Prevention**: SQLAlchemy parameterized queries
8. **Secrets Management**: Environment variables for sensitive config

## Deployment Architecture

### Development
- Local React dev server (port 5173)
- Local FastAPI server (port 8000)
- SQLite or local PostgreSQL

### Production
- Docker containers for frontend and backend
- Kubernetes orchestration (optional)
- RDS for PostgreSQL
- CloudFront CDN for static assets
- CloudWatch for logging
- GitHub Actions for CI/CD

## Performance Optimization

1. **Frontend**:
   - Code splitting with Vite
   - Lazy loading for routes and components
   - Memoization for expensive computations
   - Virtual scrolling for large lists

2. **Backend**:
   - Connection pooling for database
   - Async I/O for non-blocking operations
   - Caching with Redis for frequently accessed data
   - Pagination for large result sets
   - Background jobs for long-running tasks

## Monitoring & Observability

- **Logging**: Structured JSON logs with timestamps
- **Metrics**: Prometheus metrics for key endpoints
- **Tracing**: Distributed tracing with OpenTelemetry
- **Dashboards**: Grafana dashboards for system health
- **Alerts**: PagerDuty for critical issues

## Future Enhancements

1. **Advanced Scheduling**: Cron-based workflow triggers
2. **Workflow Versioning**: Track changes and rollback
3. **Parallelization**: Execute independent steps in parallel
4. **Workflow Templates**: Pre-built workflow starter packs
5. **ML Integration**: More sophisticated classification models
6. **Multi-tenancy**: Support for multiple organizations
7. **Audit Trail**: Immutable execution history
8. **Visual Workflow Builder**: Drag-and-drop UI
