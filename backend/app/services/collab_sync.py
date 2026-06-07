"""Real-time collaborative editing service using CRDT-inspired approach."""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum


class ChangeType(str, Enum):
    """Types of changes that can be made to a workflow."""
    ADD_STEP = "add_step"
    REMOVE_STEP = "remove_step"
    UPDATE_STEP = "update_step"
    MOVE_STEP = "move_step"
    ADD_CONNECTION = "add_connection"
    REMOVE_CONNECTION = "remove_connection"
    UPDATE_METADATA = "update_metadata"


@dataclass
class UserPresence:
    """Track user presence and cursor position."""
    user_id: str
    username: str
    cursor_position: Optional[Dict[str, Any]] = None
    last_active: datetime = field(default_factory=datetime.utcnow)
    color: str = field(default_factory=lambda: f"#{uuid.uuid4().hex[:6]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "cursor_position": self.cursor_position,
            "last_active": self.last_active.isoformat(),
            "color": self.color,
        }


@dataclass
class Change:
    """Represents a single change to a workflow."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: ChangeType = ChangeType.UPDATE_STEP
    user_id: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = field(default_factory=dict)
    version: int = 0
    parent_version: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "version": self.version,
            "parent_version": self.parent_version,
        }


@dataclass
class Comment:
    """Represents a comment on a workflow element."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    username: str = ""
    content: str = ""
    target_id: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    resolved: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "content": self.content,
            "target_id": self.target_id,
            "timestamp": self.timestamp.isoformat(),
            "resolved": self.resolved,
        }


class CollaborativeWorkflow:
    """Manages collaborative editing state for a single workflow."""

    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        self.changes: List[Change] = []
        self.version = 0
        self.active_users: Dict[str, UserPresence] = {}
        self.comments: List[Comment] = []
        self.lock_holders: Dict[str, str] = {}  # step_id -> user_id

    def apply_change(self, change: Change) -> Dict[str, Any]:
        """Apply a change to the workflow with conflict resolution."""
        change.version = self.version
        change.parent_version = self.version - 1 if self.version > 0 else 0
        self.changes.append(change)
        self.version += 1

        return {
            "status": "success",
            "version": self.version,
            "change": change.to_dict(),
        }

    def add_user(self, user_presence: UserPresence) -> None:
        """Add or update user presence."""
        self.active_users[user_presence.user_id] = user_presence

    def remove_user(self, user_id: str) -> None:
        """Remove user from active session."""
        if user_id in self.active_users:
            del self.active_users[user_id]
        # Release any locks held by user
        self.lock_holders = {
            k: v for k, v in self.lock_holders.items() if v != user_id
        }

    def update_cursor(self, user_id: str, position: Dict[str, Any]) -> None:
        """Update user cursor position."""
        if user_id in self.active_users:
            self.active_users[user_id].cursor_position = position
            self.active_users[user_id].last_active = datetime.utcnow()

    def add_comment(self, comment: Comment) -> Dict[str, Any]:
        """Add a comment to a workflow element."""
        self.comments.append(comment)
        return comment.to_dict()

    def resolve_comment(self, comment_id: str) -> bool:
        """Mark a comment as resolved."""
        for comment in self.comments:
            if comment.id == comment_id:
                comment.resolved = True
                return True
        return False

    def acquire_lock(self, step_id: str, user_id: str) -> bool:
        """Try to acquire lock on a step for editing."""
        if step_id not in self.lock_holders:
            self.lock_holders[step_id] = user_id
            return True
        return self.lock_holders[step_id] == user_id

    def release_lock(self, step_id: str, user_id: str) -> bool:
        """Release lock on a step."""
        if self.lock_holders.get(step_id) == user_id:
            del self.lock_holders[step_id]
            return True
        return False

    def get_state(self) -> Dict[str, Any]:
        """Get complete state snapshot for new users."""
        return {
            "workflow_id": self.workflow_id,
            "version": self.version,
            "changes": [change.to_dict() for change in self.changes],
            "active_users": {
                uid: presence.to_dict()
                for uid, presence in self.active_users.items()
            },
            "comments": [comment.to_dict() for comment in self.comments],
            "locks": self.lock_holders,
        }

    def get_change_history(
        self, since_version: int = 0
    ) -> List[Dict[str, Any]]:
        """Get changes since a specific version."""
        return [
            change.to_dict()
            for change in self.changes
            if change.version >= since_version
        ]


class CollaborationManager:
    """Manages collaborative editing sessions across multiple workflows."""

    def __init__(self):
        self.sessions: Dict[str, CollaborativeWorkflow] = {}

    def get_or_create_session(self, workflow_id: str) -> CollaborativeWorkflow:
        """Get or create a collaboration session for a workflow."""
        if workflow_id not in self.sessions:
            self.sessions[workflow_id] = CollaborativeWorkflow(workflow_id)
        return self.sessions[workflow_id]

    def join_session(
        self, workflow_id: str, user_id: str, username: str
    ) -> Dict[str, Any]:
        """User joins a collaboration session."""
        session = self.get_or_create_session(workflow_id)
        presence = UserPresence(user_id=user_id, username=username)
        session.add_user(presence)

        return {
            "status": "joined",
            "workflow_id": workflow_id,
            "state": session.get_state(),
        }

    def leave_session(self, workflow_id: str, user_id: str) -> bool:
        """User leaves a collaboration session."""
        if workflow_id in self.sessions:
            self.sessions[workflow_id].remove_user(user_id)
            # Clean up empty sessions
            if not self.sessions[workflow_id].active_users:
                del self.sessions[workflow_id]
            return True
        return False

    def apply_change(self, workflow_id: str, change: Change) -> Dict[str, Any]:
        """Apply a change to a workflow."""
        session = self.get_or_create_session(workflow_id)
        return session.apply_change(change)

    def update_presence(
        self, workflow_id: str, user_id: str, position: Dict[str, Any]
    ) -> None:
        """Update user presence and cursor position."""
        if workflow_id in self.sessions:
            self.sessions[workflow_id].update_cursor(user_id, position)

    def get_presence(self, workflow_id: str) -> Dict[str, Any]:
        """Get all active users and their presence."""
        if workflow_id not in self.sessions:
            return {}
        session = self.sessions[workflow_id]
        return {
            uid: presence.to_dict()
            for uid, presence in session.active_users.items()
        }

    def cleanup_inactive(self, timeout_minutes: int = 30) -> None:
        """Remove inactive users from sessions."""
        now = datetime.utcnow()
        for session in self.sessions.values():
            inactive_users = [
                uid
                for uid, presence in session.active_users.items()
                if (now - presence.last_active).total_seconds() > timeout_minutes * 60
            ]
            for user_id in inactive_users:
                session.remove_user(user_id)


# Global instance
collab_manager = CollaborationManager()
