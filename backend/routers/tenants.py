"""
Tenant management API routes.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Dict, Any, Optional, List

from ..services.tenant_service import TenantService

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.post("/")
async def create_tenant(
    name: str = "",
    slug: str = "",
    user_id: str = "",
) -> Dict[str, Any]:
    """Create a new tenant."""
    if not name or not slug or not user_id:
        raise HTTPException(status_code=400, detail="Missing required fields")

    try:
        tenant = TenantService.create_tenant(name, slug, user_id)
        return tenant
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    user_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get tenant details."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    if not TenantService.validate_tenant_access(tenant_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    tenant = TenantService.get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return tenant


@router.get("/")
async def list_user_tenants(
    user_id: Optional[str] = Header(None),
) -> List[Dict[str, Any]]:
    """List all tenants for a user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    tenants = TenantService.get_user_tenants(user_id)
    return tenants


@router.post("/{tenant_id}/members")
async def add_tenant_member(
    tenant_id: str,
    user_id_to_add: str = "",
    role: str = "member",
    user_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Add a member to a tenant."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    if not TenantService.validate_tenant_access(tenant_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    if not user_id_to_add:
        raise HTTPException(status_code=400, detail="User ID to add is required")

    try:
        membership = TenantService.add_member_to_tenant(tenant_id, user_id_to_add, role)
        return membership
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{tenant_id}/members")
async def list_tenant_members(
    tenant_id: str,
    user_id: Optional[str] = Header(None),
) -> List[Dict[str, Any]]:
    """List members of a tenant."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    if not TenantService.validate_tenant_access(tenant_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    members = TenantService.list_tenant_members(tenant_id)
    return members


@router.delete("/{tenant_id}/members/{member_user_id}")
async def remove_tenant_member(
    tenant_id: str,
    member_user_id: str,
    user_id: Optional[str] = Header(None),
) -> Dict[str, str]:
    """Remove a member from a tenant."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    if not TenantService.validate_tenant_access(tenant_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    success = TenantService.remove_member_from_tenant(tenant_id, member_user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Member not found")

    return {"message": "Member removed successfully"}


@router.put("/{tenant_id}/settings")
async def update_tenant_settings(
    tenant_id: str,
    settings: dict = {},
    user_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Update tenant settings."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    if not TenantService.validate_tenant_access(tenant_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        tenant = TenantService.update_tenant_settings(tenant_id, settings)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
