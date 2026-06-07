# AI Business Automation Dashboard

A full-stack workflow automation system that orchestrates business operations with AI-assisted intelligence and real-time execution tracking.

## 🎯 Overview

This portfolio project demonstrates a complete full-stack automation platform with:
- **Workflow Engine**: JSON-based DAG execution for complex business processes
- **Intelligent Routing**: AI-assisted classification and workflow routing
- **Real-time Tracking**: Live execution logs and event streaming
- **Integration Ready**: Pluggable connectors for Slack, Email, Webhooks, and CRMs
- **Production Ready**: Retry logic, error handling, and execution history

## 🎨 Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  React + TypeScript Frontend (Neon Indigo)   │
│  - Workflow Dashboard                         │
│  - Real-time Logs                             │
│  - Analytics & Metrics                        │
└──────────┬────────────────────────────────────┘
           │ REST/WebSocket
           ▼
┌──────────────────────────────────────────────┐
│  FastAPI Backend (Microservices)             │
│  - Workflow Engine (DAG Execution)           │
│  - Trigger System (Manual + API)             │
│  - Classification Service (AI)               │
│  - Integration Manager                       │
│  - Logging Pipeline                          │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Data Layer                                   │
│  - PostgreSQL (Workflows, Execution History) │
│  - Event Stream (Execution Logs)             │
│  - Cache (Redis for state)                   │
└──────────────────────────────────────────────┘
```

## 💻 Tech Stack

### Frontend
- **React** 18+ with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **TailwindCSS** for responsive, dark-themed UI
- **Socket.io** for real-time log streaming

### Backend
- **FastAPI** for high-performance async APIs
- **Pydantic** for data validation and serialization
- **SQLAlchemy** for ORM and database operations
- **PostgreSQL** for persistent storage
- **Python 3.10+**

### DevOps & Infrastructure
- Docker for containerization
- GitHub Actions for CI/CD
- Environment-based configuration

## 📋 Project Structure

```
ai-business-automation-dashboard/
├── frontend/                 # React + TypeScript UI
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API clients
│   │   ├── styles/          # TailwindCSS config
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI services
│   ├── app/                 # Main application package
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── core/                # Config, constants, auth
│   ├── tests/               # Unit & integration tests
│   ├── main.py              # FastAPI entry point
│   ├── requirements.txt
│   └── .venv/               # Python virtual environment
│
└── docs/                     # Documentation
    ├── ARCHITECTURE.md      # System design
    ├── FEATURES.md          # Feature specifications
    ├── ROADMAP.md           # Development roadmap
    └── NEXT_STEPS.md        # Getting started guide
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.10+ (backend)
- PostgreSQL 12+ (optional, for full setup)
- Git & GitHub CLI

### Setup Instructions

**1. Clone and navigate to project**
```bash
cd "C:\Users\Trey\Projects\ai-business-automation-dashboard"
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`

**3. Backend Setup**
```bash
cd backend
source .venv/Scripts/Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python main.py
```
Backend API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## 🛠️ Development Commands

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Backend
```bash
cd backend
source .venv/Scripts/Activate.ps1  # Activate venv
python main.py                      # Run development server
pytest                              # Run tests
pytest --cov                        # With coverage report
```

## 📊 MVP Features

See [NEXT_STEPS.md](docs/NEXT_STEPS.md) for the implementation roadmap and first features to build.

## 🔄 Workflow Example

```
Lead Intake → Classification → Data Enrichment → CRM Update → Notifications
```

**Execution Flow:**
1. Lead form submission (API endpoint)
2. AI classifier determines lead quality (HIGH/MEDIUM/LOW)
3. Enrichment service queries external APIs
4. CRM integration updates lead record
5. Slack/Email notifications sent to team

## 📈 Key Metrics Tracked

- Workflow execution count
- Success/failure rates
- Average execution time
- Integration error rates
- System uptime

## 🔐 Security

- Input validation via Pydantic
- API authentication (JWT in implementation)
- Environment-based configuration
- CORS configuration
- SQL injection prevention via ORM

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and decisions
- [Features](docs/FEATURES.md) - Detailed feature specifications
- [Roadmap](docs/ROADMAP.md) - Phase-based development plan
- [Next Steps](docs/NEXT_STEPS.md) - Getting started guide

## 🤝 Development Workflow

1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure tests pass: `pytest` (backend), `npm run type-check` (frontend)
4. Create pull request with description
5. Merge to `main` after review

## 📄 License

Portfolio project - Trey DeWald (trey.dewald@gmail.com)

## 🎓 Learning Resources

This project demonstrates:
- Full-stack architecture and design patterns
- Async Python with FastAPI
- React hooks and state management
- Real-time data streaming
- Workflow orchestration concepts
- Testing and quality assurance
- Git and GitHub workflows
