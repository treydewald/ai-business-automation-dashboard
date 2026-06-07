# FRONTEND IMPLEMENTATION PLAN
## AI Business Automation Dashboard
**React + TypeScript | Mock-Driven | Screenshot-Ready**

---

## IMPLEMENTATION OVERVIEW

### Build Phases
- **Phase 1 (Tier 1-2)**: Foundation + Layout System (Days 1-2)
- **Phase 2 (Tier 3)**: Content Components + Mock Data (Days 3-4)
- **Phase 3 (Tier 4)**: Interactivity + Live Updates (Days 5-6)
- **Phase 4 (Tier 5)**: Polish + Screenshot Optimization (Days 7)

### Key Constraints
- All data is mocked (no backend API calls in Phase 1-2)
- Responsive design with mobile fallback (stack vertically)
- Screenshot optimization: Hero frame must show graph + logs + KPIs simultaneously
- WebSocket simulation for real-time log streaming

---

## FEATURE BREAKDOWN

---

## FEATURE 01: Design System & Theme Provider

**Tier**: Foundation (Phase 1)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: None
- **Priority**: CRITICAL (blocks all other features)

**Description**:
Establish the neon indigo ops aesthetic by implementing a centralized theme provider with all color tokens, typography scales, spacing system, and CSS variables for consistent styling across all components.

**Requirements**:
- Color palette as CSS variables (primary, accent, success, danger, text, background)
- Typography system (Display, H1, H2, Body, Small, Monospace)
- Spacing scale (4px base unit: 4, 8, 12, 16, 24, 32, 48, 64)
- Glassmorphism utility classes (blur, backdrop color, border opacity)
- Glow animation keyframes (pulse, glow for status indicators)
- Dark background as default

**Inputs**:
- UI System Specification color palette
- Typography rules from spec

**Outputs**:
- `theme.ts` (TypeScript constants)
- `theme.css` (CSS variables + global styles + animations)
- `ThemeProvider` wrapper component

**Components**:
- React Context: `ThemeContext` (provides theme to all children)
- Utility hooks: `useTheme()` (access theme in components)
- CSS file: Global resets, base typography, animation definitions

**Dependencies**:
- None

**Success Criteria**:
- [ ] All colors accessible via CSS variables (e.g., `var(--color-primary)`)
- [ ] Typography scale matches spec (Display 32px, H1 24px, Body 14px, Monospace 12px)
- [ ] Spacing scale testable (margin/padding utilities work correctly)
- [ ] Glassmorphism styles render with 60% opacity + 20px blur
- [ ] Glow animation is smooth (60fps), no jank
- [ ] Theme persists across page reload (if theme toggle added later)

---

## FEATURE 02: Global App Shell & Layout System

**Tier**: Foundation (Phase 1)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: Feature 01 (Design System)
- **Priority**: CRITICAL

**Description**:
Build the fixed outer structure of the dashboard: topbar, sidebar, main canvas, and execution log stream. This is the frame that all content components fit into.

**Requirements**:
- Sidebar: 180px fixed, left-aligned, dark background
- Topbar: 60px fixed, top-aligned, dark background
- Main workspace: Flex container, fills remaining space, column layout
- Execution log stream: 35% height at bottom, scrollable independently
- Responsive: On mobile (<768px), sidebar collapses to hamburger, panels stack vertically

**Inputs**:
- Layout architecture from UI System Spec (dimensions, positions)
- Theme provider from Feature 01

**Outputs**:
- `AppShell` component (main layout container)
- `Layout.tsx` (structure: Topbar + Sidebar + MainWorkspace + LogStream)
- CSS/style module: Flexbox layout, fixed positioning

**Components**:
- `<AppShell>`: Main wrapper, renders children
- `<Topbar>`: Fixed 60px header
- `<Sidebar>`: Fixed 180px left nav
- `<MainWorkspace>`: Flex column, grows to fill
- `<ExecutionLogContainer>`: 35% height, bottom-aligned, scrollable

**Dependencies**:
- Feature 01: Design System & Theme Provider

**Success Criteria**:
- [ ] Layout renders without scrollbars (content fits in viewport)
- [ ] Topbar stays fixed when scrolling main content
- [ ] Sidebar stays fixed when scrolling main content
- [ ] Log stream scrolls independently without affecting main content
- [ ] Responsive breakpoint: <768px collapses sidebar to hamburger (not fully implemented in Phase 1, stub is ok)
- [ ] Dimensions match spec (180px sidebar, 60px topbar, 35% log height)

---

## FEATURE 03: Sidebar Navigation Menu

**Tier**: Structure (Phase 2)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: Feature 01, 02
- **Priority**: HIGH

**Description**:
Implement the left sidebar navigation with menu items, active state highlighting, and workflow quick-list. Users navigate between Workflows, Triggers, Logs, Integrations, Analytics, Settings.

**Requirements**:
- Menu items: Workflows, Triggers, Logs, Integrations, Analytics, Settings (with icons)
- Active state: Cyan left border + bright text
- Hover state: Background brightens slightly
- Workflow quick-list: Collapsible section showing 3-5 recent workflows
- Brand area: Logo + "AutoFlow" text (60px height)
- Footer: User profile + logout

**Inputs**:
- Navigation items (hardcoded or from mock data)
- Active page state (from URL or context)
- Workflow list for quick-access (mock data)

**Outputs**:
- `Sidebar.tsx` component
- `SidebarNav.tsx` sub-component (menu items)
- `WorkflowQuickList.tsx` sub-component

**Components**:
- `<Sidebar>`: Main sidebar container
- `<SidebarHeader>`: Logo + brand (60px)
- `<SidebarNav>`: Menu items with active state
- `<NavItem>`: Individual menu item (icon + label + badge)
- `<WorkflowQuickList>`: Collapsible list of workflows
- `<SidebarFooter>`: User profile + logout

**Dependencies**:
- Feature 01: Design System
- Feature 02: Layout System

**Success Criteria**:
- [ ] Menu items render with correct icons and labels
- [ ] Active menu item has cyan left border and bright text
- [ ] Hover state changes background opacity
- [ ] Workflow quick-list shows 3-5 items, collapsible
- [ ] Brand area is exactly 60px
- [ ] All text is readable on dark background
- [ ] No horizontal scroll in sidebar

---

## FEATURE 04: Topbar & Header

**Tier**: Structure (Phase 2)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: Feature 01, 02
- **Priority**: HIGH

**Description**:
Implement the fixed topbar with breadcrumb/page title, search input, notification bell, and user profile dropdown.

**Requirements**:
- Left: Breadcrumb or page title (e.g., "Workflows > Lead Intake Pipeline")
- Center: Page title (e.g., "Automation Control Center")
- Right: Search input + notification bell + user profile dropdown
- Fixed height: 60px
- Glassmorphic background with border

**Inputs**:
- Page title (from route or context)
- Notification count (mock data)
- User info (mock data)

**Outputs**:
- `Topbar.tsx` component
- `SearchInput.tsx` sub-component
- `NotificationBell.tsx` sub-component
- `UserProfile.tsx` sub-component

**Components**:
- `<Topbar>`: Main header container
- `<Breadcrumb>`: Navigation breadcrumb
- `<PageTitle>`: Center-aligned page title
- `<SearchInput>`: Quick search workflow input
- `<NotificationBell>`: Icon with unread badge
- `<UserProfileDropdown>`: Avatar + dropdown menu

**Dependencies**:
- Feature 01: Design System
- Feature 02: Layout System

**Success Criteria**:
- [ ] Topbar is exactly 60px height
- [ ] All sections (left, center, right) are properly aligned
- [ ] Search input is focused on `Ctrl+K` (future enhancement)
- [ ] Notification badge shows correct count
- [ ] Dropdown menu opens/closes on click
- [ ] Text is readable (good contrast)
- [ ] Fixed positioning works (no scroll jank)

---

## FEATURE 05: Workflow List View

**Tier**: Content (Phase 3)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: Feature 01, 02
- **Priority**: HIGH

**Description**:
Display a list or table of all workflows with status, last run, success rate, and quick-action buttons (Edit, Run, Delete). This is the main entry point for workflow management.

**Requirements**:
- Table layout: Name, Status, Last Run, Success Rate, Runs Today, Actions
- Status indicator: Active (green) / Inactive (gray) / Error (red)
- Rows are clickable to view workflow details
- Quick-action buttons: Run, Edit, Delete (with confirmation)
- Sorting: By last run (default), by name, by success rate
- Filtering: Active / Inactive / All
- Empty state: Message + "Create Workflow" CTA
- Loading state: Skeleton rows or shimmer

**Inputs**:
- Mock workflow data (Feature 05a)
- Sort/filter selection (local state)

**Outputs**:
- `WorkflowList.tsx` component
- `WorkflowListRow.tsx` sub-component
- `WorkflowListTable.tsx` sub-component
- Mock data: `mockWorkflows.ts`

**Components**:
- `<WorkflowList>`: Main container
- `<WorkflowListTable>`: Table structure
- `<WorkflowListRow>`: Individual row with status, metrics, actions
- `<StatusBadge>`: Status indicator (Active/Inactive/Error)
- `<ActionMenu>`: Dropdown or button group (Run, Edit, Delete)
- `<EmptyState>`: Placeholder when no workflows exist

**Dependencies**:
- Feature 01: Design System

**Success Criteria**:
- [ ] All workflows render in table with correct columns
- [ ] Status badges are color-coded correctly
- [ ] Last run timestamp is formatted human-readable (e.g., "2 hours ago")
- [ ] Success rate is formatted as percentage (e.g., "98%")
- [ ] Rows are clickable (navigate to workflow details)
- [ ] Sort buttons work (table re-sorts on click)
- [ ] Filter buttons work (table shows only selected workflows)
- [ ] Action buttons trigger appropriate modals
- [ ] Empty state renders when no workflows

---

## FEATURE 06: Workflow Details Panel

**Tier**: Content (Phase 3)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: Feature 01, 02, 05
- **Priority**: HIGH

**Description**:
Display detailed information about a selected workflow: name, description, trigger configuration, step configuration, and metadata (created by, last updated, etc.).

**Requirements**:
- Hero card showing workflow name + status indicator
- Description text
- Trigger section: Lists all triggers (API, Schedule, Manual) with config details
- Step configuration: Shows each step in order with type and config preview
- Metadata: Created at, Updated at, Owner
- Edit button: Opens edit modal (not in Phase 1, stub is ok)
- Copy webhook URL button (for API triggers)

**Inputs**:
- Selected workflow ID (from URL or context)
- Workflow data (mock)

**Outputs**:
- `WorkflowDetailsPanel.tsx` component
- `WorkflowHeader.tsx` sub-component
- `TriggerSection.tsx` sub-component
- `StepConfigSection.tsx` sub-component

**Components**:
- `<WorkflowDetailsPanel>`: Main container
- `<WorkflowHeader>`: Name, description, status, edit button
- `<TriggerSection>`: List of triggers with details
- `<StepConfigSection>`: Step list with type and config
- `<MetadataSection>`: Created at, updated at, owner
- `<CopyButton>`: Copy webhook URL to clipboard

**Dependencies**:
- Feature 01: Design System
- Feature 02: Layout System
- Feature 05: Workflow List (provides workflow data)

**Success Criteria**:
- [ ] Workflow name and description render clearly
- [ ] Status indicator shows correct state (Active/Inactive)
- [ ] Trigger section lists all triggers with full config visible
- [ ] Step section lists all steps in correct order
- [ ] Copy button works (copies URL, shows success toast)
- [ ] Metadata is formatted human-readable
- [ ] Edit button exists (can stub navigation for now)
- [ ] No horizontal scroll (responsive to viewport width)

---

## FEATURE 07: Workflow Graph Renderer (Hero Component)

**Tier**: Content (Phase 3)

**Execution Metadata**:
- **Effort**: 4 hours
- **Dependencies**: Feature 01, 02, 06
- **Priority**: CRITICAL (hero screenshot)

**Description**:
Render an interactive DAG (directed acyclic graph) visualization of workflow steps using SVG. This is the visual centerpiece of the dashboard and **must appear in the hero screenshot with logs below it**.

**Requirements**:
- Node layout: Horizontal flow (left-to-right or top-to-bottom)
- Nodes represent steps (e.g., "Receive Lead", "Classify Intent", "Route")
- Node status coloring:
  - Idle: Gray
  - Running: Cyan with glow
  - Completed: Green with checkmark
  - Error: Red with X
  - Skipped: Gray with striped pattern
- Edges: Connecting lines between sequential steps
- Interactive: Click node to see step details in tooltip or sidebar
- Execution state: Animates current step glow in real-time
- Responsive: Adjusts to fit container width (scales SVG)
- Labels: Each node shows step name clearly

**Inputs**:
- Workflow step data (mock)
- Current execution state (running step, completed steps, failed step)

**Outputs**:
- `WorkflowGraphView.tsx` component
- `GraphNode.tsx` sub-component
- `GraphEdge.tsx` sub-component
- Utility: `layoutGraph.ts` (DAG layout algorithm)

**Components**:
- `<WorkflowGraphView>`: Main SVG container
- `<GraphNode>`: SVG group (circle + label + status indicator)
- `<GraphEdge>`: SVG line with arrow
- Status indicator with glow effect (uses feature 01 animations)

**Dependencies**:
- Feature 01: Design System (colors, animations)
- Feature 02: Layout System (sizing)
- Feature 06: Workflow Details (workflow data)

**Success Criteria**:
- [ ] Nodes render correctly (not overlapping, readable labels)
- [ ] Edges connect nodes properly (no crossing lines if possible)
- [ ] Current running step has cyan glow + pulse animation
- [ ] Completed steps show green checkmarks
- [ ] Failed step shows red X
- [ ] Click node shows tooltip or sidebar with step details
- [ ] Graph rescales correctly when window resizes
- [ ] No performance issues with 5-10 steps
- [ ] **CRITICAL**: Graph and logs appear in same viewport (both visible without scrolling)

---

## FEATURE 08: Execution Log Stream

**Tier**: Live System (Phase 3)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: Feature 01, 02
- **Priority**: CRITICAL (hero screenshot)

**Description**:
Real-time scrolling log stream showing execution events with color-coded log levels, timestamps, and expandable details. **This component must be visible in the hero screenshot alongside the workflow graph.**

**Requirements**:
- Monospace font (JetBrains Mono 12px)
- Color-coded by log level:
  - INFO: Cyan text
  - SUCCESS: Green text
  - WARN: Amber text
  - ERROR: Red text
  - DEBUG: Gray text (hidden by default)
- Each log line shows: [HH:MM:SS] [LEVEL] Message
- Auto-scroll to latest entry (unless user scrolled up)
- Pause auto-scroll when user scrolls up; resume when scrolled to bottom
- Click entry to expand full details (metadata, full message)
- Copy button on each entry
- Search/filter input: Filter by keyword or log level
- Lazy load older logs on scroll-up
- Empty state: "No logs yet" when execution hasn't started

**Inputs**:
- Log stream data (mock, simulated in Phase 1)
- Current log level filter (INFO, WARN, ERROR, DEBUG, etc.)
- Search query (local state)

**Outputs**:
- `ExecutionLogStream.tsx` component
- `LogEntry.tsx` sub-component
- `LogEntryExpanded.tsx` sub-component (detail view)
- Mock data: `mockLogs.ts` (sample execution logs)
- Hook: `useLogStream()` (manages auto-scroll, filtering, search)

**Components**:
- `<ExecutionLogStream>`: Main container with scroll management
- `<LogEntry>`: Single log line with timestamp, level, message
- `<LogEntryExpanded>`: Full details popup/modal
- `<LogLevelBadge>`: Color-coded log level indicator
- `<LogSearchInput>`: Filter by keyword
- `<LogLevelToggle>`: Show/hide debug logs

**Dependencies**:
- Feature 01: Design System (colors, typography)
- Feature 02: Layout System (sizing, scrolling)

**Success Criteria**:
- [ ] Logs render with correct color coding
- [ ] Timestamps are formatted (HH:MM:SS or relative)
- [ ] Auto-scroll works (scrolls to bottom on new entry)
- [ ] Pause-on-scroll works (user scrolls up, auto-scroll pauses)
- [ ] Search filter works (hides non-matching entries)
- [ ] Log level toggle works (shows/hides DEBUG logs)
- [ ] Copy button copies log line to clipboard
- [ ] Expand button shows full details in modal or sidebar
- [ ] Monospace font is readable (good contrast on dark background)
- [ ] **CRITICAL**: Stream is visible in same frame as workflow graph

---

## FEATURE 09: KPI Stats Cards

**Tier**: Analytics (Phase 3)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: Feature 01
- **Priority**: HIGH (visible in hero screenshot)

**Description**:
Summary metrics cards showing workflow performance KPIs: Runs Today, Success Rate, Average Duration, Total Workflows. Cards display current value + trend (up/down) + icon.

**Requirements**:
- Card layout: 4 columns (responsive: 2 cols on tablet, 1 col on mobile)
- Each card shows:
  - Icon (relevant to metric, e.g., Zap for Runs, CheckCircle for Success)
  - Metric name (label)
  - Metric value (large, bold)
  - Trend (e.g., "+23%" or "-0.5s")
  - Trend direction (green for up, red for down on certain metrics)
- Glassmorphic background + border
- Subtle hover effect (brightness increase)
- Loading state: Skeleton cards or shimmer

**Inputs**:
- KPI data (mock from Feature 09a):
  - Runs today: number
  - Success rate: percentage
  - Average duration: milliseconds
  - Total workflows: number

**Outputs**:
- `KPIStatsCards.tsx` component
- `StatsCard.tsx` sub-component
- Mock data: `mockMetrics.ts`

**Components**:
- `<KPIStatsCards>`: Main container (grid layout)
- `<StatsCard>`: Individual card (icon, label, value, trend)
- `<TrendIndicator>`: Up/down arrow + percentage/value

**Dependencies**:
- Feature 01: Design System

**Success Criteria**:
- [ ] 4 cards render in a row (or responsive grid)
- [ ] Icons are visible and relevant
- [ ] Values are large and readable
- [ ] Trend indicators show correctly (up/down arrows, color)
- [ ] Cards have glassmorphic background
- [ ] Hover effect works (brightness increases slightly)
- [ ] Responsive layout works (stacks on mobile)
- [ ] **CRITICAL**: Cards are visible in hero screenshot (right panel)

---

## FEATURE 10: Control Buttons (Run Now, Edit, Create)

**Tier**: Interactivity (Phase 4)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: Feature 01, 06
- **Priority**: HIGH (hero screenshot)

**Description**:
Primary action buttons for running workflows, editing workflows, and creating new workflows. These are the main CTAs and must be prominently visible.

**Requirements**:
- **Run Now**: Primary button (indigo, cyan glow on hover), triggers workflow execution
- **Edit**: Secondary button, opens edit workflow modal
- **Create New**: Primary button, opens create workflow modal
- Button states:
  - Default: Indigo background, cyan glow on hover
  - Loading: Spinner replaces icon
  - Success: Green background, checkmark, brief toast confirmation
  - Error: Red glow, error message
  - Disabled: Grayed out, tooltip explains why
- Responsive: On mobile, buttons stack vertically
- Tooltip on hover: Brief description of action

**Inputs**:
- Workflow ID (for Run/Edit buttons)
- Button state (loading, success, error, etc.)
- Click handlers (from parent components)

**Outputs**:
- `Button.tsx` base component (reusable)
- `ControlButtons.tsx` container (groups Run, Edit, Create)
- Hook: `useButtonState()` (manages loading/success/error states)

**Components**:
- `<Button>`: Base button component (variant: primary/secondary, size, state)
- `<ControlButtons>`: Container grouping Run, Edit, Create buttons
- Icon library integration (Lucide or similar)

**Dependencies**:
- Feature 01: Design System (colors, animations)
- Feature 06: Workflow Details (provides workflow ID)

**Success Criteria**:
- [ ] All 3 buttons render correctly
- [ ] Run Now button has primary styling (indigo + cyan glow)
- [ ] Edit button has secondary styling
- [ ] Create button has primary styling
- [ ] Buttons show loading spinner when clicked
- [ ] Buttons show success state (green) briefly after action completes
- [ ] Buttons show error state (red) if action fails
- [ ] Disabled state renders correctly (grayed out, not clickable)
- [ ] Responsive layout (vertical stack on mobile)
- [ ] **CRITICAL**: Run button is visible and glowing in hero screenshot

---

## FEATURE 11: Run Workflow Modal (Mock Execution)

**Tier**: Interactivity (Phase 4)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: Feature 01, 07, 08, 10
- **Priority**: HIGH

**Description**:
Modal that opens when "Run Now" is clicked. If workflow requires input, shows form with fields. Simulates workflow execution by:
1. Accepting inputs (if needed)
2. Starting execution
3. Triggering mock log stream (simulates real-time logs)
4. Updating workflow graph state (current step → completed → next step, etc.)
5. Showing execution completion with success/error

**Requirements**:
- Modal layout: Form (if inputs required) + execution state display
- Input form: Dynamically generated from workflow config (e.g., email, lead data)
- Validation: Required fields, format validation
- Execute button: Submits form and starts mock execution
- Execution simulator: 
  - Immediately shows "Execution started" log
  - Simulates 5 steps, each taking 1-2 seconds
  - Each step produces log entries (INFO, SUCCESS, or ERROR)
  - WorkflowGraphView updates in real-time (current node glows, completes, next node glows)
  - Final step shows "Execution completed: SUCCESS" or "Execution failed: [error]"
- Post-execution: Show results, option to run again or close modal
- Error state: If execution fails, show error message and reason
- Cancel: Can cancel modal at any time

**Inputs**:
- Workflow data (config, steps)
- Click event from Run Now button

**Outputs**:
- `RunWorkflowModal.tsx` component
- `InputForm.tsx` sub-component (dynamic form from workflow config)
- Execution simulator: `mockExecutionSimulator.ts`
- Mock log generator: `generateMockLogs.ts`

**Components**:
- `<RunWorkflowModal>`: Main modal container
- `<InputForm>`: Dynamically generated input fields
- `<ExecutionDisplay>`: Shows execution state + logs + graph
- `<ExecutionResult>`: Final state (success/error) with summary

**Dependencies**:
- Feature 01: Design System
- Feature 07: Workflow Graph (updates graph during execution)
- Feature 08: Execution Log Stream (streams mock logs)
- Feature 10: Control Buttons (Run button triggers modal)

**Success Criteria**:
- [ ] Modal opens on Run Now click
- [ ] Input form renders (with dynamic fields from workflow config)
- [ ] Form validation works (required fields highlighted on submit)
- [ ] Execute button starts mock execution
- [ ] Mock logs stream in (simulates 1-2s between entries)
- [ ] Workflow graph updates in real-time (current step highlights, completes)
- [ ] Execution completes with success message
- [ ] Modal can be cancelled at any time
- [ ] Run again button re-triggers execution
- [ ] All logs remain visible during execution
- [ ] **CRITICAL**: Modal execution animates visible graph + logs simultaneously

---

## FEATURE 12: Status Indicators with Glow

**Tier**: Polish (Phase 5)

**Execution Metadata**:
- **Effort**: 1 hour
- **Dependencies**: Feature 01, 07
- **Priority**: MEDIUM (visual polish, not blocking)

**Description**:
Reusable status indicator component used throughout dashboard: workflow status (Active/Inactive), execution status (Running/Completed/Failed), step status. Must include glowing animation for running/active states.

**Requirements**:
- Visual states:
  - Idle: Gray circle, no glow
  - Pending: Amber circle, subtle pulse
  - Running: Cyan circle, strong glow + pulse
  - Completed/Success: Green checkmark circle, steady glow
  - Error/Failed: Red X circle, red glow + pulse
  - Skipped: Gray circle with striped fill
- Sizes: Small (16px), Medium (24px), Large (32px)
- Optional label: "Running", "Completed", etc.
- Optional tooltip on hover
- Pulse animation: 2s cycle, smooth, 60fps

**Inputs**:
- Status type (idle, pending, running, completed, error, skipped)
- Size (sm, md, lg)
- Label (optional)
- Tooltip text (optional)

**Outputs**:
- `StatusIndicator.tsx` component
- CSS animation: `@keyframes pulse` and `@keyframes glow`

**Components**:
- `<StatusIndicator>`: Main component
- SVG circle/shape with dynamic fill/stroke
- Tooltip wrapper (Headless UI or custom)

**Dependencies**:
- Feature 01: Design System (colors, animations)
- Feature 07: Workflow Graph (uses status indicators for nodes)

**Success Criteria**:
- [ ] All status states render correctly
- [ ] Cyan glow is visible on "Running" state
- [ ] Pulse animation is smooth (no jank)
- [ ] Green glow on "Completed" state
- [ ] Red glow on "Error" state
- [ ] Label (if provided) is positioned correctly
- [ ] Tooltip appears on hover (if provided)
- [ ] All sizes work correctly (16px, 24px, 32px)
- [ ] Animation performance is good (60fps)

---

## FEATURE 13: Create/Edit Workflow Modal

**Tier**: Interactivity (Phase 4)

**Execution Metadata**:
- **Effort**: 4 hours
- **Dependencies**: Feature 01, 05, 10
- **Priority**: MEDIUM (not in hero screenshot, but important feature)

**Description**:
Modal for creating a new workflow or editing an existing one. Multi-step modal:
1. Step 1: Name, description, trigger selection
2. Step 2: Configure selected trigger (API path, schedule cron, etc.)
3. Step 3: Add workflow steps (visual builder or list)
4. Step 4: Review and save

**Requirements**:
- Multi-step form with prev/next buttons
- Step 1: Name (required), Description (optional), Trigger type (API/Schedule/Manual)
- Step 2: Trigger config (varies by type)
  - API: Show webhook path, method selection
  - Schedule: Show cron input with help text
  - Manual: No config needed
- Step 3: Step builder
  - Display existing steps in a list
  - "Add Step" button opens step type selector
  - Step types: Webhook, Integration, Condition, Notification, Custom
  - Can reorder steps via drag-and-drop (nice-to-have)
  - Can delete steps (with confirmation)
- Step 4: Review all config, "Save & Deploy" button
- Validation: All required fields must be filled
- Error states: Show validation errors, API errors
- Success: Toast confirmation "Workflow 'X' created successfully"

**Inputs**:
- Workflow ID (if editing, null if creating)
- Workflow data (if editing)
- Available trigger types
- Available step types

**Outputs**:
- `CreateEditWorkflowModal.tsx` component
- `WorkflowNameStep.tsx` sub-component
- `TriggerConfigStep.tsx` sub-component
- `StepBuilderStep.tsx` sub-component
- `ReviewStep.tsx` sub-component
- Hook: `useWorkflowForm()` (manages multi-step form state)

**Components**:
- `<CreateEditWorkflowModal>`: Main modal
- Step components (4 separate components)
- Form utilities: Input, Select, Textarea, etc.

**Dependencies**:
- Feature 01: Design System
- Feature 05: Workflow List (updated after create/edit)
- Feature 10: Control Buttons (Create/Edit buttons open modal)

**Success Criteria**:
- [ ] Modal opens on Create or Edit button click
- [ ] All steps render correctly
- [ ] Form fields validate (show errors)
- [ ] Prev/Next buttons navigate between steps
- [ ] Save button creates/updates workflow (mock success)
- [ ] Toast confirmation shows after save
- [ ] Workflow list updates to show new/edited workflow
- [ ] Can cancel at any time (discard changes)
- [ ] Drag-and-drop reordering works (nice-to-have)

---

## FEATURE 14: Hero Dashboard View (All Together)

**Tier**: Polish (Phase 5)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: All previous features
- **Priority**: CRITICAL (screenshot optimization)

**Description**:
Compose all components into a single, screenshot-ready dashboard view showing the "hero frame" that communicates "I build workflow automation systems." This view must simultaneously display:
1. Workflow graph (center, running state with cyan glow)
2. Execution logs (bottom, showing real-time entries)
3. KPI cards (right panel, visible metrics)
4. Control buttons (Run button glowing, ready to click)
5. Workflow details (name, status, triggers visible)

**Requirements**:
- Single-screen composition (no vertical scroll required to see all key elements)
- Workflow graph: 500-600px wide × 250-300px tall, center-left
- KPI cards: 3-4 cards visible in right panel
- Execution logs: 500px wide × 200px tall, bottom (partial scroll, showing 4-5 entries)
- Buttons: Run Now prominently visible with cyan glow
- Responsive: On smaller screens (1024px), log stream can scroll below

**Inputs**:
- All components from Features 01-13

**Outputs**:
- `DashboardPage.tsx` (main page component)
- Responsive layout using CSS Grid or Flexbox
- Screenshot-optimized spacing and sizing

**Components**:
- All components from previous features, composed together
- Layout container using CSS Grid or Flexbox

**Dependencies**:
- ALL previous features (01-13)

**Success Criteria**:
- [ ] All components render without overlapping
- [ ] Workflow graph is visible and running (cyan glow on current step)
- [ ] Execution logs are visible below graph (showing 4-5 entries)
- [ ] KPI cards visible in right panel (Runs Today, Success Rate, Avg Duration)
- [ ] Run Now button visible and glowing (cyan glow)
- [ ] Edit button visible
- [ ] Workflow details (name, status) visible at top
- [ ] No vertical scrolling required for key elements (on 1440px × 900px viewport)
- [ ] **CRITICAL**: Can take screenshot of this view and use it as portfolio piece

---

## FEATURE 15: Error States & Loading States

**Tier**: Polish (Phase 5)

**Execution Metadata**:
- **Effort**: 2 hours
- **Dependencies**: All visual components (01-14)
- **Priority**: MEDIUM

**Description**:
Comprehensive error handling and loading states for all interactive features. Every async operation must show appropriate feedback.

**Requirements**:
- Loading states:
  - Skeleton cards (for KPI cards, workflow list rows)
  - Spinner overlay (for modals)
  - Shimmer effect (for logs)
  - Progress bar (for multi-step forms)
- Error states:
  - Error toast (temporary, auto-dismiss)
  - Error banner (persistent, dismissable)
  - Inline field errors (in forms)
  - Error icon + message (in cards/sections)
- Retry buttons: Present on all error states
- Graceful degradation: App should be usable even if features fail

**Inputs**:
- Error state from each component/hook
- Loading state from each async operation

**Outputs**:
- Reusable components: `Skeleton.tsx`, `Spinner.tsx`, `Toast.tsx`, `ErrorBanner.tsx`
- Hooks: `useLoading()`, `useError()`, `useToast()`
- Utilities: `createErrorMessage()` (format API errors into user-friendly text)

**Components**:
- `<Skeleton>`: Skeleton loading placeholder (card, row, text variants)
- `<Spinner>`: Loading spinner (centered or inline)
- `<Toast>`: Toast notification (success, error, info, warning)
- `<ErrorBanner>`: Persistent error message with retry button
- `<FieldError>`: Inline form field error

**Dependencies**:
- Feature 01: Design System (colors, animations)
- All visual components (02-14) must integrate error/loading states

**Success Criteria**:
- [ ] Skeleton cards render for KPI cards when loading
- [ ] Spinner appears when executing workflow
- [ ] Toast notification appears on success/error
- [ ] Error message is clear and actionable
- [ ] Retry button works (re-triggers action)
- [ ] Loading animations are smooth (no jank)
- [ ] Error states don't break layout

---

## FEATURE 16: Responsive Design & Mobile Layout

**Tier**: Polish (Phase 5)

**Execution Metadata**:
- **Effort**: 3 hours
- **Dependencies**: All layout components (02, 03, 04)
- **Priority**: MEDIUM (important for usability, not blocking hero screenshot)

**Description**:
Ensure dashboard is usable on mobile and tablet devices. Implement responsive breakpoints and adapt layout for smaller screens.

**Requirements**:
- Breakpoints:
  - Desktop: 1440px+ (as is)
  - Tablet: 768px-1439px (sidebar collapses to hamburger, 2-col grid)
  - Mobile: <768px (full-screen sidebars/modals, 1-col grid)
- Mobile sidebar: Hamburger menu, slides in from left (overlay)
- Responsive grid: KPI cards stack to 2 cols on tablet, 1 col on mobile
- Logs: Full-width on mobile, scrollable horizontally if needed
- Buttons: Stack vertically on mobile
- Graph: Scales down, may show in full-screen modal on mobile

**Inputs**:
- Viewport width (from window.innerWidth or CSS media queries)
- Breakpoint configuration

**Outputs**:
- CSS media queries for all components
- `useBreakpoint()` hook (returns current breakpoint)
- Responsive utilities (CSS classes for different screen sizes)

**Components**:
- Updated layout components with responsive sizing
- Mobile-specific components (Drawer for sidebar, BottomSheet for modals)

**Dependencies**:
- Feature 01: Design System
- Features 02-04: Layout components

**Success Criteria**:
- [ ] Layout is usable on 768px width (tablet)
- [ ] Layout is usable on 375px width (mobile)
- [ ] Sidebar collapses to hamburger on mobile
- [ ] KPI cards stack correctly on mobile
- [ ] Buttons are touch-friendly (48px+ height)
- [ ] No horizontal scroll on mobile (content fits viewport)
- [ ] Modal/drawers work on mobile
- [ ] Responsive grid works correctly at all breakpoints

---

## SCREENSHOT COMPOSITION CHECKLIST

**Hero Frame Requirements** (all must be visible in single 1440×900 viewport):

- [x] **Workflow Graph**: Running state, cyan glow on current step (center-left)
  - Feature 07: Workflow Graph Renderer
  - Location: 30-50% from left, 20-50% from top
  - Size: ~500px × 250px

- [x] **Execution Logs**: Live stream with 4-5 visible entries (bottom)
  - Feature 08: Execution Log Stream
  - Location: Bottom 30-40% of viewport
  - Size: Full width, ~250px tall

- [x] **KPI Cards**: 3-4 cards visible in right panel
  - Feature 09: KPI Stats Cards
  - Location: 60-100% from left, 20-50% from top
  - Size: ~350px wide × 150px tall

- [x] **Control Buttons**: Run Now glowing (primary focal point after graph)
  - Feature 10: Control Buttons
  - Location: Below workflow details, ~6-10% from top
  - Styling: Cyan glow on hover/active

- [x] **Workflow Details**: Name, status, triggers (top-center)
  - Feature 06: Workflow Details Panel
  - Location: 20-60% from left, top 20%
  - Must show "Lead Intake Pipeline" and status indicator

- [x] **Sidebar**: Navigation visible on left
  - Feature 03: Sidebar Navigation
  - Location: Left edge, 180px wide
  - Must show "Workflows" active state

---

## MOCK DATA REQUIREMENTS

### Feature 05a: Mock Workflow Data
```
File: src/mocks/mockWorkflows.ts
Export: workflowList (5-8 workflows with varied statuses)
Data shape: From UI_SYSTEM_SPECIFICATION.md, Section 5.1
Include: Lead Intake, Email Notification, CRM Sync, Data Export (4 workflows)
```

### Feature 08a: Mock Log Data
```
File: src/mocks/mockLogs.ts
Export: executionLogs (10-20 log entries for current execution)
Data shape: From UI_SYSTEM_SPECIFICATION.md, Section 5.3
Include: Mix of INFO, SUCCESS, ERROR levels
Timestamps: Realistic, ~1-2s apart
```

### Feature 09a: Mock Metrics Data
```
File: src/mocks/mockMetrics.ts
Export: kpiMetrics (dashboard KPI card data)
Data shape: From UI_SYSTEM_SPECIFICATION.md, Section 5.4
Include: Runs Today (142), Success Rate (98%), Avg Duration (4.2s)
```

### Feature 11a: Mock Execution Simulator
```
File: src/utils/mockExecutionSimulator.ts
Export: simulateExecution(workflow, onLog, onStepChange, onComplete)
Behavior: Emit mock logs every 1-2s, update step state, complete after 5 steps
Returns: Promise that resolves with execution result
```

---

## BUILD ORDER & TIMELINE

### Day 1 (Phase 1: Foundation)
1. **Feature 01**: Design System & Theme Provider (2h)
2. **Feature 02**: Global App Shell & Layout System (3h)
3. Start **Feature 03**: Sidebar Navigation (1h of 2h)

### Day 2 (Phase 2: Structure)
1. Complete **Feature 03**: Sidebar Navigation (1h)
2. **Feature 04**: Topbar & Header (2h)
3. Create mock data files (Feature 05a, 08a, 09a) (1h)

### Day 3 (Phase 3: Content Part 1)
1. **Feature 05**: Workflow List View (3h)
2. **Feature 06**: Workflow Details Panel (2h)
3. Start **Feature 07**: Workflow Graph Renderer (2h of 4h)

### Day 4 (Phase 3: Content Part 2)
1. Complete **Feature 07**: Workflow Graph Renderer (2h)
2. **Feature 08**: Execution Log Stream (3h)
3. **Feature 09**: KPI Stats Cards (2h)

### Day 5 (Phase 4: Interactivity Part 1)
1. **Feature 10**: Control Buttons (2h)
2. **Feature 11**: Run Workflow Modal + Mock Execution (3h)
3. Start **Feature 13**: Create/Edit Workflow Modal (1h of 4h)

### Day 6 (Phase 4: Interactivity Part 2)
1. Complete **Feature 13**: Create/Edit Workflow Modal (3h)
2. **Feature 12**: Status Indicators with Glow (1h)
3. **Feature 14**: Hero Dashboard View (compose all) (2h)

### Day 7 (Phase 5: Polish)
1. **Feature 15**: Error States & Loading States (2h)
2. **Feature 16**: Responsive Design & Mobile Layout (3h)
3. Testing & screenshot optimization (2h)

**Total**: ~48-50 hours of development work

---

## DEPENDENCY GRAPH

```
Feature 01 (Design System)
├── Feature 02 (App Shell)
│   ├── Feature 03 (Sidebar Nav)
│   ├── Feature 04 (Topbar)
│   └── Feature 08 (Log Stream)
├── Feature 05 (Workflow List)
│   └── Feature 06 (Workflow Details)
│       └── Feature 07 (Graph Renderer) ← HERO COMPONENT
│           └── Feature 11 (Run Modal)
├── Feature 09 (KPI Cards)
├── Feature 10 (Control Buttons)
│   ├── Feature 11 (Run Modal)
│   └── Feature 13 (Create/Edit Modal)
├── Feature 12 (Status Indicators)
├── Feature 14 (Hero Dashboard) ← Composes ALL
├── Feature 15 (Error/Loading States) ← Integrates into ALL
└── Feature 16 (Responsive Design) ← Applies to ALL

Features 05a, 08a, 09a, 11a: Mock data (can be created anytime after Feature 01)
```

---

## SUCCESS METRICS

**Tier 1 (Must Have)**:
- [ ] Hero screenshot shows workflow graph + logs + KPI cards in single frame
- [ ] All components render without errors
- [ ] Design system colors and typography match spec
- [ ] Responsive layout works at 1440px, 768px, 375px

**Tier 2 (Should Have)**:
- [ ] Run workflow execution animates graph and logs simultaneously
- [ ] Mock execution completes without errors
- [ ] Create/Edit workflow modal works end-to-end
- [ ] All error states render correctly

**Tier 3 (Nice to Have)**:
- [ ] Drag-and-drop reordering in step builder
- [ ] Animations are smooth (60fps)
- [ ] Mobile app is fully usable
- [ ] Dark mode toggle (future feature)

---

**Status**: Ready for implementation | **Last Updated**: 2026-06-07
