"""
RBAC middleware for role-based access control.
"""
from typing import Dict, List, Optional, Any
from .tenant import TenantContext
from ..models.role import Role, ADMIN_ROLE, USER_ROLE, VIEWER_ROLE


class RBACContext:
    """Context for RBAC information."""

    def __init__(
        self,
        user_id: Optional[str] = None,
        roles: Optional[List[Role]] = None,
        tenant_id: Optional[str] = None,
    ):
        self.user_id = user_id
        self.roles = roles or []
        self.tenant_id = tenant_id

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        return any(role.has_permission(permission) for role in self.roles)

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role."""
        return any(role.name == role_name for role in self.roles)

    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.has_role("Admin")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "roles": [role.to_dict() for role in self.roles],
            "tenant_id": self.tenant_id,
            "is_admin": self.is_admin(),
        }


class RBACMiddleware:
    """Middleware for RBAC enforcement."""

    # Store user roles (in production, use database)
    user_roles: Dict[str, List[str]] = {}

    @staticmethod
    def assign_role_to_user(user_id: str, role_name: str) -> None:
        """Assign a role to a user."""
        if user_id not in RBACMiddleware.user_roles:
            RBACMiddleware.user_roles[user_id] = []
        if role_name not in RBACMiddleware.user_roles[user_id]:
            RBACMiddleware.user_roles[user_id].append(role_name)

    @staticmethod
    def remove_role_from_user(user_id: str, role_name: str) -> None:
        """Remove a role from a user."""
        if user_id in RBACMiddleware.user_roles:
            if role_name in RBACMiddleware.user_roles[user_id]:
                RBACMiddleware.user_roles[user_id].remove(role_name)

    @staticmethod
    def get_user_roles(user_id: str) -> List[Role]:
        """Get all roles for a user."""
        role_names = RBACMiddleware.user_roles.get(user_id, ["Viewer"])
        role_map = {
            "Admin": ADMIN_ROLE,
            "User": USER_ROLE,
            "Viewer": VIEWER_ROLE,
        }
        return [role_map[name] for name in role_names if name in role_map]

    @staticmethod
    def create_rbac_context(
        user_id: Optional[str],
        tenant_context: Optional[TenantContext] = None,
    ) -> RBACContext:
        """Create RBAC context from user and tenant info."""
        roles = RBACMiddleware.get_user_roles(user_id) if user_id else []
        tenant_id = tenant_context.tenant_id if tenant_context else None
        return RBACContext(user_id=user_id, roles=roles, tenant_id=tenant_id)

    @staticmethod
    def require_permission(
        rbac_context: RBACContext, required_permission: str
    ) -> bool:
        """Check if RBAC context has required permission."""
        return rbac_context.has_permission(required_permission)

    @staticmethod
    def require_role(rbac_context: RBACContext, required_role: str) -> bool:
        """Check if RBAC context has required role."""
        return rbac_context.has_role(required_role)

    @staticmethod
    def require_admin(rbac_context: RBACContext) -> bool:
        """Check if RBAC context is admin."""
        return rbac_context.is_admin()

    @staticmethod
    def audit_permission_check(
        user_id: str, permission: str, granted: bool
    ) -> None:
        """Audit permission check (log for compliance)."""
        # In production, log this to an audit table
        print(
            f"[AUDIT] User {user_id} requested permission {permission}: {'GRANTED' if granted else 'DENIED'}"
        )
