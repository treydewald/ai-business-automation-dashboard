from sqlalchemy import Column, String, JSON, DateTime, Enum, Index, Boolean, Float
from datetime import datetime
import enum
from app.db import Base

class AlertCondition(str, enum.Enum):
    FAILURE_RATE = "failure_rate"
    EXECUTION_DURATION = "execution_duration"
    ERROR_TYPE = "error_type"
    INTEGRATION_ERROR = "integration_error"

class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    SNOOZED = "snoozed"
    DISABLED = "disabled"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(500), nullable=True)
    condition = Column(Enum(AlertCondition), nullable=False)
    threshold = Column(Float, nullable=False)

    # Notification configuration
    notification_channels = Column(JSON, nullable=False)  # ["email", "slack", "webhook"]
    notification_config = Column(JSON, nullable=True)  # Channel-specific configs

    # Alert status
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, index=True)
    is_enabled = Column(Boolean, default=True)

    # Workflow specific alerts (optional - null means all workflows)
    workflow_id = Column(String(36), nullable=True, index=True)

    # Snoze configuration
    snoozed_until = Column(DateTime, nullable=True)
    snoozed_by_user_id = Column(String(36), nullable=True)

    # Metadata
    created_by_id = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_alert_workflow_status", "workflow_id", "status"),
        Index("idx_alert_condition_enabled", "condition", "is_enabled"),
    )
