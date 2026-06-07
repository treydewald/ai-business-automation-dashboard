# UI SYSTEM SPECIFICATION
## AI Business Automation Dashboard
**Version 1.0** | **Status: Ready for Implementation**

---

## 1. PRODUCT SUMMARY

### What This UI Represents
A production-grade workflow automation control center that enables operators to configure, execute, monitor, and analyze business process automation pipelines in real-time.

### Who It Is For
- **Primary**: Operations engineers, automation specialists, business process analysts
- **Secondary**: Non-technical business users (read-only monitoring mode)
- **Stakeholders**: Team leads reviewing automation metrics and performance

### Primary Interaction Goal
Enable users to:
1. **Quickly launch** a workflow from a curated list
2. **Watch execution** unfold with live step-by-step feedback
3. **Understand performance** through glanceable KPI cards and execution logs
4. **Manage workflows** (create, edit, trigger, debug) without backend API knowledge

---

## 2. VISUAL DESIGN SYSTEM

### Theme
**"Neon Indigo Ops System"** — A high-contrast, glassmorphic dark ops control room aesthetic with live-feedback visual language.

### Color Palette

| Semantic | Hex | Usage | Notes |
|----------|-----|-------|-------|
| **Background (Primary)** | `#0B1020` | Canvas, page background | Deep navy, zero reflectivity |
| **Surface (Glass)** | `rgba(20, 30, 60, 0.6)` | Panels, cards, modals | 60% opacity + backdrop blur |
| **Surface Hover** | `rgba(20, 30, 60, 0.8)` | Interactive surfaces | Slight brightening on hover |
| **Primary Brand** | `#6366F1` | Buttons, links, focus states | Indigo — trustworthy automation |
| **Accent (Glow)** | `#22D3EE` | Active indicators, live pulses | Cyan — signals "live/active" |
| **Success** | `#34D399` | Checkmarks, completion states | Emerald green |
| **Warning** | `#FBBF24` | Pending, in-progress states | Amber |
| **Danger** | `#F87171` | Failed, error states | Red |
| **Neutral Gray** | `#A0AEC0` | Disabled states, secondary text | Slate-300 |
| **Text Primary** | `#F8FAFC` | Headers, body text | Slate-50 (near white) |
| **Text Secondary** | `#CBD5E1` | Sublabels, timestamps | Slate-300 |
| **Divider** | `rgba(100, 116, 139, 0.3)` | Lines, separators | Subtle slate with transparency |
| **Grid Background** | `rgba(99, 102, 241, 0.03)` | Subtle background pattern | Very faint indigo grid |

### Typography

| Role | Font | Weight | Size | Line Height | Usage |
|------|------|--------|------|------------|-------|
| **Display (Hero)** | Inter | 700 | 32px | 1.2 | Page titles (e.g., "Automation Control Center") |
| **Heading 1** | Inter | 600 | 24px | 1.3 | Section headers (e.g., "Workflows", "Analytics") |
| **Heading 2** | Inter | 600 | 18px | 1.3 | Card titles, workflow names |
| **Body** | Inter | 400 | 14px | 1.5 | Main copy, log entries (text), descriptions |
| **Body Small** | Inter | 400 | 12px | 1.5 | Metadata, timestamps, secondary info |
| **Monospace** | JetBrains Mono | 400 | 12px | 1.6 | Execution logs, raw API output, code |
| **Button Label** | Inter | 600 | 13px | 1.2 | CTA buttons |
| **Badge** | Inter | 500 | 11px | 1.2 | Status pills, tags |

### Component Style Rules

#### Glassmorphism
- **Surface panels**: `rgba(20, 30, 60, 0.6)` + `backdrop-filter: blur(20px)`
- **Border**: `1px solid rgba(99, 102, 241, 0.2)` (indigo border, low opacity)
- **Elevation**: No shadow; border + transparency creates depth

#### Spacing
- **Base unit**: 4px
- **Common**: 8px, 12px, 16px, 24px, 32px, 48px
- **Panel padding**: 24px
- **Component gap**: 12px (vertical), 16px (horizontal)

#### Borders
- **Radius**: 
  - Panels/cards: 12px
  - Buttons/inputs: 8px
  - Status indicators: Full circle (50%)
- **Width**: 1px on all glassmorphic surfaces

#### Glow Rules
- **Active indicator**: `box-shadow: 0 0 12px rgba(34, 211, 238, 0.5)` (cyan glow)
- **Primary button hover**: `box-shadow: 0 0 16px rgba(99, 102, 241, 0.4)` (indigo glow)
- **Live pulse**: Cyan indicator with `animation: pulse 2s infinite`
- **Danger state**: `box-shadow: 0 0 12px rgba(248, 113, 113, 0.4)` (red glow)

#### Interactions
- **Hover**: 5% opacity increase on surface
- **Active/Pressed**: Border color brightens to `rgba(99, 102, 241, 0.4)`
- **Disabled**: Opacity 50%, cursor not-allowed
- **Focus**: Cyan outline, `2px solid #22D3EE`

---

## 3. LAYOUT ARCHITECTURE

### Global Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOPBAR (Header)                              │
│  Logo / Brand  |  Page Title  |  [User Profile / Help / Settings]   │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                       │
│   SIDEBAR    │          MAIN WORKSPACE                              │
│   (180px)    │        (flex, auto-width)                            │
│              │                                                       │
│ • Workflows  │  ┌─────────────────────────────────────────────┐    │
│ • Triggers   │  │ Workflow Details / List / Graph View        │    │
│ • Logs       │  │                                              │    │
│ • Integrns   │  │  [Execution Status / Step Flow / Control]    │    │
│ • Analytics  │  │                                              │    │
│ • Settings   │  │                                              │    │
│              │  └─────────────────────────────────────────────┘    │
│              │                                                       │
│              │  ┌─────────────────────────────────────────────┐    │
│              │  │ Execution Log / Metrics Panel              │    │
│              │  │ (live-updating stream)                      │    │
│              │  └─────────────────────────────────────────────┘    │
│              │                                                       │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Sidebar (Fixed, 180px)
- **Purpose**: Primary navigation + workflow quick-access
- **Sections**:
  - **Brand Area**: Logo + "AutoFlow" text (top 60px)
  - **Navigation Menu**: Icon + label pairs (Workflows, Triggers, Logs, Integrations, Analytics, Settings)
  - **Workflow Quick-List**: Favorite/recent workflows (collapsible, max 5 visible)
  - **Footer**: User profile + logout
- **Behavior**: Fixed, does not scroll with main content
- **Active State**: Highlighted navigation item + left border accent (cyan)

### Topbar (Fixed, 60px)
- **Left**: Logo (if not in sidebar) or breadcrumb (Home > Workflows > Lead Pipeline)
- **Center**: Page title (e.g., "Automation Control Center")
- **Right**: 
  - Search input (quick workflow search)
  - Notification bell (unread execution alerts)
  - User profile dropdown
- **Behavior**: Fixed, sticky, visible at all times

### Main Workspace (Flex container, fills remaining width)
- **Three-panel layout**:
  1. **Workflow Details Panel** (70% width, left-aligned)
  2. **Metrics / Control Panel** (optional, collapsible, 25% width, right-aligned)
  3. **Execution Log Stream** (100% width below, ~35% height)
- **Responsive**: On mobile, panels stack vertically

### Left Panel: Workflow Details
- **Content**: 
  - Workflow name + description
  - Step flow visualization (DAG or linear list)
  - Last run timestamp + status
  - Trigger configuration (API / Manual / Scheduled)
- **Height**: Flexible, min 300px

### Center Workspace
- **Primary focal point**: Current workflow details OR step-by-step execution view
- **Scrollable**: Yes (if workflow is long)

### Right Panel: Metrics & Controls
- **Content**:
  - KPI cards (Runs Today, Success Rate, Avg Duration)
  - Control buttons (Run Now, Edit, Create New, View History)
  - Alerts / notifications feed
- **Behavior**: Collapsible (hamburger toggle on mobile)

### Execution Log Stream (Bottom, ~35% height)
- **Purpose**: Real-time, scrolling log of workflow execution steps
- **Behavior**: 
  - Auto-scrolls to latest on new entries
  - Monospace font for readability
  - Color-coded by log level (ERROR = red, WARN = amber, INFO = cyan, DEBUG = gray)
- **Interaction**: Click to expand log entry, copy to clipboard

---

## 4. COMPONENT SYSTEM

### 4.1 SidebarNav
**Purpose**: Primary navigation entry point for all dashboard sections

**State Behavior**:
- `active`: Current section is highlighted (cyan left border, bright text)
- `hover`: Background brightens slightly
- `disabled`: Grayed out, not interactive

**Props/Data Shape**:
```json
{
  "items": [
    {
      "id": "workflows",
      "label": "Workflows",
      "icon": "GitBranch",
      "href": "/workflows",
      "active": true,
      "badge": "12"
    }
  ]
}
```

### 4.2 WorkflowList
**Purpose**: Displays all available workflows in a table or card grid with quick-action buttons

**State Behavior**:
- `loading`: Skeleton cards or spinner
- `empty`: Empty state message + "Create Workflow" CTA
- `error`: Error banner with retry button
- `normal`: Full list with search/filter results

**Props/Data Shape**:
```json
{
  "workflows": [
    {
      "id": "wf-lead-intake",
      "name": "Lead Intake Pipeline",
      "description": "Processes incoming leads and enriches data",
      "status": "active",
      "lastRun": "2026-06-07T14:23:00Z",
      "lastStatus": "success",
      "totalRuns": 142,
      "successRate": 0.98,
      "triggers": ["api", "schedule"]
    }
  ],
  "sortBy": "lastRun",
  "filterStatus": "active"
}
```

### 4.3 WorkflowGraphView
**Purpose**: Visual DAG (directed acyclic graph) representation of workflow steps and connections

**State Behavior**:
- `idle`: Grayed out nodes
- `running`: Highlighted current step with cyan glow, other steps in gray
- `completed`: All nodes green with checkmarks
- `error`: Highlighted error node in red

**Props/Data Shape**:
```json
{
  "nodes": [
    {
      "id": "step-1",
      "label": "Receive Lead",
      "status": "completed",
      "duration": 1200
    },
    {
      "id": "step-2",
      "label": "Classify Intent",
      "status": "running",
      "duration": 450
    }
  ],
  "edges": [
    { "from": "step-1", "to": "step-2" },
    { "from": "step-2", "to": "step-3" }
  ]
}
```

### 4.4 ExecutionLogStream
**Purpose**: Real-time, scrollable log of workflow execution events

**State Behavior**:
- `loading`: Shows placeholder rows, spinner at bottom
- `streaming`: Auto-scrolls to latest, new entries fade in
- `paused`: User has scrolled up; new entries accumulate but don't auto-scroll
- `error`: Error message + retry button

**Props/Data Shape**:
```json
{
  "logs": [
    {
      "id": "log-001",
      "timestamp": "2026-06-07T14:23:12Z",
      "level": "info",
      "message": "Lead received from API: john@example.com",
      "source": "webhook-handler",
      "metadata": { "leadId": "lead-456" }
    },
    {
      "id": "log-002",
      "timestamp": "2026-06-07T14:23:13Z",
      "level": "success",
      "message": "Classification: HIGH_INTENT (confidence: 0.94)",
      "source": "classifier-service"
    }
  ],
  "isLive": true,
  "isPaused": false
}
```

### 4.5 StatusIndicator
**Purpose**: Displays current workflow or step status with glowing visual

**State Behavior**:
- `idle`: Gray circle, no glow
- `pending`: Amber circle, subtle pulse
- `running`: Cyan circle, strong glow + pulse animation
- `success`: Green checkmark circle, steady glow
- `error`: Red X circle, red glow + pulse
- `skipped`: Gray circle, striped fill

**Props/Data Shape**:
```json
{
  "status": "running",
  "label": "Running",
  "size": "lg",
  "showPulse": true,
  "tooltip": "Step 2 of 5 in progress"
}
```

### 4.6 KPIStatsCards
**Purpose**: Summary metrics for workflow performance and health

**State Behavior**:
- `loading`: Skeleton or shimmer effect
- `loaded`: Full data displayed with trend indicators
- `error`: "N/A" placeholder

**Props/Data Shape**:
```json
{
  "cards": [
    {
      "id": "runs-today",
      "label": "Runs Today",
      "value": "142",
      "trend": "+23%",
      "trendDirection": "up",
      "icon": "Zap"
    },
    {
      "id": "success-rate",
      "label": "Success Rate",
      "value": "98%",
      "trend": "+2%",
      "trendDirection": "up",
      "icon": "CheckCircle"
    },
    {
      "id": "avg-duration",
      "label": "Avg Duration",
      "value": "4.2s",
      "trend": "-0.5s",
      "trendDirection": "down",
      "icon": "Clock"
    }
  ]
}
```

### 4.7 ControlButtons
**Purpose**: Primary CTAs for workflow interaction (Run, Edit, Create, View History)

**State Behavior**:
- `default`: Indigo background, cyan glow on hover
- `loading`: Spinner replaces icon, disabled interaction
- `success`: Green checkmark + brief toast confirmation
- `error`: Red glow + error message
- `disabled`: Grayed out, tooltip explains why

**Props/Data Shape**:
```json
{
  "buttons": [
    {
      "id": "btn-run",
      "label": "Run Now",
      "icon": "Play",
      "variant": "primary",
      "state": "default",
      "onClick": "runWorkflow('wf-lead-intake')"
    },
    {
      "id": "btn-edit",
      "label": "Edit",
      "icon": "Edit2",
      "variant": "secondary",
      "state": "default"
    }
  ]
}
```

### 4.8 WorkflowDetailsCard
**Purpose**: Hero card showing current workflow metadata and quick stats

**State Behavior**:
- `idle`: Summary view
- `expanded`: Full details view with configuration
- `executing`: Highlight current step, show live progress

**Props/Data Shape**:
```json
{
  "id": "wf-lead-intake",
  "name": "Lead Intake Pipeline",
  "description": "Automates lead capture, classification, and routing",
  "status": "running",
  "currentStep": 2,
  "totalSteps": 5,
  "createdAt": "2026-05-01T00:00:00Z",
  "updatedAt": "2026-06-07T14:00:00Z",
  "triggers": [
    { "type": "api", "path": "/webhooks/leads" },
    { "type": "schedule", "cron": "0 9 * * *" }
  ],
  "owner": "ops-team"
}
```

---

## 5. DATA MODEL (Frontend Mock Layer)

### 5.1 Workflow Entity
```json
{
  "id": "wf-lead-intake",
  "name": "Lead Intake Pipeline",
  "description": "Processes incoming leads through classification and routing",
  "status": "active",
  "createdAt": "2026-05-01T00:00:00Z",
  "updatedAt": "2026-06-07T14:00:00Z",
  "owner": "ops-team@company.com",
  "tags": ["leads", "crm", "automation"],
  "config": {
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2
    },
    "timeout": 30000,
    "notifications": {
      "onSuccess": true,
      "onFailure": true,
      "channels": ["slack", "email"]
    }
  },
  "triggers": [
    {
      "id": "trigger-api",
      "type": "api",
      "path": "/webhooks/leads",
      "method": "POST"
    },
    {
      "id": "trigger-schedule",
      "type": "schedule",
      "cron": "0 9 * * *",
      "timezone": "America/New_York"
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "name": "Receive Lead",
      "type": "webhook",
      "config": {}
    },
    {
      "id": "step-2",
      "name": "Classify Intent",
      "type": "integration",
      "config": { "service": "ai-classifier" }
    },
    {
      "id": "step-3",
      "name": "Enrich Data",
      "type": "integration",
      "config": { "service": "crm-enrich" }
    },
    {
      "id": "step-4",
      "name": "Route to Team",
      "type": "conditional",
      "config": { "conditions": [] }
    },
    {
      "id": "step-5",
      "name": "Send Notification",
      "type": "notification",
      "config": { "channels": ["slack"] }
    }
  ],
  "metrics": {
    "totalRuns": 142,
    "successCount": 139,
    "failureCount": 3,
    "skipCount": 0,
    "lastRun": "2026-06-07T14:23:00Z",
    "lastRunStatus": "success",
    "successRate": 0.98,
    "avgDuration": 4200,
    "medianDuration": 3900
  }
}
```

### 5.2 Execution Entity
```json
{
  "id": "exec-lead-intake-20260607-142300",
  "workflowId": "wf-lead-intake",
  "status": "running",
  "startTime": "2026-06-07T14:23:00Z",
  "endTime": null,
  "duration": null,
  "trigger": {
    "type": "api",
    "source": "192.168.1.100"
  },
  "input": {
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "name": "John Doe"
  },
  "stepExecutions": [
    {
      "stepId": "step-1",
      "stepName": "Receive Lead",
      "status": "completed",
      "startTime": "2026-06-07T14:23:00Z",
      "endTime": "2026-06-07T14:23:01Z",
      "duration": 1200,
      "output": {
        "leadId": "lead-456",
        "timestamp": "2026-06-07T14:23:00Z"
      }
    },
    {
      "stepId": "step-2",
      "stepName": "Classify Intent",
      "status": "running",
      "startTime": "2026-06-07T14:23:02Z",
      "endTime": null,
      "duration": null,
      "output": null
    }
  ],
  "logs": [
    {
      "id": "log-001",
      "timestamp": "2026-06-07T14:23:00Z",
      "level": "info",
      "message": "Execution started",
      "source": "engine"
    }
  ],
  "output": null,
  "error": null
}
```

### 5.3 ExecutionLog Entity
```json
{
  "id": "log-001",
  "executionId": "exec-lead-intake-20260607-142300",
  "timestamp": "2026-06-07T14:23:12Z",
  "level": "info",
  "source": "webhook-handler",
  "message": "Lead received from API endpoint",
  "metadata": {
    "leadId": "lead-456",
    "email": "john@example.com",
    "statusCode": 200
  }
}
```

### 5.4 Analytics/Metrics Entity
```json
{
  "id": "metrics-wf-lead-intake-20260607",
  "workflowId": "wf-lead-intake",
  "date": "2026-06-07",
  "runsToday": 142,
  "successCount": 139,
  "failureCount": 3,
  "skipCount": 0,
  "successRate": 0.98,
  "avgDuration": 4200,
  "medianDuration": 3900,
  "p95Duration": 8100,
  "p99Duration": 12400,
  "topErrors": [
    {
      "error": "Integration timeout",
      "count": 2
    },
    {
      "error": "Invalid input format",
      "count": 1
    }
  ],
  "topSteps": [
    {
      "stepName": "Classify Intent",
      "avgDuration": 1400
    },
    {
      "stepName": "Enrich Data",
      "avgDuration": 1200
    }
  ]
}
```

---

## 6. INTERACTION FLOWS

### 6.1 **Create Workflow**
**Goal**: User creates a new workflow from scratch

**Steps**:
1. User clicks "Create New Workflow" button (right panel)
2. Modal opens with:
   - Workflow name input (required)
   - Description textarea (optional)
   - Select initial trigger type (API / Schedule / Manual)
3. User fills form and clicks "Next"
4. Step builder modal opens:
   - Visual canvas with drag-drop step blocks
   - Available step types: Webhook, Integration, Condition, Notification, Custom
5. User builds step flow (e.g., Receive → Classify → Route → Notify)
6. User clicks "Save & Deploy"
7. Success toast: "Workflow 'Lead Intake' created and active"
8. Navigate to workflow details page

**Error States**:
- Duplicate workflow name: "This name already exists"
- Missing required steps: "Workflow must have at least 2 steps"
- Invalid trigger config: "Schedule format invalid (cron)"

---

### 6.2 **Run Workflow**
**Goal**: User manually triggers a workflow execution

**Steps**:
1. User navigates to workflow details page
2. User clicks "Run Now" button (right panel, primary)
3. Button enters `loading` state with spinner
4. If workflow requires input:
   - Modal opens with form (e.g., email, lead data)
   - User fills form and clicks "Execute"
5. Execution starts:
   - WorkflowGraphView enters `running` state
   - Step nodes highlight in order of execution
   - ExecutionLogStream shows real-time log entries
   - ControlButtons disabled until execution completes
6. Execution completes (success/failure):
   - WorkflowGraphView shows final status (all nodes green or error node red)
   - Final log entry: "Execution completed: SUCCESS"
   - KPI cards update (Runs Today incremented, Success Rate recalculated)
   - Toast notification: "Lead Intake completed successfully in 4.2s"
7. User can view full execution history or run again

**Error States**:
- API error during execution: Red error node, log shows "ERROR: API call failed"
- Timeout: Red error node, log shows "ERROR: Step timeout after 30s"
- Validation error: Modal re-appears with validation messages

---

### 6.3 **Live Execution Updates**
**Goal**: User watches workflow execute in real-time

**Mechanics**:
- ExecutionLogStream receives SSE (Server-Sent Events) or WebSocket updates
- Each log entry appends to stream with fade-in animation
- WorkflowGraphView updates node status as each step progresses:
  - Completed: Green checkmark
  - Running: Cyan glow + current step label highlight
  - Pending: Gray, no glow
  - Failed: Red X
- Duration counters update for current step
- If user scrolls up in log, auto-scroll pauses; new entries accumulate
- If user scrolls to bottom, auto-scroll resumes

**Real-Time Data Model** (streamed):
```json
{
  "type": "log_entry",
  "executionId": "exec-123",
  "data": {
    "id": "log-001",
    "timestamp": "2026-06-07T14:23:12Z",
    "level": "info",
    "message": "Lead received",
    "stepId": "step-1"
  }
}
```

---

### 6.4 **Log Streaming**
**Goal**: User monitors execution logs in real-time with filtering/search

**Mechanics**:
- ExecutionLogStream shows continuous log feed
- Default sort: Newest first (reverse chronological)
- Log level color-coding:
  - INFO: Cyan text
  - SUCCESS: Green text
  - WARN: Amber text
  - ERROR: Red text
  - DEBUG: Gray text (hidden by default, toggle to show)
- User actions:
  - Click log entry to expand details (metadata, full message)
  - Click copy icon to copy log line to clipboard
  - Search input: Filter logs by keyword
  - Log level filter: Toggles (Info, Success, Warn, Error, Debug)
- Pagination: Load previous logs on scroll-up (lazy load)

---

### 6.5 **Error Handling Behavior**
**Goal**: User understands what went wrong and how to recover

**Error Scenarios**:

| Scenario | User Sees | Actions Available |
|----------|-----------|-------------------|
| Step timeout | Red error node in graph, red log entries | View error details, retry step, view logs, contact support |
| API integration failure | Red error node, "Integration timeout" log | Check integration config, test connection, view logs |
| Invalid input | Modal with validation errors | Fix input, retry execution |
| Workflow not found | Empty state with 404 message | Go back to workflow list, create new |
| Permission denied | Modal: "You don't have permission" | Request access, contact admin |
| Network error | Toast: "Connection lost" + retry button | Retry, check connection |

**Recovery Flows**:
- Most errors show a "Retry" button in the log or error modal
- User can edit workflow config and re-run
- User can view execution history to compare past runs

---

## 7. SCREENSHOT COMPOSITION STRATEGY

### **Primary Screenshot: Full Dashboard in Motion**

**Goal**: Communicate "I build real-time workflow automation systems"

**Focal Element** (center of visual attention):
- **WorkflowGraphView** showing:
  - 5-step workflow: Receive Lead → Classify Intent → Enrich Data → Route → Notify
  - Current step (Classify Intent) highlighted in cyan with glow
  - Completed steps (Receive) in green with checkmarks
  - Pending steps (Enrich, Route, Notify) in gray
  - Clear labels on each node
  - Connecting lines between nodes

**Supporting Elements** (visible in same frame):

1. **Left Sidebar** (must be visible):
   - "Workflows" menu item highlighted
   - Workflow quick-list showing 3-4 workflows
   - Company logo at top
   - User profile at bottom

2. **Right Panel** (KPIs + Controls):
   - KPI cards: 
     - "Runs Today: 142"
     - "Success Rate: 98%"
     - "Avg Duration: 4.2s"
   - Control buttons: "Run Now", "Edit", "View History" (at least "Run Now" visible and glowing)

3. **Top Bar**:
   - Page title: "Lead Intake Pipeline"
   - Status indicator: Green checkmark + "Active"
   - Breadcrumb or subtitle

4. **Execution Log Stream** (bottom third):
   - 4-5 visible log entries showing:
     - ✓ "Lead received from API: john@example.com" (info, cyan)
     - ✓ "Classification: HIGH_INTENT (confidence: 0.94)" (success, green)
     - ▶ "Enriching with CRM data..." (info, cyan, indicating in-progress)
     - Timestamps on each line
     - Monospace font for authenticity

**Visual Hierarchy**:
- Cyan glow on "Classify Intent" node draws eye first
- KPI numbers are glanceable (large, bright)
- Log stream shows "automation is happening now"
- Sidebar nav establishes navigation context
- Color palette (indigo + cyan + dark navy) is consistent and "ops-y"

**What's NOT visible** (off-screen but implied):
- Backend code, API details
- Complex configuration panels
- Detailed error states (show success case)
- Mobile view

**Dimensions**:
- Recommend: 1440px × 900px (16:10 aspect, dashboard standard)
- Sidebar: 180px
- Main area: ~1260px
- Graph: 600px wide × 300px tall (center)
- Log stream: 600px wide × 250px tall (bottom)
- Right panel: 300px wide

**Rendering Quality**:
- High contrast text (white on navy) for readability
- Glow effects subtle but visible (shadow, not bloom)
- Grid background subtle (very faint indigo tint)
- Smooth corners on all UI elements
- Icons: Line-style (Lucide / Feather, 20-24px)

---

## 8. IMPLEMENTATION CHECKLIST

**Ready for downstream build**:
- [x] Visual design system fully specified (colors, typography, spacing)
- [x] Layout architecture with exact dimensions and regions
- [x] Component system with state behavior and data shapes
- [x] Frontend mock data model (JSON structures for workflows, executions, logs, metrics)
- [x] Interaction flows with step-by-step user journeys
- [x] Error handling scenarios and recovery flows
- [x] Screenshot composition strategy with focal point and supporting elements

**Next Phase**: Implement using React + TypeScript with these specs as source of truth.

---

**Document Status**: ✅ Complete | **Ready for Dev**: Yes | **Last Updated**: 2026-06-07
