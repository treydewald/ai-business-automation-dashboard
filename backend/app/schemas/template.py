from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., min_length=1, max_length=100)
    definition: dict = Field(...)
    tags: Optional[List[str]] = Field(None)
    author_id: str = Field(...)
    author_name: str = Field(...)

class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    id: str
    name: str
    description: Optional[str]
    category: str
    definition: dict
    tags: Optional[List[str]]
    author_id: str
    author_name: str
    version: int
    usage_count: int
    rating: float
    review_count: int
    is_public: int
    created_at: datetime
    updated_at: datetime

class TemplateListResponse(BaseModel):
    templates: List[TemplateResponse]
    total: int
    skip: int
    limit: int
