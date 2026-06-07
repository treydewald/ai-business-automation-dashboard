from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List

class ExecutionLogCreate(BaseModel):
    step_name: str
    level: str
    message: str

class ExecutionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    id: str
    execution_id: str
    step_name: str
    level: str
    message: str
    timestamp: datetime

class LogsListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    logs: List[ExecutionLogResponse]
    total: int
    skip: int
    limit: int

class LogFilterParams(BaseModel):
    level: Optional[str] = None
    step_name: Optional[str] = None
    search_term: Optional[str] = None
    skip: int = 0
    limit: int = 100
