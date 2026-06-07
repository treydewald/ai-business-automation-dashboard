import uuid
import logging as stdlib_logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.execution_log import ExecutionLog, LogLevel

logger = stdlib_logging.getLogger(__name__)

class LoggingService:
    @staticmethod
    def create_log(
        db: Session,
        execution_id: str,
        step_name: str,
        level: LogLevel,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> ExecutionLog:
        """Create a structured execution log entry"""
        log_entry = ExecutionLog(
            id=str(uuid.uuid4()),
            execution_id=execution_id,
            step_name=step_name,
            level=level,
            message=message,
            context_json=context,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.info(f"Log created for execution {execution_id}: {step_name} [{level.value}]")
        return log_entry

    @staticmethod
    def get_execution_logs(
        db: Session,
        execution_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ExecutionLog], int]:
        """Get paginated logs for an execution"""
        total = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id
        ).count()

        logs = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id
        ).order_by(ExecutionLog.timestamp.asc()).offset(skip).limit(limit).all()

        return logs, total

    @staticmethod
    def get_logs_by_level(
        db: Session,
        execution_id: str,
        level: LogLevel,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ExecutionLog], int]:
        """Get logs filtered by level"""
        total = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.level == level
        ).count()

        logs = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.level == level
        ).order_by(ExecutionLog.timestamp.asc()).offset(skip).limit(limit).all()

        return logs, total

    @staticmethod
    def get_logs_by_step(
        db: Session,
        execution_id: str,
        step_name: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ExecutionLog], int]:
        """Get logs filtered by step name"""
        total = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.step_name == step_name
        ).count()

        logs = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.step_name == step_name
        ).order_by(ExecutionLog.timestamp.asc()).offset(skip).limit(limit).all()

        return logs, total

    @staticmethod
    def get_logs_by_time_range(
        db: Session,
        execution_id: str,
        start_time: datetime,
        end_time: datetime,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ExecutionLog], int]:
        """Get logs within a time range"""
        total = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.timestamp >= start_time,
            ExecutionLog.timestamp <= end_time
        ).count()

        logs = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.timestamp >= start_time,
            ExecutionLog.timestamp <= end_time
        ).order_by(ExecutionLog.timestamp.asc()).offset(skip).limit(limit).all()

        return logs, total

    @staticmethod
    def search_logs(
        db: Session,
        execution_id: str,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ExecutionLog], int]:
        """Search logs by message content"""
        total = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.message.contains(search_term)
        ).count()

        logs = db.query(ExecutionLog).filter(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.message.contains(search_term)
        ).order_by(ExecutionLog.timestamp.asc()).offset(skip).limit(limit).all()

        return logs, total

    @staticmethod
    def delete_old_logs(
        db: Session,
        retention_days: int = 30
    ) -> int:
        """Delete logs older than retention period"""
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        deleted_count = db.query(ExecutionLog).filter(
            ExecutionLog.timestamp < cutoff_date
        ).delete()
        db.commit()
        logger.info(f"Deleted {deleted_count} execution logs older than {retention_days} days")
        return deleted_count

    @staticmethod
    def get_log_levels() -> List[str]:
        """Get all available log levels"""
        return [level.value for level in LogLevel]
