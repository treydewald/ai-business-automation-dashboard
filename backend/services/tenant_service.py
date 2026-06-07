"""
Tenant service for multi-tenancy operations.
"""
from typing import Dict, List, Any, Optional
from ..middleware.tenant import TenantMiddleware


class TenantService:
    """Service for managing tenants."""

    @staticmethod
    def create_tenant(
        name: str, slug: str, owner_id: str
    ) -> Dict[str, Any]:
        """Create a new tenant."""
        tenant_id = f"tenant_{len(TenantMiddleware.tenants) + 1}"
        tenant = TenantMiddleware.create_tenant(tenant_id, name, slug, owner_id)
        # Add owner as tenant member
        TenantMiddleware.add_tenant_member(tenant_id, owner_id, role="owner")
        return tenant

    @staticmethod
    def get_tenant(tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get tenant information."""
        return TenantMiddleware.get_tenant_info(tenant_id)

    @staticmethod
    def list_tenant_members(tenant_id: str) -> List[Dict[str, Any]]:
        """List all members of a tenant."""
        members = []
        for membership in TenantMiddleware.tenant_memberships.values():
            if membership["tenant_id"] == tenant_id:
                members.append(membership)
        return members

    @staticmethod
    def add_member_to_tenant(
        tenant_id: str, user_id: str, role: str = "member"
    ) -> Dict[str, Any]:
        """Add a user to a tenant."""
        return TenantMiddleware.add_tenant_member(tenant_id, user_id, role)

    @staticmethod
    def remove_member_from_tenant(tenant_id: str, user_id: str) -> bool:
        """Remove a user from a tenant."""
        membership_id = f"{tenant_id}_{user_id}"
        if membership_id in TenantMiddleware.tenant_memberships:
            del TenantMiddleware.tenant_memberships[membership_id]
            return True
        return False

    @staticmethod
    def get_user_tenants(user_id: str) -> List[Dict[str, Any]]:
        """Get all tenants for a user."""
        return TenantMiddleware.get_user_tenants(user_id)

    @staticmethod
    def update_tenant_settings(
        tenant_id: str, settings: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update tenant settings."""
        tenant = TenantMiddleware.get_tenant_info(tenant_id)
        if tenant:
            tenant["settings"].update(settings)
            return tenant
        return None

    @staticmethod
    def validate_tenant_access(
        tenant_id: str, user_id: str
    ) -> bool:
        """Check if user has access to tenant."""
        membership_id = f"{tenant_id}_{user_id}"
        return membership_id in TenantMiddleware.tenant_memberships

    @staticmethod
    def validate_cross_tenant_access(
        resource_tenant_id: str, request_tenant_id: Optional[str]
    ) -> bool:
        """Validate cross-tenant access."""
        return TenantMiddleware.validate_cross_tenant_access(
            resource_tenant_id, request_tenant_id
        )
