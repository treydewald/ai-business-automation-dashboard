"""
Tenant model for multi-tenancy support.
"""
from datetime import datetime
from typing import Optional, Dict, Any


class Tenant:
    """Tenant model for multi-tenancy."""

    def __init__(
        self,
        id: Optional[str] = None,
        name: str = "",
        slug: str = "",
        owner_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        is_active: bool = True,
        settings: Optional[Dict[str, Any]] = None,
    ):
        self.id = id
        self.name = name
        self.slug = slug
        self.owner_id = owner_id
        self.created_at = created_at or datetime.utcnow()
        self.is_active = is_active
        self.settings = settings or {}

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
            "settings": self.settings,
        }


class TenantMembership:
    """Tenant membership model linking users to tenants."""

    def __init__(
        self,
        id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        role: str = "member",
        joined_at: Optional[datetime] = None,
    ):
        self.id = id
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.role = role
        self.joined_at = joined_at or datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "user_id": self.user_id,
            "role": self.role,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
