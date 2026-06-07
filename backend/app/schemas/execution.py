from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class ExecutionCreate(BaseModel):
    workflow_id: str

class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    retry_count: str
    duration_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
