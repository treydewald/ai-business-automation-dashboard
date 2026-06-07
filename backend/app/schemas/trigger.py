from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class TriggerCreate(BaseModel):
    workflow_id: str
    type: str
    config: Dict[str, Any]

class TriggerResponse(BaseModel):
    id: str
    workflow_id: str
    type: str
    config: Dict[str, Any]
    webhook_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
