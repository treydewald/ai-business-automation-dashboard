"""
Authentication API routes.
"""
from fastapi import APIRouter, Header, HTTPException
from typing import Optional, Dict, Any

from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserRegisterRequest:
    """User registration request schema."""
    def __init__(self, username: str = "", email: str = "", password: str = ""):
        self.username = username
        self.email = email
        self.password = password


class UserLoginRequest:
    """User login request schema."""
    def __init__(self, username: str = "", password: str = ""):
        self.username = username
        self.password = password


@router.post("/register")
async def register(
    username: str = "",
    email: str = "",
    password: str = "",
) -> Dict[str, Any]:
    """Register a new user."""
    if not username or not email or not password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    result = AuthService.register_user(username, email, password)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/login")
async def login(
    username: str = "",
    password: str = "",
) -> Dict[str, Any]:
    """Login user and return JWT token."""
    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    result = AuthService.login(username, password)

    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])

    return result


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
) -> Dict[str, str]:
    """Logout user (add token to blacklist)."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        token = authorization.replace("Bearer ", "")
        return AuthService.logout(token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refresh")
async def refresh(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Refresh access token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        token = authorization.replace("Bearer ", "")
        result = AuthService.refresh_token(token)

        if "error" in result:
            raise HTTPException(status_code=401, detail=result["error"])

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get current user info."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        token = authorization.replace("Bearer ", "")
        user = AuthService.get_current_user(token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
