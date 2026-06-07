"""
Audit log model for compliance and tracking.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class AuditAction(Enum):
    """Audit action enumeration."""
    # User actions
    USER_LOGIN = "user:login"
    USER_LOGOUT = "user:logout"
    USER_REGISTER = "user:register"

    # Workflow actions
    WORKFLOW_CREATE = "workflow:create"
    WORKFLOW_UPDATE = "workflow:update"
    WORKFLOW_DELETE = "workflow:delete"
    WORKFLOW_EXECUTE = "workflow:execute"

    # Execution actions
    EXECUTION_COMPLETED = "execution:completed"
    EXECUTION_FAILED = "execution:failed"

    # Integration actions
    INTEGRATION_CREATE = "integration:create"
    INTEGRATION_UPDATE = "integration:update"
    INTEGRATION_DELETE = "integration:delete"

    # Role actions
    ROLE_ASSIGNED = "role:assigned"
    ROLE_REMOVED = "role:removed"

    # Tenant actions
    TENANT_CREATED = "tenant:created"
    TENANT_MEMBER_ADDED = "tenant:member_added"
    TENANT_MEMBER_REMOVED = "tenant:member_removed"


class AuditLog:
    """Audit log entry model."""

    def __init__(
        self,
        id: Optional[str] = None,
        user_id: Optional[str] = None,
        action: str = "",
        resource_type: str = "",
        resource_id: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None,
        before_value: Optional[Dict[str, Any]] = None,
        after_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        tenant_id: Optional[str] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.action = action
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.changes = changes or {}
        self.before_value = before_value or {}
        self.after_value = after_value or {}
        self.ip_address = ip_address
        self.timestamp = timestamp or datetime.utcnow()
        self.tenant_id = tenant_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "changes": self.changes,
            "before_value": self.before_value,
            "after_value": self.after_value,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "tenant_id": self.tenant_id,
        }

    @staticmethod
    def mask_sensitive_fields(data: Dict[str, Any]) -> Dict[str, Any]:
        """Mask sensitive fields in audit data."""
        sensitive_fields = {
            "password",
            "password_hash",
            "token",
            "secret",
            "api_key",
            "credentials",
        }

        masked = {}
        for key, value in data.items():
            if any(sens in key.lower() for sens in sensitive_fields):
                masked[key] = "***REDACTED***"
            else:
                masked[key] = value

        return masked
