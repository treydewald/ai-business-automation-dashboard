"""
RBAC API routes for managing roles and permissions.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Dict, List, Any, Optional

from ..middleware.rbac import RBACMiddleware, RBACContext
from ..models.role import ADMIN_ROLE, USER_ROLE, VIEWER_ROLE

router = APIRouter(prefix="/api/rbac", tags=["rbac"])


@router.post("/users/{user_id}/roles")
async def assign_role(
    user_id: str,
    role_name: str = "",
    admin_user_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Assign a role to a user."""
    if not admin_user_id:
        raise HTTPException(status_code=401, detail="Admin authentication required")

    # Check if requester is admin
    admin_context = RBACMiddleware.create_rbac_context(admin_user_id)
    if not admin_context.is_admin():
        raise HTTPException(status_code=403, detail="Only admins can assign roles")

    if not role_name:
        raise HTTPException(status_code=400, detail="Role name is required")

    if role_name not in ["Admin", "User", "Viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role name")

    try:
        RBACMiddleware.assign_role_to_user(user_id, role_name)
        roles = RBACMiddleware.get_user_roles(user_id)
        return {
            "user_id": user_id,
            "roles": [r.to_dict() for r in roles],
            "message": f"Role {role_name} assigned to user {user_id}",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}/roles/{role_name}")
async def remove_role(
    user_id: str,
    role_name: str,
    admin_user_id: Optional[str] = Header(None),
) -> Dict[str, str]:
    """Remove a role from a user."""
    if not admin_user_id:
        raise HTTPException(status_code=401, detail="Admin authentication required")

    # Check if requester is admin
    admin_context = RBACMiddleware.create_rbac_context(admin_user_id)
    if not admin_context.is_admin():
        raise HTTPException(status_code=403, detail="Only admins can remove roles")

    try:
        RBACMiddleware.remove_role_from_user(user_id, role_name)
        return {
            "message": f"Role {role_name} removed from user {user_id}",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}/roles")
async def get_user_roles(
    user_id: str,
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get all roles for a user."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # User can only view their own roles unless they're admin
    requester_context = RBACMiddleware.create_rbac_context(requester_id)
    if user_id != requester_id and not requester_context.is_admin():
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        roles = RBACMiddleware.get_user_roles(user_id)
        return {
            "user_id": user_id,
            "roles": [r.to_dict() for r in roles],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles")
async def list_roles() -> List[Dict[str, Any]]:
    """List all available roles."""
    return [
        ADMIN_ROLE.to_dict(),
        USER_ROLE.to_dict(),
        VIEWER_ROLE.to_dict(),
    ]


@router.get("/roles/{role_name}")
async def get_role(role_name: str) -> Dict[str, Any]:
    """Get role details."""
    role_map = {
        "Admin": ADMIN_ROLE,
        "User": USER_ROLE,
        "Viewer": VIEWER_ROLE,
    }

    role = role_map.get(role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    return role.to_dict()


@router.post("/check-permission")
async def check_permission(
    user_id: str = "",
    permission: str = "",
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Check if a user has a specific permission."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not user_id or not permission:
        raise HTTPException(
            status_code=400, detail="user_id and permission are required"
        )

    try:
        context = RBACMiddleware.create_rbac_context(user_id)
        has_perm = context.has_permission(permission)
        RBACMiddleware.audit_permission_check(user_id, permission, has_perm)

        return {
            "user_id": user_id,
            "permission": permission,
            "granted": has_perm,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
