# AI Business Automation Dashboard - Frontend

A modern, full-featured React web application for creating, managing, and executing business automation workflows with visual workflow composition, execution monitoring, and analytics.

## Project Overview

The AI Business Automation Dashboard Frontend is a TypeScript-based React application that enables users to design complex business processes as directed acyclic graphs (DAGs), execute them programmatically, monitor their progress in real-time, and analyze performance metrics across deployed workflows.

The system provides a visual workflow builder with drag-and-drop step composition, multiple automation integration points (webhooks, email, Slack notifications), conditional logic and branching, execution history and detailed logging, role-based access control, and comprehensive analytics on workflow performance.

It integrates with a backend REST API (`http://localhost:8000/api`) to manage workflow definitions, trigger executions, retrieve execution history, and capture detailed execution logs and metrics.

### Key Use Cases

- **Lead Management & Scoring**: Automate lead ingestion, validation, enrichment, ML-based scoring, and multi-channel routing
- **Workflow Orchestration**: Design and execute complex multi-step business processes with conditional branching
- **Integration Automation**: Connect third-party systems via webhooks, email, Slack notifications, and custom integrations
- **Performance Monitoring**: Track workflow health, execution times, success rates, and identify bottlenecks
- **Reusable Process Templates**: Create and reuse standardized workflow templates across the organization

## Key Features

### Workflow Management & Editing

- **Visual Workflow Builder**: Drag-and-drop canvas powered by ReactFlow for intuitive workflow composition
- **Step Types**: Support for Action, Webhook, Email, Slack, Condition (if/else), Loop, and Parallel execution nodes
- **DAG Validation**: Real-time validation to prevent circular dependencies and isolated nodes in workflows
- **Workflow CRUD Operations**: Create new workflows, edit existing definitions, and manage workflow lifecycle
- **Workflow Templates**: Pre-built workflow templates for rapid deployment of common business processes
- **Demo Workflow**: Full B2B lead processing example demonstrating enterprise-grade workflow patterns
- **Configuration Panels**: Detailed step configuration UI for managing node parameters and behavior

### Execution Management

- **Execution Triggering**: Manual execution of workflows with real-time feedback
- **Execution History**: Complete execution tracking with timestamps and status information
- **Execution Details**: Inspect individual execution results, error messages, and processing context
- **Execution Logs**: Structured logging (DEBUG, INFO, WARN, ERROR) for every execution step with timestamps
- **Real-time Log Viewer**: Stream execution logs as workflows run with filtering and search capabilities
- **Execution Status Tracking**: Monitor running, completed, and failed executions

### Analytics & Insights

- **KPI Metrics Cards**: Display key performance indicators including total workflows, executions, and success rates
- **Trend Visualization**: Chart historical performance trends with multiple data points
- **Metrics Dashboard**: Real-time aggregation of workflow metrics and system health indicators
- **Performance Monitoring**: Track execution duration, throughput, and failure rates

### Integration & Extensibility

- **Webhook Integration**: Accept HTTP webhooks to trigger workflows with custom payloads
- **Email Notifications**: Send templated email notifications as part of workflow execution
- **Slack Integration**: Post messages to Slack channels for alerts and notifications
- **Custom Integration Builder**: Visual interface for building custom third-party integrations

### Security & Access Control

- **Authentication**: Email/password-based login with token-based session management
- **Role-Based Access Control**: Permission gates to enforce access control for sensitive workflows
- **Local Storage Persistence**: Secure storage of authentication tokens and user context
- **Authorization Boundaries**: Component-level permission enforcement via PermissionGate

### UI/UX & Theming

- **Dark/Light Theme Support**: Full theme switching with persistent user preference
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS layouts
- **Neon Color Scheme**: Custom indigo and cyan neon color palette with glass-morphism effects
- **Loading States**: Loading spinners and skeleton states for async operations
- **Alert & Error Handling**: User-friendly alerts, error messages, and validation feedback
- **Modal Dialogs**: Modal UI for confirmations and complex interactions

### Testing & Quality Assurance

- **Unit Tests**: Jest test suite covering components, hooks, and utility functions
- **Integration Tests**: React Testing Library tests validating component behavior
- **E2E Testing**: Playwright automation tests for full user journey validation
- **Coverage Thresholds**: 60% coverage target for branches, functions, lines, and statements
- **Type Safety**: Full TypeScript compilation with strict type checking

### Performance & Optimization

- **Code Splitting**: Lazy-loaded components for reduced initial bundle size
- **Bundle Analysis**: Tools for analyzing and optimizing build artifacts
- **Image Optimization**: Utilities for optimizing image assets in the dashboard
- **Performance Monitoring**: Runtime metrics collection and analysis for frontend performance

### Version Control & History

- **Version History**: Track changes to workflow definitions over time
- **Version Diffing**: Visual diff viewer to compare workflow versions
- **Metadata Tracking**: Capture creation and last-modified timestamps

## System Architecture

### Frontend Structure

```
src/
├── pages/               # Route-level components
│   ├── VisualizationDashboard.tsx
│   ├── WorkflowDashboard.tsx
│   ├── WorkflowEditorPage.tsx
│   ├── WorkflowDetailsPage.tsx
│   ├── ExecutionDashboard.tsx
│   ├── ExecutionDetailsPage.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── TemplateLibrary.tsx
│   ├── AlertsPage.tsx
│   ├── CustomIntegrationBuilder.tsx
│   └── LoginPage.tsx
├── components/          # Reusable UI components
│   ├── WorkflowCanvas.tsx          # ReactFlow-based visual builder
│   ├── WorkflowCard.tsx             # Workflow list item
│   ├── StepNode.tsx                 # Individual workflow step
│   ├── StepConfigPanel.tsx          # Node configuration UI
│   ├── ExecutionLogViewer.tsx       # Streaming log display
│   ├── MetricsCard.tsx              # KPI metrics display
│   ├── TrendChart.tsx               # Performance trend visualization
│   ├── Button.tsx, Card.tsx, Modal.tsx, Alert.tsx
│   ├── Form/                        # Form input components
│   │   ├── Input.tsx, Textarea.tsx, Select.tsx, Checkbox.tsx
│   └── ...other components
├── hooks/              # Custom React hooks
│   ├── useWorkflow.ts       # Single workflow operations
│   ├── useWorkflows.ts      # Workflow list management
│   ├── useExecution.ts      # Single execution operations
│   ├── useExecutions.ts     # Execution list management
│   ├── useLogs.ts           # Execution log fetching
│   ├── useWorkflowEditor.ts # Workflow editing state management
│   ├── useAuth.ts           # Authentication context
│   └── useTheme.ts          # Theme context
├── services/           # API client & external services
│   ├── api.ts               # Generic REST API client
│   └── analyticsApi.ts      # Analytics-specific API
├── contexts/           # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   ├── ThemeContext.tsx     # Theme state
│   └── SelectionContext.tsx # Workflow node selection state
├── utils/              # Utility functions & helpers
│   ├── dagValidation.ts     # DAG validation & cycle detection
│   ├── performanceMetrics.ts
│   ├── performanceMonitoring.ts
│   ├── imageOptimization.ts
│   ├── lazyLoad.tsx
│   └── bundleAnalysis.ts
├── types/              # Shared TypeScript interfaces
│   └── index.ts
├── mocks/              # Mock data for development
│   ├── workflows.ts
│   ├── logs.ts
│   └── metrics.ts
├── __tests__/          # Test suites
│   ├── components/
│   ├── hooks/
│   ├── setup.ts
│   └── App.test.tsx
├── App.tsx             # Root component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles

```

### Data Flow

```
User Interface (React Components)
         ↓
     Hooks (useWorkflows, useExecutions, etc)
         ↓
    API Client (fetch-based REST)
         ↓
Backend API (http://localhost:8000/api)
         ↓
Backend Services (FastAPI/Python)
```

### Component Hierarchy

- **App** (Root)
  - AuthProvider
    - ThemeProvider
      - Router
        - Routes (11 pages)
          - VisualizationDashboard
          - WorkflowDashboard
            - WorkflowList
              - WorkflowCard
                - WorkflowMetadata
          - WorkflowEditorPage
            - WorkflowCanvas (ReactFlow)
              - StepNode
            - StepConfigPanel
          - ExecutionDashboard
            - ExecutionList
          - AnalyticsDashboard
            - KPIStatsCards
            - MetricsCard
            - TrendChart
          - ...other pages

## Technologies Used

### Frontend Framework & Build

- **React** 19.2.6 - UI library for building interactive user interfaces
- **React DOM** 19.2.6 - React rendering engine for browsers
- **TypeScript** ~6.0.2 - Typed JavaScript superset for type safety
- **Vite** 8.0.12 - Lightning-fast build tool and dev server with HMR
- **@vitejs/plugin-react** 6.0.1 - React support for Vite (using Oxc)

### Routing & Navigation

- **React Router DOM** 6.20.0 - Client-side routing for SPA navigation

### UI Framework & Styling

- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **@tailwindcss/forms** 0.5.7 - Pre-styled form components
- **@tailwindcss/typography** 0.5.10 - Prose styling for text content
- **Autoprefixer** 10.4.16 - PostCSS plugin for vendor prefixes
- **PostCSS** 8.4.32 - CSS transformation pipeline

### Workflow Visualization

- **ReactFlow** 11.11.4 - React library for building node-based editors and graphs

### State Management

- React Context API (ThemeContext, AuthContext, SelectionContext)
- React Hooks (useState, useCallback, useEffect, useRef)

### API & HTTP

- Native Fetch API for HTTP requests
- Custom ApiClient wrapper class with typed responses
- Environment-based API URL configuration (VITE_API_URL)

### Testing & Quality

- **Jest** 29.7.0 - JavaScript testing framework
- **Jest Environment JSdom** 29.7.0 - DOM environment for Jest
- **React Testing Library** 14.3.1 - Testing utilities for React components
- **@testing-library/user-event** 14.5.1 - User event simulation for tests
- **@testing-library/jest-dom** 6.1.4 - Jest matchers for DOM assertions
- **@types/jest** 29.5.5 - TypeScript types for Jest
- **ts-jest** 29.1.1 - TypeScript support for Jest
- **@playwright/test** 1.60.0 - Browser automation for E2E tests

### Code Quality & Linting

- **ESLint** 10.3.0 - JavaScript/TypeScript linter
- **@eslint/js** 10.0.1 - ESLint configuration
- **typescript-eslint** 8.59.2 - TypeScript ESLint integration
- **eslint-plugin-react-hooks** 7.1.1 - ESLint rules for React Hooks
- **eslint-plugin-react-refresh** 0.5.2 - ESLint rules for Vite refresh

### Utilities

- **@types/react** 19.2.14 - TypeScript definitions for React
- **@types/react-dom** 19.2.3 - TypeScript definitions for React DOM
- **@types/node** 24.12.3 - TypeScript definitions for Node.js
- **globals** 17.6.0 - Global variable types for ESLint

## Running Instructions

### Prerequisites

- **Node.js**: 16.x or higher (check with `node --version`)
- **npm**: 7.x or higher (check with `npm --version`)
- **Backend Service**: Running at `http://localhost:8000` with API at `/api`

### Installation

1. Clone the repository (or navigate to the frontend directory)
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create environment configuration
   ```bash
   # .env file is already configured with:
   VITE_API_URL=http://localhost:8000/api
   VITE_API_TIMEOUT=30000
   ```

   To use a different backend URL, create a `.env.local` file:
   ```
   VITE_API_URL=http://your-api-host:port/api
   ```

### Local Development

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:4173` (or the next available port).

**Development Features:**
- Hot module replacement for instant code updates
- Vite dev server with proxy routing to backend API
- TypeScript compilation in-memory
- Full browser DevTools support

### Production Build

Create an optimized production build:

```bash
npm run build
```

This will:
- Run TypeScript type checking (`tsc -b`)
- Bundle and minify all assets
- Generate production-optimized output in the `dist/` directory
- Create source maps in development mode

Preview the production build locally:

```bash
npm run preview
```

### Running Tests

Execute the test suite:

```bash
# Run tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test:watch

# Generate coverage report
npm test:coverage
```

**Test Coverage Requirements:**
- Minimum 60% coverage for branches, functions, lines, and statements

### Linting & Code Quality

Check code quality and lint issues:

```bash
npm run lint
```

## Project Configuration

### TypeScript

TypeScript configuration is split into two files:

- **tsconfig.app.json** - Application code settings
- **tsconfig.node.json** - Build tool settings (Vite, Jest)

Main settings:
- Target: ES2020+
- Module: ESNext
- JSX: React (for React 19)
- Strict: Enabled
- Path aliases for cleaner imports (@pages, @components, @hooks, etc.)

### Vite Configuration

Key Vite settings in `vite.config.ts`:

- **Port**: 4173 (dev server)
- **Build Target**: esnext
- **Code Splitting**: Automatic chunk optimization
- **Proxy**: Routes `/api` requests to backend at `http://localhost:8000`
- **Assets**: Images go to `dist/images/`, fonts to `dist/fonts/`
- **Source Maps**: Enabled in development, disabled in production

### Jest Configuration

Key Jest settings in `jest.config.js`:

- **Test Environment**: jsdom (for DOM testing)
- **Test Pattern**: `**/__tests__/**/*.test.ts(x)`
- **Module Mapper**: Maps CSS imports to identity-obj-proxy
- **Coverage Threshold**: 60% minimum
- **Setup File**: `src/__tests__/setup.ts` for test initialization

### Tailwind CSS

Configured in `tailwind.config.js`:

- **Content Paths**: Scans `src/**/*.{js,ts,jsx,tsx}`
- **Dark Mode**: Class-based (`dark:` prefixes)
- **Custom Theme**:
  - Neon color palette (indigo primary, cyan accents)
  - Custom animations (pulse-glow, soft-pulse)
  - Glass-morphism effects (backdrop blur)
  - Glow shadows for visual effects

## API Integration

### Backend API URL

The frontend communicates with the backend API at:

```
http://localhost:8000/api
```

Configure the URL via `VITE_API_URL` environment variable.

### Key API Endpoints

The API client in `src/services/api.ts` provides `GET`, `POST`, `PUT`, and `DELETE` methods.

**Workflow Management:**
- `GET /workflows` - List all workflows
- `POST /workflows` - Create new workflow
- `GET /workflows/{id}` - Get workflow details
- `PUT /workflows/{id}` - Update workflow definition
- `DELETE /workflows/{id}` - Delete workflow

**Execution Management:**
- `GET /executions` - List executions
- `POST /executions` - Trigger workflow execution
- `GET /executions/{id}` - Get execution details
- `GET /executions/{id}/logs` - Stream execution logs

**Authentication:**
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout

**Analytics:**
- `GET /analytics/metrics` - Get current metrics
- `GET /analytics/trends` - Get historical trends

## Authentication & Authorization

### Authentication Flow

1. User enters email and password on LoginPage
2. Frontend sends credentials to `/api/auth/login`
3. Backend returns authentication token
4. Token is stored in `localStorage` under `auth_token` and `auth_user`
5. Token is sent in all subsequent API requests via headers
6. User session persists across browser refreshes

### Role-Based Access Control

Components can enforce access control using the `PermissionGate` component:

```jsx
<PermissionGate requiredRole="admin">
  {/* Component only visible to admins */}
</PermissionGate>
```

## Project Status

✅ **Production Ready**

All core functionality for workflow management, execution, and analytics is fully implemented and tested. The system supports:

- Complete workflow lifecycle (create → edit → execute → monitor → analyze)
- Multi-step business process automation with conditional logic
- Real-time execution monitoring and detailed logging
- Role-based access control and secure authentication
- Responsive UI with dark/light theme support
- Comprehensive test coverage and type safety

## Building & Deployment

### Build Output

The `npm run build` command produces:

```
dist/
├── index.html              # Entry HTML file
├── js/                     # Bundled JavaScript chunks
│   ├── main-[hash].js      # Main application bundle
│   └── [name]-[hash].js    # Code-split chunks
├── images/                 # Optimized images
└── [other assets]          # CSS, fonts, etc.
```

### Deployment Preparation

Before deploying to production:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Test the production build**
   ```bash
   npm run preview
   ```

3. **Verify all tests pass**
   ```bash
   npm test
   ```

4. **Check linting**
   ```bash
   npm run lint
   ```

5. **Deploy the `dist/` directory** to your hosting provider

### Environment Configuration

For production, ensure the following is set:

```
VITE_API_URL=https://api.yourdomain.com/api
```

Update this before building or use build-time environment variables.

## Troubleshooting

### Common Issues

**Port 4173 already in use:**
```bash
npm run dev -- --port 3000
```

**Backend API connection refused:**
- Verify backend service is running at `http://localhost:8000`
- Check `VITE_API_URL` environment variable
- Check browser console for CORS errors

**Tests failing after dependency updates:**
```bash
npm run test -- --clearCache
```

**TypeScript type errors:**
```bash
npm run build
```

## Summary

The AI Business Automation Dashboard Frontend is a **fully-featured, production-ready React application** for visual workflow management and execution monitoring. All features described in this README are implemented in the codebase and ready for production deployment.

The system provides enterprise-grade workflow orchestration capabilities with comprehensive monitoring, analytics, and user experience optimizations.
