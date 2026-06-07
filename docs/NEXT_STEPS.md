# Getting Started - Development Handoff

Welcome! This document outlines the next steps for developing the AI Business Automation Dashboard. The project is scaffolded and ready for feature implementation.

## Quick Start (5 minutes)

### 1. Open the Workspace
Double-click this file on your desktop:
```
C:\Users\Trey\Desktop\ai-business-automation-dashboard.code-workspace
```

VS Code will open all three folders: Frontend, Backend, and Docs.

### 2. Start Backend
```bash
# Open Terminal → Select Backend folder
cd backend
source .venv\Scripts\Activate.ps1  # Windows PowerShell
python main.py
```
Backend runs at: `http://localhost:8000`
API Docs at: `http://localhost:8000/docs`

### 3. Start Frontend
```bash
# Open another Terminal → Select Frontend folder
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 4. Verify Setup
- Backend: Visit `http://localhost:8000/health` → should return `{"status": "healthy"}`
- Frontend: Visit `http://localhost:5173` → should show React template

**✓ Setup complete!** Now ready for development.

---

## Phase 1 MVP: What to Build First

The MVP focuses on **core workflow execution** and **dashboard visualization**. Build in this order:

### Step 1: Database Models (Backend)
**Goal**: Define data structures in SQLAlchemy

**Files to create**:
- `backend/models/workflow.py` - Workflow, WorkflowStep
- `backend/models/execution.py` - Execution, ExecutionStep, ExecutionLog

**Key entities**:
```python
# Workflow - represents a business process
class Workflow(Base):
    id: UUID
    name: str
    description: str
    steps: JSON  # List of steps
    triggers: JSON  # List of triggers
    status: str  # "active", "inactive"
    created_at: datetime
    updated_at: datetime

# Execution - instance of workflow run
class Execution(Base):
    id: UUID
    workflow_id: UUID (FK)
    status: str  # "running", "success", "failed"
    steps: JSON  # Execution results
    started_at: datetime
    completed_at: datetime
    duration: int (seconds)

# ExecutionLog - event log
class ExecutionLog(Base):
    id: UUID
    execution_id: UUID (FK)
    step_id: UUID
    message: str
    level: str  # "INFO", "WARN", "ERROR"
    created_at: datetime
```

**See**: [docs/ARCHITECTURE.md](ARCHITECTURE.md) - Database Schema section

---

### Step 2: Workflow Execution Engine (Backend)
**Goal**: Build logic to execute workflow DAGs

**Files to create**:
- `backend/services/workflow_engine.py` - Core execution logic

**Core functionality**:
```python
class WorkflowEngine:
    async def execute_workflow(self, workflow: Workflow, execution: Execution):
        """Execute workflow DAG sequentially"""
        # 1. Validate DAG structure
        # 2. Create execution record
        # 3. Process each step in order
        # 4. Pass outputs between steps
        # 5. Handle errors with retry logic
        # 6. Log all events
        # 7. Mark execution complete

    async def execute_step(self, step: WorkflowStep, context: dict) -> dict:
        """Execute single step with retries"""
        # Get step config (action type, parameters)
        # Execute based on type: "action", "decision", "integration"
        # Return output for next steps
```

**Logic flow**:
1. Input: workflow definition + execution context
2. Validate DAG (no cycles, required fields)
3. Execute steps sequentially
4. Use execution context to pass data between steps
5. On error: retry with exponential backoff (1s, 2s, 4s)
6. Log each step in ExecutionLog table
7. Return final execution with status

**Test with**:
```bash
# Create test workflow manually via API
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "steps": [
      {"id": "step1", "type": "action", "name": "Say Hello"}
    ]
  }'
```

---

### Step 3: REST API - Workflow Management (Backend)
**Goal**: Create CRUD endpoints for workflows

**Files to create**:
- `backend/routers/workflows.py` - Workflow endpoints
- `backend/schemas/workflow.py` - Pydantic request/response models

**Endpoints to implement**:
```
POST   /api/workflows              Create workflow
GET    /api/workflows              List all workflows
GET    /api/workflows/{id}         Get specific workflow
PUT    /api/workflows/{id}         Update workflow
DELETE /api/workflows/{id}         Delete workflow
```

**Example request**:
```json
{
  "name": "Lead Processing Pipeline",
  "description": "Classify and route incoming leads",
  "steps": [
    {
      "id": "classify",
      "name": "Classify Lead",
      "type": "action",
      "config": {"model": "ml-classifier"}
    },
    {
      "id": "route",
      "name": "Route to Sales",
      "type": "integration",
      "config": {"service": "slack", "channel": "#sales"}
    }
  ],
  "triggers": [
    {"type": "manual", "name": "Run Now"}
  ]
}
```

---

### Step 4: Trigger System - Run Workflows (Backend)
**Goal**: Enable manual and webhook execution

**Files to create**:
- `backend/routers/executions.py` - Execution endpoints
- `backend/services/trigger_manager.py` - Trigger handling

**Endpoints to implement**:
```
POST   /api/workflows/{id}/run         Trigger workflow execution
GET    /api/executions/{id}            Get execution details
GET    /api/executions/{id}/logs       Get execution logs
```

**Execute workflow**:
```bash
curl -X POST http://localhost:8000/api/workflows/abc123/run \
  -H "Content-Type: application/json" \
  -d '{"input_data": "value"}'

# Returns:
{
  "execution_id": "exec_xyz789",
  "status": "running",
  "started_at": "2024-01-15T10:30:00Z"
}
```

**Watch execution in real-time**:
```bash
curl http://localhost:8000/api/executions/exec_xyz789/logs
# Stream execution logs as they happen
```

---

### Step 5: Frontend - Dashboard Layout (React)
**Goal**: Create basic layout and navigation

**Files to create**:
- `frontend/src/components/Sidebar.tsx` - Left navigation
- `frontend/src/components/Header.tsx` - Top bar
- `frontend/src/layouts/MainLayout.tsx` - Main layout wrapper
- `frontend/src/pages/DashboardPage.tsx` - Main dashboard page

**Navigation items**:
- Workflows
- Executions
- Logs
- Integrations
- Analytics

**Color scheme** (neon indigo):
- Background: #0B1020 (deep navy)
- Primary: #6366F1 (indigo)
- Accent: #22D3EE (cyan)
- Success: #34D399 (green)
- Danger: #F87171 (red)

---

### Step 6: Frontend - Workflow List (React)
**Goal**: Display workflows from API

**Files to create**:
- `frontend/src/pages/WorkflowsPage.tsx` - Main page
- `frontend/src/components/WorkflowList.tsx` - Workflow listing
- `frontend/src/components/WorkflowCard.tsx` - Card component
- `frontend/src/hooks/useWorkflows.ts` - API hook
- `frontend/src/services/api.ts` - API client

**Features**:
- Fetch workflows from `GET /api/workflows`
- Display in card grid
- Show name, description, status
- "Run" button for each workflow
- Search/filter by name or status
- Create new workflow button

**Example card**:
```
┌────────────────────────────────┐
│ Lead Processing Pipeline       │
│ Classify and route leads       │
│ Status: ● Active               │
│ Last run: 2 hours ago          │
│ Success rate: 98%              │
│                                │
│ [ Run ] [ Edit ] [ Delete ]    │
└────────────────────────────────┘
```

---

### Step 7: Frontend - Execution Dashboard (React)
**Goal**: Show live execution status and logs

**Files to create**:
- `frontend/src/pages/ExecutionPage.tsx` - Execution details
- `frontend/src/components/ExecutionLog.tsx` - Log display
- `frontend/src/components/ExecutionTimeline.tsx` - Step timeline
- `frontend/src/hooks/useExecution.ts` - Execution API hook

**Features**:
- Fetch execution from `GET /api/executions/{id}`
- Display step-by-step timeline
- Real-time log streaming (poll API or WebSocket)
- Show step status (pending, running, success, failed)
- Duration for each step
- Error messages if failed
- Auto-scroll logs as they update

**Layout**:
```
┌─────────────────────────────────────────┐
│ Execution: exec_xyz789                  │
│ Status: Running                         │
│ Started: 10:30 AM  Duration: 2m 15s     │
├─────────────────────────────────────────┤
│ Timeline:                               │
│ ✓ Step 1: Classify   (0.5s)            │
│ ⟳ Step 2: Enrich     (1m 30s)          │
│ ○ Step 3: Notify     (waiting)         │
├─────────────────────────────────────────┤
│ Live Logs:                              │
│ > Classifying request...                │
│ > Classification: HIGH_INTENT           │
│ > Calling enrichment API...             │
│ > Waiting for CRM response...           │
└─────────────────────────────────────────┘
```

---

### Step 8: Testing & Documentation
**Goal**: Ensure code quality and user guidance

**Tasks**:
- Write unit tests for WorkflowEngine
- Write API integration tests
- Write React component tests
- Update README with setup instructions
- Create API documentation (Swagger)
- Test manually: create workflow → run → watch logs

**Run tests**:
```bash
# Backend
cd backend
pytest
pytest --cov  # with coverage

# Frontend
cd frontend
npm run test
npm run type-check
```

---

## Implementation Checklist

### ✓ Done
- [x] Project scaffolding
- [x] Frontend setup (React + TypeScript + Vite)
- [x] Backend setup (FastAPI + Python venv)
- [x] GitHub repository created
- [x] VS Code workspace configured
- [x] Documentation scaffolded

### → Now Start
- [ ] Database models (SQLAlchemy)
- [ ] Workflow execution engine
- [ ] REST API endpoints
- [ ] Trigger/execution system
- [ ] Backend tests
- [ ] Frontend layout
- [ ] Workflow list UI
- [ ] Execution dashboard
- [ ] Frontend tests
- [ ] Comprehensive documentation

---

## Key Technologies & Patterns

### Backend
- **FastAPI**: Modern async Python framework
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and serialization
- **AsyncIO**: Non-blocking operations

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Fast build and dev server
- **TailwindCSS**: Utility-first CSS
- **React Router**: Client-side routing
- **React Query** (optional): Server state management

### Architecture
- **REST API**: Standard HTTP endpoints
- **JSON**: Data serialization
- **Database**: PostgreSQL (or SQLite for dev)
- **Real-time**: Polling (poll API) or WebSockets (future)

---

## Common Tasks

### Add a new API endpoint
```python
# backend/routers/workflows.py
from fastapi import APIRouter, HTTPException
from backend.schemas.workflow import WorkflowCreate, WorkflowResponse

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate):
    # Create and return workflow
    pass
```

### Add a new React component
```tsx
// frontend/src/components/MyComponent.tsx
import { useState } from 'react';

export const MyComponent = () => {
  return (
    <div className="bg-indigo-600 text-white p-4 rounded">
      My Component
    </div>
  );
};
```

### Call API from React
```tsx
// frontend/src/hooks/useWorkflows.ts
import { useState, useEffect } from 'react';

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(data => setWorkflows(data))
      .finally(() => setLoading(false));
  }, []);

  return { workflows, loading };
};
```

---

## Debugging Tips

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs

# Check database
# Inspect database file or connection

# View logs
python -m logging
```

### Frontend Issues
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# View in browser console
F12 → Console tab
```

### Git Issues
```bash
# Check remote
git remote -v

# View recent commits
git log --oneline -10

# Create feature branch
git checkout -b feature/my-feature
```

---

## Next Meeting Agenda

When you're ready to discuss progress:

1. **Completed**: What was built and tested?
2. **Current Issues**: Any blockers or problems?
3. **Next Priority**: What to build next?
4. **Timeline**: Are we on track for MVP?

---

## Resources

- **API Design**: [REST Best Practices](https://restfulapi.net/)
- **React Patterns**: [React Hooks Docs](https://react.dev/reference/react/hooks)
- **Database**: See [ARCHITECTURE.md](ARCHITECTURE.md) - Database Schema
- **Features**: See [FEATURES.md](FEATURES.md) for complete feature list
- **Roadmap**: See [ROADMAP.md](ROADMAP.md) for phases and timeline

---

## Questions?

Refer to:
1. **ARCHITECTURE.md** - System design and database schema
2. **FEATURES.md** - Detailed feature specifications
3. **ROADMAP.md** - Development timeline and phases

For implementation details, check inline code comments or create GitHub issues.

Good luck! 🚀
