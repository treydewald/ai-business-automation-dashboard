"""
Authentication service for user login, registration, and JWT management.
"""
import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json

# Mock users storage (in production, use database)
users_db = {}
token_blacklist = set()


class AuthService:
    """Service for authentication and authorization."""

    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using SHA256 (simplified - use bcrypt in production)."""
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return AuthService.hash_password(plain_password) == hashed_password

    @staticmethod
    def create_access_token(
        user_id: str, username: str, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token."""
        if expires_delta is None:
            expires_delta = timedelta(
                minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES
            )

        expire = datetime.utcnow() + expires_delta
        to_encode = {
            "user_id": user_id,
            "username": username,
            "exp": expire.timestamp(),
        }

        token_str = json.dumps(to_encode)
        signature = hmac.new(
            AuthService.SECRET_KEY.encode(),
            token_str.encode(),
            hashlib.sha256,
        ).hexdigest()

        return f"{token_str}.{signature}"

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload."""
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return None

            token_str, signature = parts
            expected_signature = hmac.new(
                AuthService.SECRET_KEY.encode(),
                token_str.encode(),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                return None

            payload = json.loads(token_str)

            if payload.get("exp", 0) < datetime.utcnow().timestamp():
                return None

            return payload
        except Exception:
            return None

    @staticmethod
    def register_user(username: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user."""
        if username in users_db:
            return {"error": "Username already exists"}
        if any(u["email"] == email for u in users_db.values()):
            return {"error": "Email already registered"}

        user_id = f"user_{len(users_db) + 1}"
        password_hash = AuthService.hash_password(password)

        users_db[username] = {
            "id": user_id,
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }

        return {
            "id": user_id,
            "username": username,
            "email": email,
            "message": "User registered successfully",
        }

    @staticmethod
    def login(username: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return JWT token."""
        user = users_db.get(username)

        if not user or not AuthService.verify_password(password, user["password_hash"]):
            return {"error": "Invalid username or password"}

        if not user["is_active"]:
            return {"error": "User account is inactive"}

        access_token = AuthService.create_access_token(user["id"], username)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
            },
        }

    @staticmethod
    def logout(token: str) -> Dict[str, str]:
        """Add token to blacklist (logout)."""
        token_blacklist.add(token)
        return {"message": "Logged out successfully"}

    @staticmethod
    def refresh_token(old_token: str) -> Dict[str, Any]:
        """Refresh an access token."""
        payload = AuthService.verify_token(old_token)

        if not payload:
            return {"error": "Invalid or expired token"}

        if old_token in token_blacklist:
            return {"error": "Token has been revoked"}

        user_id = payload.get("user_id")
        username = payload.get("username")

        new_token = AuthService.create_access_token(user_id, username)

        return {
            "access_token": new_token,
            "token_type": "bearer",
        }

    @staticmethod
    def get_current_user(token: str) -> Optional[Dict[str, Any]]:
        """Get current user from token."""
        if token in token_blacklist:
            return None

        payload = AuthService.verify_token(token)
        if not payload:
            return None

        username = payload.get("username")
        user = users_db.get(username)

        if not user:
            return None

        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
        }
