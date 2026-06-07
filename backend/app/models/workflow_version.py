from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"

    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, index=True)
    definition = Column(JSON, nullable=False)
    author = Column(String(255), nullable=True)
    changelog = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    workflow = relationship("Workflow", backref="versions")

    __table_args__ = (
        Index("idx_workflow_version", "workflow_id", "version_number"),
    )
