from sqlalchemy import Column, String, JSON, DateTime, Enum, Index, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db import Base


class IntegrationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    TESTING = "testing"


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    credentials = Column(Text, nullable=False)  # Encrypted JSON string
    config = Column(JSON, nullable=True)
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.ACTIVE, index=True)
    last_tested_at = Column(DateTime, nullable=True)
    last_error = Column(String(500), nullable=True)
    call_count = Column(String, default="0", nullable=False)
    rate_limit_remaining = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_integration_type_status", "type", "status"),
        Index("idx_integration_created", "created_at"),
    )
