from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)

class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None

class WorkflowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
