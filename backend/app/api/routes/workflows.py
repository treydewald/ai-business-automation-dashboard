from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.db import get_db
from app.models import Workflow, WorkflowStatus
from app.models.execution import Execution, ExecutionStatus
from app.schemas import WorkflowCreate, WorkflowUpdate, WorkflowResponse
from app.schemas.execution import ExecutionListResponse
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("", response_model=WorkflowResponse, status_code=201)
def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    db_workflow = Workflow(
        id=str(uuid.uuid4()),
        name=workflow.name,
        description=workflow.description,
        definition=workflow.definition,
        status=WorkflowStatus.ACTIVE,
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("", response_model=list[WorkflowResponse])
def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Workflow).filter(Workflow.deleted_at == None)

    if status:
        try:
            query = query.filter(Workflow.status == WorkflowStatus[status.upper()])
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")

    if search:
        query = query.filter(Workflow.name.ilike(f"%{search}%"))

    total = query.count()
    workflows = query.order_by(desc(Workflow.created_at)).offset(skip).limit(limit).all()

    return workflows

@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.deleted_at == None
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow

@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    db: Session = Depends(get_db)
):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.deleted_at == None
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow_update.name:
        workflow.name = workflow_update.name
    if workflow_update.description is not None:
        workflow.description = workflow_update.description
    if workflow_update.definition:
        workflow.definition = workflow_update.definition
    if workflow_update.status:
        try:
            workflow.status = WorkflowStatus[workflow_update.status.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")

    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.deleted_at == None
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow.deleted_at = datetime.utcnow()
    db.commit()

@router.get("/{workflow_id}/executions", response_model=ExecutionListResponse)
def get_workflow_executions(
    workflow_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get execution history for a workflow with pagination and filtering"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.deleted_at == None
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    query = db.query(Execution).filter(Execution.workflow_id == workflow_id)

    if status:
        try:
            status_enum = ExecutionStatus(status.lower())
            query = query.filter(Execution.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join([s.value for s in ExecutionStatus])}"
            )

    total = query.count()
    executions = query.order_by(Execution.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "executions": [
            {
                "id": e.id,
                "workflow_id": e.workflow_id,
                "status": e.status.value,
                "started_at": e.started_at,
                "completed_at": e.completed_at,
                "duration_seconds": e.duration_seconds,
                "created_at": e.created_at,
                "updated_at": e.updated_at
            }
            for e in executions
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
