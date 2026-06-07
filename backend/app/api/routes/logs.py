from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db import get_db
from app.models.execution import Execution
from app.models.execution_log import LogLevel
from app.services.logging_service import LoggingService
from app.schemas.log import ExecutionLogResponse, LogsListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["logs"])

@router.get("/executions/{execution_id}/logs", response_model=LogsListResponse)
async def get_execution_logs(
    execution_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all logs for an execution with pagination"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    logs, total = LoggingService.get_execution_logs(db, execution_id, skip, limit)
    return {
        "logs": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/executions/{execution_id}/logs/level", response_model=LogsListResponse)
async def get_logs_by_level(
    execution_id: str,
    level: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get logs filtered by level"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    try:
        log_level = LogLevel(level.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid log level. Must be one of: {', '.join([l.value for l in LogLevel])}"
        )

    logs, total = LoggingService.get_logs_by_level(db, execution_id, log_level, skip, limit)
    return {
        "logs": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/executions/{execution_id}/logs/step", response_model=LogsListResponse)
async def get_logs_by_step(
    execution_id: str,
    step_name: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get logs filtered by step name"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    logs, total = LoggingService.get_logs_by_step(db, execution_id, step_name, skip, limit)
    return {
        "logs": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/executions/{execution_id}/logs/search", response_model=LogsListResponse)
async def search_logs(
    execution_id: str,
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Search logs by message content"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    logs, total = LoggingService.search_logs(db, execution_id, q, skip, limit)
    return {
        "logs": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/logs/levels")
async def get_available_log_levels():
    """Get all available log levels"""
    return {
        "levels": LoggingService.get_log_levels()
    }

@router.post("/logs/cleanup")
async def cleanup_old_logs(
    retention_days: int = 30,
    db: Session = Depends(get_db)
):
    """Delete logs older than retention period (admin only)"""
    if retention_days < 1:
        raise HTTPException(status_code=400, detail="Retention days must be at least 1")

    deleted_count = LoggingService.delete_old_logs(db, retention_days)
    return {
        "deleted_count": deleted_count,
        "retention_days": retention_days
    }
