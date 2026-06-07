import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from app.models.workflow_version import WorkflowVersion
from app.models.workflow import Workflow
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class VersioningService:
    """Service for managing workflow versions."""

    @staticmethod
    def create_version(
        session: Session,
        workflow_id: str,
        definition: Dict[str, Any],
        author: Optional[str] = None,
        changelog: Optional[str] = None
    ) -> WorkflowVersion:
        """Create a new version of a workflow."""
        workflow = session.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        latest_version = (
            session.query(WorkflowVersion)
            .filter(WorkflowVersion.workflow_id == workflow_id)
            .order_by(WorkflowVersion.version_number.desc())
            .first()
        )

        version_number = (latest_version.version_number + 1) if latest_version else 1

        version = WorkflowVersion(
            id=f"{workflow_id}_v{version_number}",
            workflow_id=workflow_id,
            version_number=version_number,
            definition=definition,
            author=author,
            changelog=changelog or "No changelog provided"
        )

        session.add(version)
        session.commit()
        logger.info(f"Created version {version_number} for workflow {workflow_id}")

        return version

    @staticmethod
    def get_version(
        session: Session,
        workflow_id: str,
        version_number: int
    ) -> Optional[WorkflowVersion]:
        """Get a specific version of a workflow."""
        return (
            session.query(WorkflowVersion)
            .filter(
                WorkflowVersion.workflow_id == workflow_id,
                WorkflowVersion.version_number == version_number
            )
            .first()
        )

    @staticmethod
    def get_version_history(
        session: Session,
        workflow_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[WorkflowVersion], int]:
        """Get version history for a workflow."""
        query = (
            session.query(WorkflowVersion)
            .filter(WorkflowVersion.workflow_id == workflow_id)
            .order_by(WorkflowVersion.version_number.desc())
        )

        total = query.count()
        versions = query.limit(limit).offset(offset).all()

        return versions, total

    @staticmethod
    def get_latest_version(
        session: Session,
        workflow_id: str
    ) -> Optional[WorkflowVersion]:
        """Get the latest version of a workflow."""
        return (
            session.query(WorkflowVersion)
            .filter(WorkflowVersion.workflow_id == workflow_id)
            .order_by(WorkflowVersion.version_number.desc())
            .first()
        )

    @staticmethod
    def rollback_to_version(
        session: Session,
        workflow_id: str,
        version_number: int,
        author: Optional[str] = None
    ) -> WorkflowVersion:
        """Rollback to a previous version by creating a new version."""
        version = VersioningService.get_version(session, workflow_id, version_number)
        if not version:
            raise ValueError(
                f"Version {version_number} not found for workflow {workflow_id}"
            )

        new_version = VersioningService.create_version(
            session,
            workflow_id,
            version.definition,
            author=author,
            changelog=f"Rolled back to version {version_number}"
        )

        return new_version

    @staticmethod
    def get_diff(
        session: Session,
        workflow_id: str,
        version1: int,
        version2: int
    ) -> Dict[str, Any]:
        """Get differences between two versions."""
        v1 = VersioningService.get_version(session, workflow_id, version1)
        v2 = VersioningService.get_version(session, workflow_id, version2)

        if not v1 or not v2:
            raise ValueError("One or both versions not found")

        diff = {
            "version1": version1,
            "version2": version2,
            "changes": VersioningService._compute_diff(v1.definition, v2.definition)
        }

        return diff

    @staticmethod
    def _compute_diff(obj1: Any, obj2: Any) -> Dict[str, Any]:
        """Compute differences between two objects."""
        changes = {"added": [], "removed": [], "modified": []}

        if isinstance(obj1, dict) and isinstance(obj2, dict):
            all_keys = set(obj1.keys()) | set(obj2.keys())

            for key in all_keys:
                if key not in obj1:
                    changes["added"].append({f"{key}": obj2[key]})
                elif key not in obj2:
                    changes["removed"].append({f"{key}": obj1[key]})
                elif obj1[key] != obj2[key]:
                    changes["modified"].append({
                        "key": key,
                        "old": obj1[key],
                        "new": obj2[key]
                    })

        return changes
