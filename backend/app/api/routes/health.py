from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.db import get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.workflow import Workflow
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """System health check with database status"""
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "version": "0.1.0"
    }

@router.get("/status")
async def system_status(db: Session = Depends(get_db)):
    """Get detailed system status and metrics"""
    try:
        total_workflows = db.query(Workflow).count()
        total_executions = db.query(Execution).count()

        pending = db.query(Execution).filter(Execution.status == ExecutionStatus.PENDING).count()
        running = db.query(Execution).filter(Execution.status == ExecutionStatus.RUNNING).count()
        completed = db.query(Execution).filter(Execution.status == ExecutionStatus.COMPLETED).count()
        failed = db.query(Execution).filter(Execution.status == ExecutionStatus.FAILED).count()

        success_rate = 0.0
        if total_executions > 0:
            success_rate = round((completed / total_executions) * 100, 2)

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "workflows": {
                    "total": total_workflows
                },
                "executions": {
                    "total": total_executions,
                    "pending": pending,
                    "running": running,
                    "completed": completed,
                    "failed": failed,
                    "success_rate_percent": success_rate
                }
            }
        }
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@router.get("/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness check for load balancers"""
    try:
        db.execute("SELECT 1")
        return {"ready": True, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return {"ready": False, "timestamp": datetime.utcnow().isoformat(), "error": str(e)}
