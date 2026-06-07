from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class IntegrationCreate(BaseModel):
    type: str = Field(..., description="Integration type (e.g., slack, email)")
    name: str = Field(..., description="Display name for integration")
    credentials: Dict[str, Any] = Field(..., description="Integration credentials")
    config: Optional[Dict[str, Any]] = Field(None, description="Additional configuration")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "slack",
                "name": "Production Slack",
                "credentials": {"webhook_url": "https://..."},
                "config": {"timeout": 30}
            }
        }


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None


class IntegrationResponse(BaseModel):
    id: str
    type: str
    name: str
    status: str
    call_count: str
    rate_limit_remaining: Optional[str]
    last_tested_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IntegrationTestRequest(BaseModel):
    pass


class IntegrationTestResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None
