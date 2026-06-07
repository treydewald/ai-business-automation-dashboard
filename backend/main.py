"""
AI Business Automation Dashboard API
Comprehensive REST API for workflow automation, execution tracking, and analytics.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import logging

# Import caching middleware
from app.middleware.caching import CachingMiddleware, CacheInvalidationMiddleware

# Import routers (with try/except for optional modules)
try:
    from routers import (
        analytics, auth, tenants, rbac, audit
    )
except ImportError:
    analytics = auth = tenants = rbac = audit = None

# Initialize FastAPI app
app = FastAPI(
    title="AI Business Automation Dashboard API",
    description="Comprehensive REST API for workflow automation, execution tracking, and business intelligence",
    version="1.0.0",
    contact={
        "name": "Support Team",
        "email": "support@example.com",
        "url": "https://example.com/support",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure caching middleware (order matters: invalidation first, then caching)
app.add_middleware(CacheInvalidationMiddleware)
app.add_middleware(CachingMiddleware)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom OpenAPI schema with comprehensive documentation
def custom_openapi():
    """Generate comprehensive OpenAPI schema with extended documentation."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="""
# AI Business Automation Dashboard API

Enterprise-grade REST API for workflow automation and business intelligence.

## Core Features

- **Workflow Management**: Create, edit, execute, and monitor automated workflows
- **Execution Tracking**: Real-time execution status, logs, and history
- **Analytics & Reporting**: Business intelligence and performance metrics
- **Multi-tenancy**: Complete tenant isolation and management
- **Role-Based Access Control**: Granular permission management
- **Audit Logging**: Complete compliance and audit trail

## Authentication

All endpoints require JWT authentication (except public endpoints).

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use returned token for subsequent requests

## Rate Limiting

API requests are rate-limited to 100 requests per minute per authenticated user.
Current usage is included in response headers:
- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Error Handling

All errors follow a standard format:

```json
{
  "detail": "Error description",
  "code": "error_code"
}
```

### HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **204 No Content**: Request succeeded, no content to return
- **400 Bad Request**: Invalid parameters or malformed request
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Authenticated but lacking permissions
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (e.g., duplicate)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Pagination

Endpoints that return collections support pagination:

```
GET /api/workflows?limit=20&offset=0
```

Parameters:
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Starting position (default: 0)

Response includes:
- `total`: Total number of items
- `limit`: Items per page
- `offset`: Current offset
- `items`: Array of items

## API Versioning

API version is included in the URL path. Current version: `v1`

Breaking changes will bump the major version.

## Webhook Events

The API can send webhook notifications for important events:
- Execution completed
- Execution failed
- Workflow created/updated
- Integration error

Configure webhooks in your tenant settings.

## SDKs

Official SDKs available for:
- Python: `pip install automation-dashboard-sdk`
- JavaScript: `npm install automation-dashboard-sdk`
- Go: `go get github.com/example/automation-dashboard-go`

""",
        routes=app.routes,
        tags=[
            {"name": "analytics", "description": "Analytics and metrics endpoints"},
            {"name": "auth", "description": "User authentication and authorization"},
            {"name": "tenants", "description": "Multi-tenant management"},
            {"name": "rbac", "description": "Role-based access control"},
            {"name": "audit", "description": "Audit logging and compliance"},
        ],
    )

    # Add security scheme
    openapi_schema["components"] = {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT token obtained from /api/auth/login",
            }
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Include routers
if analytics:
    app.include_router(analytics.router)
if auth:
    app.include_router(auth.router)
if tenants:
    app.include_router(tenants.router)
if rbac:
    app.include_router(rbac.router)
if audit:
    app.include_router(audit.router)


@app.get("/", tags=["General"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "AI Business Automation Dashboard API",
        "version": "1.0.0",
        "status": "operational",
        "docs": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
    }


@app.get("/health", tags=["General"], summary="Health Check")
async def health_check():
    """
    Health check endpoint.
    Returns 200 if API is operational.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    }


@app.get("/api", tags=["General"], summary="API Information")
async def api_info():
    """Get comprehensive API information and endpoints."""
    return {
        "title": "AI Business Automation Dashboard API",
        "version": "1.0.0",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_spec": "/openapi.json",
        },
        "endpoints_summary": {
            "analytics": "/api/analytics",
            "auth": "/api/auth",
            "tenants": "/api/tenants",
            "rbac": "/api/rbac",
            "audit": "/api/audit-logs",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
