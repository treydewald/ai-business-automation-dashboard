from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.api.routes import workflows, classification, schedules, triggers, logs, executions, health, integrations

app = FastAPI(
    title="AI Business Automation Dashboard API",
    description="Workflow automation engine for business operations",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Include routers
app.include_router(workflows.router)
app.include_router(classification.router)
app.include_router(schedules.router)
app.include_router(triggers.router)
app.include_router(logs.router)
app.include_router(executions.router)
app.include_router(health.router)
app.include_router(integrations.router)

@app.get("/")
async def root():
    return {"message": "AI Business Automation Dashboard API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
