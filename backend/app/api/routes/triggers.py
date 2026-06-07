from fastapi import APIRouter, HTTPException, Depends, Request, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models.trigger import Trigger, TriggerType
from app.models.workflow import Workflow
from app.models.execution import Execution, ExecutionStatus
from app.services.trigger_service import TriggerService
from app.schemas.trigger import TriggerCreate, TriggerResponse
import uuid
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/triggers", tags=["triggers"])

@router.post("/workflows/{workflow_id}/triggers", response_model=TriggerResponse)
async def create_trigger(
    workflow_id: str,
    trigger_data: TriggerCreate,
    db: Session = Depends(get_db)
):
    """Create a new trigger for a workflow"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        trigger_type = TriggerType(trigger_data.type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid trigger type. Must be one of: {', '.join([t.value for t in TriggerType])}"
        )

    trigger = TriggerService.create_trigger(
        db=db,
        workflow_id=workflow_id,
        trigger_type=trigger_type,
        config=trigger_data.config
    )

    return trigger

@router.get("/workflows/{workflow_id}/triggers", response_model=List[TriggerResponse])
async def list_workflow_triggers(
    workflow_id: str,
    db: Session = Depends(get_db)
):
    """List all triggers for a workflow"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    triggers = TriggerService.get_workflow_triggers(db, workflow_id)
    return triggers

@router.get("/triggers/{trigger_id}", response_model=TriggerResponse)
async def get_trigger(
    trigger_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific trigger"""
    trigger = TriggerService.get_trigger(db, trigger_id)
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return trigger

@router.delete("/triggers/{trigger_id}")
async def delete_trigger(
    trigger_id: str,
    db: Session = Depends(get_db)
):
    """Delete a trigger"""
    if not TriggerService.delete_trigger(db, trigger_id):
        raise HTTPException(status_code=404, detail="Trigger not found")
    return {"status": "deleted"}

@router.post("/workflows/{workflow_id}/run")
async def trigger_manual_execution(
    workflow_id: str,
    db: Session = Depends(get_db)
):
    """Manually trigger a workflow execution"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    execution = Execution(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        status=ExecutionStatus.PENDING,
        created_at=datetime.utcnow()
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    logger.info(f"Manual trigger initiated for workflow {workflow_id}, execution {execution.id}")

    return {
        "execution_id": execution.id,
        "workflow_id": workflow_id,
        "status": execution.status.value,
        "created_at": execution.created_at.isoformat()
    }

@router.post("/webhooks/{webhook_id}")
async def webhook_trigger(
    webhook_id: str,
    request: Request,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Webhook endpoint for triggering workflows"""
    body = await request.body()

    if not x_signature:
        raise HTTPException(status_code=400, detail="Missing X-Signature header")

    trigger = TriggerService.verify_webhook(db, webhook_id, body, x_signature)
    if not trigger:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    execution = Execution(
        id=str(uuid.uuid4()),
        workflow_id=trigger.workflow_id,
        status=ExecutionStatus.PENDING,
        context=payload,
        created_at=datetime.utcnow()
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    logger.info(f"Webhook trigger received for workflow {trigger.workflow_id}, execution {execution.id}")

    return {
        "execution_id": execution.id,
        "workflow_id": trigger.workflow_id,
        "status": execution.status.value,
        "created_at": execution.created_at.isoformat()
    }
