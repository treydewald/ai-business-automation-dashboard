from sqlalchemy import Column, String, JSON, DateTime, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db import Base

class WorkflowStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(500), nullable=True)
    definition = Column(JSON, nullable=False)
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.ACTIVE, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    executions = relationship("Execution", back_populates="workflow", cascade="all, delete-orphan")
    triggers = relationship("Trigger", back_populates="workflow", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_workflow_status_created", "status", "created_at"),
    )
