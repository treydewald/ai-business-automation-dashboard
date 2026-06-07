from sqlalchemy import Column, String, DateTime, JSON, Enum, ForeignKey, Float, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db import Base

class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"

class Execution(Base):
    __tablename__ = "executions"

    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False, index=True)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.PENDING, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result = Column(JSON, nullable=True)
    context = Column(JSON, nullable=True)
    error_message = Column(String(1000), nullable=True)
    retry_count = Column(String(10), default="0", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    duration_seconds = Column(Float, nullable=True)

    workflow = relationship("Workflow", back_populates="executions")
    logs = relationship("ExecutionLog", back_populates="execution", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_execution_workflow_status", "workflow_id", "status"),
        Index("idx_execution_status_created", "status", "created_at"),
    )
