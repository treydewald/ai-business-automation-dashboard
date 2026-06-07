from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TriggerCreate(BaseModel):
    workflow_id: str
    type: str

class TriggerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    type: str
    webhook_id: Optional[str]
    created_at: datetime
    updated_at: datetime
