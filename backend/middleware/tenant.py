"""
Tenant middleware for handling multi-tenancy in requests.
"""
from typing import Optional, Dict, Any
from urllib.parse import urlparse


class TenantContext:
    """Context object for tenant information."""

    def __init__(self, tenant_id: Optional[str] = None, user_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.is_authenticated = user_id is not None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "tenant_id": self.tenant_id,
            "user_id": self.user_id,
            "is_authenticated": self.is_authenticated,
        }


class TenantMiddleware:
    """Middleware for extracting and validating tenant context from requests."""

    # In-memory tenant store (in production, use database)
    tenants: Dict[str, Dict[str, Any]] = {}
    tenant_memberships: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def create_tenant(
        tenant_id: str, name: str, slug: str, owner_id: str
    ) -> Dict[str, Any]:
        """Create a new tenant."""
        tenant = {
            "id": tenant_id,
            "name": name,
            "slug": slug,
            "owner_id": owner_id,
            "is_active": True,
            "settings": {},
        }
        TenantMiddleware.tenants[tenant_id] = tenant
        return tenant

    @staticmethod
    def add_tenant_member(
        tenant_id: str, user_id: str, role: str = "member"
    ) -> Dict[str, Any]:
        """Add a user to a tenant."""
        if tenant_id not in TenantMiddleware.tenants:
            raise ValueError(f"Tenant {tenant_id} not found")

        membership_id = f"{tenant_id}_{user_id}"
        membership = {
            "id": membership_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "role": role,
        }
        TenantMiddleware.tenant_memberships[membership_id] = membership
        return membership

    @staticmethod
    def extract_tenant_from_subdomain(hostname: str) -> Optional[str]:
        """Extract tenant slug from subdomain."""
        parts = hostname.split(".")
        if len(parts) > 2:
            return parts[0]
        return None

    @staticmethod
    def extract_tenant_from_header(headers: Dict[str, str]) -> Optional[str]:
        """Extract tenant ID from X-Tenant-ID header."""
        return headers.get("X-Tenant-ID")

    @staticmethod
    def extract_tenant_from_path(path: str) -> Optional[str]:
        """Extract tenant from URL path (e.g., /tenant/{tenant_id}/)."""
        parts = path.strip("/").split("/")
        if len(parts) > 0 and parts[0] == "tenant" and len(parts) > 1:
            return parts[1]
        return None

    @staticmethod
    def resolve_tenant_context(
        headers: Dict[str, str],
        path: str,
        hostname: str,
        user_id: Optional[str] = None,
    ) -> TenantContext:
        """Resolve tenant context from request."""
        tenant_id = None

        # Try to extract tenant ID from multiple sources
        tenant_id = TenantMiddleware.extract_tenant_from_header(headers)

        if not tenant_id:
            tenant_id = TenantMiddleware.extract_tenant_from_path(path)

        if not tenant_id:
            tenant_id = TenantMiddleware.extract_tenant_from_subdomain(hostname)

        # Validate tenant exists
        if tenant_id and tenant_id not in TenantMiddleware.tenants:
            raise ValueError(f"Tenant {tenant_id} not found")

        # If user provided, validate membership
        if tenant_id and user_id:
            membership_id = f"{tenant_id}_{user_id}"
            if membership_id not in TenantMiddleware.tenant_memberships:
                raise ValueError(
                    f"User {user_id} is not a member of tenant {tenant_id}"
                )

        return TenantContext(tenant_id=tenant_id, user_id=user_id)

    @staticmethod
    def scope_query_to_tenant(
        query_dict: Dict[str, Any], tenant_id: Optional[str]
    ) -> Dict[str, Any]:
        """Add tenant filter to database query."""
        if tenant_id:
            query_dict["tenant_id"] = tenant_id
        return query_dict

    @staticmethod
    def validate_cross_tenant_access(
        resource_tenant_id: str, request_tenant_id: Optional[str]
    ) -> bool:
        """Validate that request tenant matches resource tenant."""
        return resource_tenant_id == request_tenant_id

    @staticmethod
    def get_tenant_info(tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get tenant information."""
        return TenantMiddleware.tenants.get(tenant_id)

    @staticmethod
    def get_user_tenants(user_id: str) -> list:
        """Get all tenants for a user."""
        user_tenants = []
        for membership_id, membership in TenantMiddleware.tenant_memberships.items():
            if membership["user_id"] == user_id:
                tenant = TenantMiddleware.tenants.get(membership["tenant_id"])
                if tenant:
                    user_tenants.append(
                        {
                            **tenant,
                            "role": membership["role"],
                        }
                    )
        return user_tenants
