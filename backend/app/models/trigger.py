from sqlalchemy import Column, String, DateTime, JSON, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db import Base

class TriggerType(str, enum.Enum):
    MANUAL = "manual"
    WEBHOOK = "webhook"
    SCHEDULE = "schedule"

class Trigger(Base):
    __tablename__ = "triggers"

    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False, index=True)
    type = Column(Enum(TriggerType), nullable=False, index=True)
    config = Column(JSON, nullable=False)
    webhook_id = Column(String(36), unique=True, nullable=True, index=True)
    webhook_secret = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    workflow = relationship("Workflow", back_populates="triggers")

    __table_args__ = (
        Index("idx_trigger_workflow_type", "workflow_id", "type"),
    )
