from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class ExecutionCreate(BaseModel):
    workflow_id: str

class ExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: str
    duration_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime

class ExecutionDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    error_message: Optional[str]
    retry_count: int
    created_at: datetime
    updated_at: datetime
    log_count: int = 0

class ExecutionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    executions: List[ExecutionResponse]
    total: int
    skip: int
    limit: int
