from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

class ExecutionLogCreate(BaseModel):
    step_name: str
    level: str
    message: str
    context: Optional[Dict[str, Any]] = None

class ExecutionLogResponse(BaseModel):
    id: str
    execution_id: str
    step_name: str
    level: str
    message: str
    context_json: Optional[Dict[str, Any]]
    timestamp: datetime

    class Config:
        from_attributes = True

class LogsListResponse(BaseModel):
    logs: List[ExecutionLogResponse]
    total: int
    skip: int
    limit: int

    class Config:
        from_attributes = True

class LogFilterParams(BaseModel):
    level: Optional[str] = None
    step_name: Optional[str] = None
    search_term: Optional[str] = None
    skip: int = 0
    limit: int = 100
