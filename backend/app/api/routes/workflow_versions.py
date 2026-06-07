import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.models.workflow import Workflow
from app.models.workflow_version import WorkflowVersion
from app.services.versioning_service import VersioningService
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workflows", tags=["workflow-versions"])


class VersionResponse(BaseModel):
    id: str
    workflow_id: str
    version_number: int
    author: Optional[str]
    changelog: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class VersionHistoryResponse(BaseModel):
    versions: list[VersionResponse]
    total: int
    limit: int
    offset: int


class VersionDiffResponse(BaseModel):
    version1: int
    version2: int
    changes: dict


class RollbackRequest(BaseModel):
    author: Optional[str] = None


@router.get("/{workflow_id}/versions", response_model=VersionHistoryResponse)
def get_workflow_versions(
    workflow_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_db)
):
    """Get version history for a workflow."""
    workflow = session.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    versions, total = VersioningService.get_version_history(
        session, workflow_id, limit, offset
    )

    return VersionHistoryResponse(
        versions=[
            VersionResponse(
                id=v.id,
                workflow_id=v.workflow_id,
                version_number=v.version_number,
                author=v.author,
                changelog=v.changelog,
                created_at=v.created_at.isoformat()
            )
            for v in versions
        ],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{workflow_id}/versions/{version_number}")
def get_workflow_version(
    workflow_id: str,
    version_number: int,
    session: Session = Depends(get_db)
):
    """Get a specific version of a workflow."""
    version = VersioningService.get_version(session, workflow_id, version_number)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "id": version.id,
        "workflow_id": version.workflow_id,
        "version_number": version.version_number,
        "definition": version.definition,
        "author": version.author,
        "changelog": version.changelog,
        "created_at": version.created_at.isoformat()
    }


@router.post("/{workflow_id}/versions/{version_number}/rollback")
def rollback_workflow_version(
    workflow_id: str,
    version_number: int,
    request: RollbackRequest,
    session: Session = Depends(get_db)
):
    """Rollback to a previous version by creating a new version."""
    workflow = session.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        new_version = VersioningService.rollback_to_version(
            session,
            workflow_id,
            version_number,
            author=request.author
        )

        return {
            "status": "success",
            "message": f"Rolled back to version {version_number}",
            "new_version": {
                "id": new_version.id,
                "version_number": new_version.version_number,
                "created_at": new_version.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Rollback failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Rollback failed")


@router.get("/{workflow_id}/versions/compare", response_model=VersionDiffResponse)
def compare_versions(
    workflow_id: str,
    version1: int,
    version2: int,
    session: Session = Depends(get_db)
):
    """Compare two versions of a workflow."""
    try:
        diff = VersioningService.get_diff(session, workflow_id, version1, version2)
        return VersionDiffResponse(**diff)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Comparison failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Comparison failed")
