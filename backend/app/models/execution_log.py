from sqlalchemy import Column, String, DateTime, JSON, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db import Base

class LogLevel(str, enum.Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(String(36), primary_key=True, index=True)
    execution_id = Column(String(36), ForeignKey("executions.id"), nullable=False, index=True)
    step_name = Column(String(255), nullable=False, index=True)
    level = Column(Enum(LogLevel), default=LogLevel.INFO, index=True)
    message = Column(String(2000), nullable=False)
    context_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    execution = relationship("Execution", back_populates="logs")

    __table_args__ = (
        Index("idx_log_execution_step", "execution_id", "step_name"),
        Index("idx_log_execution_level", "execution_id", "level"),
    )
