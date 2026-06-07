from sqlalchemy import Column, String, JSON, DateTime, Index, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    definition = Column(JSON, nullable=False)  # Workflow definition
    tags = Column(JSON, nullable=True)  # List of tags
    author_id = Column(String(36), nullable=False, index=True)
    author_name = Column(String(255), nullable=False)

    version = Column(Integer, default=1, nullable=False)
    usage_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)  # Average rating
    review_count = Column(Integer, default=0)

    is_public = Column(Integer, default=1)  # 1 = public, 0 = private

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_template_category_public", "category", "is_public"),
        Index("idx_template_author_created", "author_id", "created_at"),
    )
