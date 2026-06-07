from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from app.db import get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.workflow import Workflow
from app.services.logging_service import LoggingService
from app.schemas.execution import ExecutionResponse, ExecutionListResponse, ExecutionDetailResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/executions", tags=["executions"])

@router.get("/{execution_id}", response_model=ExecutionDetailResponse)
async def get_execution(
    execution_id: str,
    db: Session = Depends(get_db)
):
    """Get full execution details including status, logs, and results"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    logs, log_count = LoggingService.get_execution_logs(db, execution_id, skip=0, limit=100)

    return {
        "id": execution.id,
        "workflow_id": execution.workflow_id,
        "status": execution.status.value,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at,
        "duration_seconds": execution.duration_seconds,
        "error_message": execution.error_message,
        "retry_count": int(execution.retry_count) if execution.retry_count else 0,
        "created_at": execution.created_at,
        "updated_at": execution.updated_at,
        "log_count": log_count
    }

@router.get("/workflows/{workflow_id}/executions", response_model=ExecutionListResponse)
async def get_workflow_executions(
    workflow_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get execution history for a workflow with pagination"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    query = db.query(Execution).filter(Execution.workflow_id == workflow_id)

    if status:
        try:
            status_enum = ExecutionStatus(status.lower())
            query = query.filter(Execution.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join([s.value for s in ExecutionStatus])}"
            )

    total = query.count()
    executions = query.order_by(Execution.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "executions": [
            {
                "id": e.id,
                "workflow_id": e.workflow_id,
                "status": e.status.value,
                "started_at": e.started_at,
                "completed_at": e.completed_at,
                "duration_seconds": e.duration_seconds,
                "created_at": e.created_at,
                "updated_at": e.updated_at
            }
            for e in executions
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("", response_model=ExecutionListResponse)
async def get_recent_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    hours: int = Query(24, ge=1),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get recent executions across all workflows"""
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    query = db.query(Execution).filter(Execution.created_at >= cutoff_time)

    if status:
        try:
            status_enum = ExecutionStatus(status.lower())
            query = query.filter(Execution.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join([s.value for s in ExecutionStatus])}"
            )

    total = query.count()
    executions = query.order_by(Execution.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "executions": [
            {
                "id": e.id,
                "workflow_id": e.workflow_id,
                "status": e.status.value,
                "started_at": e.started_at,
                "completed_at": e.completed_at,
                "duration_seconds": e.duration_seconds,
                "created_at": e.created_at,
                "updated_at": e.updated_at
            }
            for e in executions
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
