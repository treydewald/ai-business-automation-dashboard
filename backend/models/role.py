"""
Role model for role-based access control.
"""
from typing import List, Dict, Any, Optional
from enum import Enum


class PermissionType(Enum):
    """Permission type enumeration."""
    # Workflow permissions
    WORKFLOW_CREATE = "workflow:create"
    WORKFLOW_READ = "workflow:read"
    WORKFLOW_UPDATE = "workflow:update"
    WORKFLOW_DELETE = "workflow:delete"
    WORKFLOW_EXECUTE = "workflow:execute"

    # Execution permissions
    EXECUTION_READ = "execution:read"
    EXECUTION_RETRY = "execution:retry"

    # Integration permissions
    INTEGRATION_CREATE = "integration:create"
    INTEGRATION_READ = "integration:read"
    INTEGRATION_UPDATE = "integration:update"
    INTEGRATION_DELETE = "integration:delete"

    # Analytics permissions
    ANALYTICS_READ = "analytics:read"

    # User permissions
    USER_READ = "user:read"
    USER_UPDATE = "user:update"

    # Admin permissions
    ADMIN_ACCESS = "admin:access"


class Role:
    """Role model for RBAC."""

    def __init__(
        self,
        id: Optional[str] = None,
        name: str = "",
        description: str = "",
        permissions: Optional[List[str]] = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.permissions = permissions or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": self.permissions,
        }

    def has_permission(self, permission: str) -> bool:
        """Check if role has a specific permission."""
        return permission in self.permissions


# Default roles
ADMIN_ROLE = Role(
    id="role_admin",
    name="Admin",
    description="Full access to all resources",
    permissions=[p.value for p in PermissionType],
)

USER_ROLE = Role(
    id="role_user",
    name="User",
    description="Can create and execute workflows",
    permissions=[
        PermissionType.WORKFLOW_CREATE.value,
        PermissionType.WORKFLOW_READ.value,
        PermissionType.WORKFLOW_UPDATE.value,
        PermissionType.WORKFLOW_EXECUTE.value,
        PermissionType.EXECUTION_READ.value,
        PermissionType.EXECUTION_RETRY.value,
        PermissionType.INTEGRATION_READ.value,
        PermissionType.ANALYTICS_READ.value,
        PermissionType.USER_READ.value,
    ],
)

VIEWER_ROLE = Role(
    id="role_viewer",
    name="Viewer",
    description="Read-only access",
    permissions=[
        PermissionType.WORKFLOW_READ.value,
        PermissionType.EXECUTION_READ.value,
        PermissionType.INTEGRATION_READ.value,
        PermissionType.ANALYTICS_READ.value,
    ],
)
