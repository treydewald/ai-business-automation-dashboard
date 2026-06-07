# Development Guide

Welcome to the AI Business Automation Dashboard project. This guide will help you set up your development environment and understand the project structure.

## Table of Contents

- [Project Overview](#project-overview)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Project Overview

The AI Business Automation Dashboard is a full-stack application for creating, managing, and executing automated workflows. It provides:

- **Frontend**: React + TypeScript UI for workflow management and monitoring
- **Backend**: Python FastAPI backend with workflow execution engine
- **Database**: PostgreSQL for persistent storage
- **CI/CD**: GitHub Actions for automated testing and deployment

### Tech Stack

**Frontend:**
- React 18+ with TypeScript
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls

**Backend:**
- FastAPI for REST API
- SQLAlchemy for ORM
- Alembic for database migrations
- PostgreSQL (production) / SQLite (development)

## Environment Setup

### Prerequisites

Before you begin, ensure you have installed:

- **Git** - Version control system
- **Python** - v3.9 or higher (for backend)
- **Node.js** - v18 or higher (for frontend)
- **npm** or **yarn** - Package manager for frontend
- **PostgreSQL** - v13+ (optional for production setup)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -e .[dev]
   ```

   This installs the package in development mode with all dev dependencies (testing, linting, etc.).

2. **Environment Configuration:**
   Create a `.env` file in the `backend/` directory:
   ```
   DATABASE_URL=sqlite:///./data.db
   JWT_SECRET=your-secret-key-here-change-in-production
   DEBUG=true
   ```

3. **Database Setup:**
   ```bash
   cd backend
   alembic upgrade head
   ```

4. **Run the backend server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   API documentation: `http://localhost:8000/api/docs` (Swagger UI)

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the `frontend/` directory:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_DEBUG=true
   ```

3. **Start the development server:**
   ```bash
   cd frontend
   npm start
   ```

   The app will open at `http://localhost:3000`
   Hot reload is enabled - changes are reflected instantly.

### Complete Setup (with Docker)

For a complete setup with database and Redis:

```bash
docker-compose up -d
```

This starts:
- Backend API (port 8000)
- Frontend (port 3000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

## Project Structure

```
ai-business-automation-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── models/              # SQLAlchemy models
│   │   ├── api/
│   │   │   └── routes/          # API endpoint definitions
│   │   ├── services/            # Business logic
│   │   ├── engine/              # Workflow execution engine
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── middleware/          # Auth, CORS, etc.
│   │   ├── db.py                # Database connection
│   │   └── config.py            # Configuration
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Test files
│   ├── pyproject.toml           # Python dependencies and config
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer
│   │   ├── styles/              # Global styles
│   │   ├── contexts/            # React Context providers
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Root component
│   │   └── index.tsx            # Entry point
│   ├── public/                  # Static assets
│   ├── __tests__/               # Test files
│   ├── package.json             # NPM dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── tailwind.config.js       # TailwindCSS config
│   └── jest.config.js           # Jest testing config
│
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│
├── docs/
│   ├── architecture.md          # Architecture documentation
│   ├── implementation_plan.md   # Feature implementation roadmap
│   └── API.md                   # API documentation
│
├── docker-compose.yml           # Docker Compose configuration
├── pyproject.toml               # Python project configuration
├── DEVELOPMENT.md               # This file
├── CONTRIBUTING.md              # Contribution guidelines
└── README.md                    # Project overview
```

## Development Workflow

### 1. Create a Feature Branch

Always work on a feature branch, never directly on `main`:

```bash
git checkout -b feature/feature-name
```

Branch naming convention:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `perf/` - Performance improvements

### 2. Make Changes

Edit files in your favorite editor. Hot reload is enabled in both frontend and backend during development.

### 3. Run Tests Locally

Before committing, run tests to ensure nothing is broken:

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

### 4. Run Linting and Formatting

Ensure code quality:

```bash
# Backend
cd backend
black app              # Format
flake8 app             # Lint

# Frontend
cd frontend
npm run lint           # ESLint
npm run format         # Prettier
```

Alternatively, use pre-commit hooks (installed automatically with dev dependencies):

```bash
pre-commit run --all-files
```

### 5. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add new workflow dashboard page

- Implement main dashboard with workflow list
- Add search and filter functionality
- Add pagination for large datasets"
```

Commit message convention:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Testing changes
- `chore:` - Build/tooling changes

### 6. Push and Create Pull Request

```bash
git push origin feature/feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the feature
- Description of changes
- Link to relevant issues
- Screenshots for UI changes

### 7. Code Review

Address feedback from reviewers and update your branch:

```bash
git add .
git commit -m "refactor: address code review feedback"
git push
```

## Running Tests

### Backend Tests

```bash
# Run all tests
cd backend
pytest tests/ -v

# Run specific test file
pytest tests/unit/test_engine.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Watch mode (run on file changes)
ptw tests/
```

### Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Integration Tests

Run the full stack tests:

```bash
# Start services
docker-compose up -d

# Run integration tests
cd backend
pytest tests/integration/ -v

# Stop services
docker-compose down
```

## Common Tasks

### Database Migrations

Create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "Add new table"
```

Apply migrations:

```bash
alembic upgrade head
```

Rollback migrations:

```bash
alembic downgrade -1  # Rollback one version
```

### Adding a New API Endpoint

1. Define the request/response schema in `backend/app/schemas/`
2. Create the route handler in `backend/app/api/routes/`
3. Add database model if needed in `backend/app/models/`
4. Add tests in `backend/tests/integration/`
5. Update API documentation in `docs/API.md`

### Adding a New React Component

1. Create component file in `src/components/`
2. Write component with TypeScript
3. Add unit tests in `src/__tests__/components/`
4. Export from component index if creating a shared component
5. Use in pages or other components

### Updating Dependencies

```bash
# Backend
cd backend
pip install --upgrade package-name

# Frontend
cd frontend
npm update package-name
```

## Troubleshooting

### Backend won't start

**Error: `ModuleNotFoundError: No module named 'app'`**

Solution: Ensure you're running from the project root and the backend module is installed:

```bash
cd backend
pip install -e .
```

**Error: `sqlite3.OperationalError: unable to open database file`**

Solution: Create the data directory and run migrations:

```bash
mkdir -p data
alembic upgrade head
```

### Frontend won't start

**Error: `Cannot find module 'react'`**

Solution: Install dependencies:

```bash
cd frontend
npm install
```

**Port 3000 already in use:**

```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Tests failing locally but passing in CI

This usually means:

1. **Missing dependencies**: Run `npm install` or `pip install -e .[dev]`
2. **Environment variables**: Create `.env` files as described in setup
3. **Database state**: Reset the test database: `python -c "import app.db; app.db.reset()"`

### Hot reload not working

**Frontend:** Check that the development server is running and you're accessing `http://localhost:3000`

**Backend:** Ensure uvicorn is started with `--reload` flag

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Getting Help

- Check existing issues: `https://github.com/your-repo/issues`
- Create a new issue with detailed description
- Reach out on the project Slack channel

---

Happy coding! 🚀
