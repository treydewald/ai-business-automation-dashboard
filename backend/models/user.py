"""
User model for authentication.
"""
from datetime import datetime
from typing import Optional


class User:
    """User model for authentication."""

    def __init__(
        self,
        id: Optional[str] = None,
        username: str = "",
        email: str = "",
        password_hash: str = "",
        is_active: bool = True,
        created_at: Optional[datetime] = None,
    ):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_dict_full(self) -> dict:
        """Convert to dictionary with password hash."""
        data = self.to_dict()
        data["password_hash"] = self.password_hash
        return data
