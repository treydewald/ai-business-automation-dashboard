from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    definition: Dict[str, Any] = Field(..., description="DAG definition in JSON format")

class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    definition: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    definition: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
