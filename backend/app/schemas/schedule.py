"""Schedule schemas for API validation"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from croniter import croniter


class ScheduleCreate(BaseModel):
    """Schema for creating a schedule"""
    workflow_id: str = Field(..., description="ID of workflow to schedule")
    cron_expression: str = Field(..., description="Cron expression (e.g., '0 9 * * MON-FRI')")
    timezone: str = Field(default="UTC", description="Timezone for schedule (e.g., 'America/New_York')")
    description: Optional[str] = Field(None, description="Schedule description")
    enabled: bool = Field(default=True, description="Whether schedule is active")
    max_instances: int = Field(default=1, description="Max concurrent executions")

    @validator("cron_expression")
    def validate_cron(cls, v):
        """Validate cron expression"""
        try:
            croniter(v)
            return v
        except Exception as e:
            raise ValueError(f"Invalid cron expression: {str(e)}")


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule"""
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    max_instances: Optional[int] = None


class ScheduleResponse(BaseModel):
    """Schedule response schema"""
    id: str
    workflow_id: str
    cron_expression: str
    timezone: str
    description: Optional[str]
    enabled: bool
    max_instances: int
    next_run: Optional[str] = Field(None, description="ISO format datetime of next scheduled run")
    last_run: Optional[str] = Field(None, description="ISO format datetime of last execution")
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ScheduleHistoryResponse(BaseModel):
    """Schedule execution history entry"""
    id: str
    schedule_id: str
    workflow_id: str
    execution_id: Optional[str]
    status: str  # scheduled, running, completed, failed
    started_at: Optional[str]
    completed_at: Optional[str]
    error: Optional[str]
    created_at: str

    class Config:
        from_attributes = True
