from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Business Automation Dashboard API",
    description="Enterprise workflow automation platform",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:4173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Business Automation Dashboard API", "version": "1.0.0"}


# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now().isoformat()
    }


# Mock Workflows endpoint
@app.get("/api/workflows")
async def list_workflows(skip: int = 0, limit: int = 10):
    return {
        "items": [
            {
                "id": "wf-001",
                "name": "Customer Onboarding",
                "description": "Automated workflow for new customer setup",
                "status": "active",
                "created_at": "2026-06-01T10:00:00",
                "updated_at": "2026-06-07T08:30:00",
                "execution_count": 45,
                "last_execution": "2026-06-07T08:30:00",
                "last_status": "completed"
            },
            {
                "id": "wf-002",
                "name": "Invoice Processing",
                "description": "Process and route invoices to appropriate departments",
                "status": "active",
                "created_at": "2026-05-15T14:20:00",
                "updated_at": "2026-06-06T16:45:00",
                "execution_count": 128,
                "last_execution": "2026-06-07T07:15:00",
                "last_status": "completed"
            },
            {
                "id": "wf-003",
                "name": "Lead Qualification",
                "description": "Qualify and score incoming sales leads",
                "status": "active",
                "created_at": "2026-04-20T09:00:00",
                "updated_at": "2026-06-05T11:30:00",
                "execution_count": 312,
                "last_execution": "2026-06-07T06:00:00",
                "last_status": "failed"
            },
            {
                "id": "wf-004",
                "name": "Slack Notifications",
                "description": "Send team notifications for important events",
                "status": "active",
                "created_at": "2026-06-01T13:15:00",
                "updated_at": "2026-06-07T09:00:00",
                "execution_count": 89,
                "last_execution": "2026-06-07T09:15:00",
                "last_status": "completed"
            }
        ],
        "total": 4,
        "skip": skip,
        "limit": limit
    }


@app.post("/api/workflows")
async def create_workflow(request: dict):
    return {
        "id": "wf-005",
        "name": request.get("name", "New Workflow"),
        "description": request.get("description", ""),
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


@app.get("/api/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    return {
        "id": workflow_id,
        "name": "Customer Onboarding",
        "description": "Automated workflow for new customer setup",
        "status": "active",
        "created_at": "2026-06-01T10:00:00",
        "updated_at": "2026-06-07T08:30:00",
        "definition": {
            "nodes": [
                {"id": "step-1", "type": "trigger", "name": "Manual Trigger"},
                {"id": "step-2", "type": "action", "name": "Create Account"},
                {"id": "step-3", "type": "action", "name": "Send Welcome Email"}
            ],
            "edges": [
                {"from": "step-1", "to": "step-2"},
                {"from": "step-2", "to": "step-3"}
            ]
        }
    }


# Mock Executions endpoint
@app.get("/api/executions")
async def list_executions(skip: int = 0, limit: int = 10):
    return {
        "items": [
            {
                "id": "exec-001",
                "workflow_id": "wf-001",
                "workflow_name": "Customer Onboarding",
                "status": "completed",
                "started_at": "2026-06-07T08:30:00",
                "completed_at": "2026-06-07T08:32:15",
                "duration_seconds": 135,
                "result": "success"
            },
            {
                "id": "exec-002",
                "workflow_id": "wf-002",
                "workflow_name": "Invoice Processing",
                "status": "completed",
                "started_at": "2026-06-07T07:15:00",
                "completed_at": "2026-06-07T07:18:45",
                "duration_seconds": 225,
                "result": "success"
            },
            {
                "id": "exec-003",
                "workflow_id": "wf-003",
                "workflow_name": "Lead Qualification",
                "status": "failed",
                "started_at": "2026-06-07T06:00:00",
                "completed_at": "2026-06-07T06:02:30",
                "duration_seconds": 150,
                "result": "error",
                "error": "External API timeout"
            },
            {
                "id": "exec-004",
                "workflow_id": "wf-004",
                "workflow_name": "Slack Notifications",
                "status": "running",
                "started_at": "2026-06-07T09:15:00",
                "completed_at": None,
                "duration_seconds": None,
                "result": "in_progress"
            }
        ],
        "total": 4,
        "skip": skip,
        "limit": limit
    }


@app.get("/api/workflows/{workflow_id}/executions")
async def list_workflow_executions(workflow_id: str, skip: int = 0, limit: int = 10):
    return {
        "items": [
            {
                "id": f"exec-{workflow_id}-001",
                "workflow_id": workflow_id,
                "workflow_name": "Customer Onboarding",
                "status": "completed",
                "started_at": "2026-06-07T08:30:00",
                "completed_at": "2026-06-07T08:32:15",
                "duration_seconds": 135,
                "result": "success"
            },
            {
                "id": f"exec-{workflow_id}-002",
                "workflow_id": workflow_id,
                "workflow_name": "Customer Onboarding",
                "status": "completed",
                "started_at": "2026-06-06T14:00:00",
                "completed_at": "2026-06-06T14:02:00",
                "duration_seconds": 120,
                "result": "success"
            }
        ],
        "total": 2,
        "skip": skip,
        "limit": limit
    }


@app.get("/api/executions/{execution_id}")
async def get_execution(execution_id: str):
    return {
        "id": execution_id,
        "workflow_id": "wf-001",
        "workflow_name": "Customer Onboarding",
        "status": "completed",
        "started_at": "2026-06-07T08:30:00",
        "completed_at": "2026-06-07T08:32:15",
        "duration_seconds": 135,
        "result": "success",
        "steps_executed": 3,
        "steps_passed": 3,
        "steps_failed": 0
    }


@app.get("/api/executions/{execution_id}/logs")
async def get_execution_logs(execution_id: str):
    return {
        "items": [
            {
                "timestamp": "2026-06-07T08:30:00",
                "step": "trigger",
                "level": "info",
                "message": "Workflow execution started"
            },
            {
                "timestamp": "2026-06-07T08:30:05",
                "step": "Create Account",
                "level": "info",
                "message": "Creating new customer account in system"
            },
            {
                "timestamp": "2026-06-07T08:30:15",
                "step": "Create Account",
                "level": "info",
                "message": "Account created successfully with ID: cust-12345"
            },
            {
                "timestamp": "2026-06-07T08:30:20",
                "step": "Send Welcome Email",
                "level": "info",
                "message": "Sending welcome email to customer"
            },
            {
                "timestamp": "2026-06-07T08:32:15",
                "step": "completion",
                "level": "info",
                "message": "Workflow execution completed successfully"
            }
        ]
    }


# Mock Analytics endpoint
@app.get("/api/analytics")
async def get_analytics():
    return {
        "total_workflows": 12,
        "active_workflows": 10,
        "total_executions": 1250,
        "success_rate": 94.3,
        "average_duration_seconds": 187,
        "executions_today": 45,
        "failed_today": 2,
        "integrations": {
            "slack": {"status": "healthy", "last_call": "2026-06-07T09:15:00"},
            "email": {"status": "healthy", "last_call": "2026-06-07T09:10:00"},
            "webhook": {"status": "healthy", "last_call": "2026-06-07T09:05:00"},
            "hubspot": {"status": "healthy", "last_call": "2026-06-07T08:55:00"}
        }
    }


@app.get("/api/analytics/trends")
async def get_analytics_trends():
    from datetime import timedelta
    import random
    trends = []
    base_date = datetime.now().date()
    for i in range(7):
        day = base_date - timedelta(days=6 - i)
        executions = random.randint(100, 160)
        success_rate = round(random.uniform(88, 98), 1)
        trends.append({
            "date": day.isoformat(),
            "executions": executions,
            "success_rate": success_rate,
        })
    return trends


# Mock Trigger endpoint
@app.post("/api/workflows/{workflow_id}/run")
async def trigger_workflow(workflow_id: str):
    return {
        "execution_id": "exec-new-001",
        "workflow_id": workflow_id,
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "message": "Workflow execution queued"
    }


# Mock Integrations endpoint
@app.get("/api/integrations")
async def list_integrations():
    return {
        "items": [
            {
                "id": "int-001",
                "name": "Slack",
                "type": "slack",
                "status": "connected",
                "configured": True
            },
            {
                "id": "int-002",
                "name": "Email",
                "type": "email",
                "status": "connected",
                "configured": True
            },
            {
                "id": "int-003",
                "name": "HubSpot",
                "type": "hubspot",
                "status": "connected",
                "configured": True
            },
            {
                "id": "int-004",
                "name": "Generic Webhook",
                "type": "webhook",
                "status": "configured",
                "configured": True
            }
        ]
    }


# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Mock Auth endpoints
@app.post("/api/auth/login")
async def login(request: dict):
    email = request.get("email", "")
    password = request.get("password", "")
    if not email or not password:
        return JSONResponse(status_code=400, content={"detail": "Email and password required"})
    # Demo: accept any credentials with valid email format
    return {
        "access_token": "mock-jwt-token-" + email.replace("@", "-"),
        "token_type": "bearer",
        "user": {
            "id": "user-1",
            "email": email,
            "name": email.split("@")[0].capitalize(),
            "role": "admin" if "admin" in email else "user",
        }
    }


@app.get("/api/auth/me")
async def get_current_user():
    return {
        "id": "user-1",
        "email": "admin@example.com",
        "name": "Admin",
        "role": "admin",
    }


# Mock Alerts endpoints
@app.get("/api/alerts")
async def list_alerts():
    return {
        "items": [
            {
                "id": "alert-001",
                "name": "High Failure Rate",
                "condition": "failure_rate",
                "threshold": 10,
                "status": "active",
                "notification_channels": ["slack", "email"],
            },
            {
                "id": "alert-002",
                "name": "Long Execution Time",
                "condition": "execution_duration",
                "threshold": 300,
                "status": "triggered",
                "last_triggered": datetime.now().isoformat(),
                "notification_channels": ["email"],
            },
        ],
        "total": 2
    }


@app.post("/api/alerts")
async def create_alert(request: dict):
    return {
        "id": f"alert-{datetime.now().timestamp()}",
        **request,
        "status": "active",
        "created_at": datetime.now().isoformat(),
    }


# Mock workflow versions
@app.get("/api/workflows/{workflow_id}/versions")
async def list_workflow_versions(workflow_id: str):
    return {
        "items": [
            {
                "id": f"v-{workflow_id}-3",
                "workflow_id": workflow_id,
                "version": 3,
                "created_at": datetime.now().isoformat(),
                "created_by": "admin",
                "change_summary": "Added email notification step",
            },
            {
                "id": f"v-{workflow_id}-2",
                "workflow_id": workflow_id,
                "version": 2,
                "created_at": "2026-06-06T14:00:00",
                "created_by": "admin",
                "change_summary": "Updated trigger conditions",
            },
            {
                "id": f"v-{workflow_id}-1",
                "workflow_id": workflow_id,
                "version": 1,
                "created_at": "2026-06-05T10:00:00",
                "created_by": "admin",
                "change_summary": "Initial version",
            },
        ],
        "total": 3
    }


# Mock Templates endpoints
@app.get("/api/templates")
async def list_templates(skip: int = 0, limit: int = 20, search: str = "", category: str = "", public_only: bool = True):
    templates = [
        {
            "id": "tmpl-001",
            "name": "Customer Onboarding Flow",
            "description": "Complete customer onboarding automation with email sequences",
            "category": "Integration",
            "author_name": "AI Automation Team",
            "version": 2,
            "usage_count": 145,
            "rating": 4.8,
            "review_count": 32,
            "public": True,
        },
        {
            "id": "tmpl-002",
            "name": "Invoice Processing",
            "description": "Automated invoice routing and approval workflow",
            "category": "Data Processing",
            "author_name": "Finance Team",
            "version": 1,
            "usage_count": 89,
            "rating": 4.5,
            "review_count": 18,
            "public": True,
        },
        {
            "id": "tmpl-003",
            "name": "Slack Alerts",
            "description": "Send automated Slack notifications based on triggers",
            "category": "Notification",
            "author_name": "DevOps Team",
            "version": 3,
            "usage_count": 210,
            "rating": 4.9,
            "review_count": 67,
            "public": True,
        },
        {
            "id": "tmpl-004",
            "name": "Daily Report Scheduler",
            "description": "Generate and send daily business reports automatically",
            "category": "Scheduling",
            "author_name": "Analytics Team",
            "version": 1,
            "usage_count": 55,
            "rating": 4.3,
            "review_count": 12,
            "public": True,
        },
    ]
    if search:
        templates = [t for t in templates if search.lower() in t["name"].lower() or search.lower() in t["description"].lower()]
    if category:
        templates = [t for t in templates if t["category"] == category]
    return {"templates": templates[skip:skip+limit], "total": len(templates)}


@app.post("/api/templates/{template_id}/import")
async def import_template(template_id: str):
    return {
        "id": template_id,
        "name": "Imported Template",
        "definition": {
            "nodes": [{"id": "step-1", "type": "trigger", "name": "Trigger"}],
            "edges": [],
            "description": "Imported from template",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
