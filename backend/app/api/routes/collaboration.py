"""WebSocket routes for real-time collaborative workflow editing."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Set
import json
import logging

from app.services.collab_sync import (
    collab_manager,
    Change,
    ChangeType,
    UserPresence,
    Comment,
)
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["collaboration"])

# Track active connections per workflow
active_connections: Dict[str, Set[WebSocket]] = {}


async def broadcast_to_session(
    workflow_id: str, message: dict, exclude_sender: WebSocket = None
) -> None:
    """Broadcast message to all users in a session."""
    if workflow_id in active_connections:
        for connection in active_connections[workflow_id]:
            if connection != exclude_sender:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")


@router.websocket("/workflows/{workflow_id}/collaborate")
async def websocket_collaborate(websocket: WebSocket, workflow_id: str):
    """WebSocket endpoint for collaborative workflow editing."""
    user_id = None
    username = None

    try:
        await websocket.accept()

        # Extract user info from query params
        query_params = websocket.query_params
        user_id = query_params.get("user_id")
        username = query_params.get("username", "Anonymous")

        if not user_id:
            await websocket.send_json(
                {"type": "error", "message": "user_id required"}
            )
            await websocket.close()
            return

        # Add to session
        if workflow_id not in active_connections:
            active_connections[workflow_id] = set()
        active_connections[workflow_id].add(websocket)

        # Join collaboration session
        join_result = collab_manager.join_session(workflow_id, user_id, username)

        # Send current state
        await websocket.send_json(
            {"type": "state", "data": join_result["state"]}
        )

        # Notify others
        await broadcast_to_session(
            workflow_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "username": username,
                "presence": {
                    "user_id": user_id,
                    "username": username,
                },
            },
            exclude_sender=websocket,
        )

        # Handle messages
        while True:
            data = await websocket.receive_json()
            await handle_collaboration_message(
                workflow_id, user_id, username, data
            )

    except WebSocketDisconnect:
        if user_id:
            collab_manager.leave_session(workflow_id, user_id)
            if workflow_id in active_connections:
                active_connections[workflow_id].discard(websocket)
                if not active_connections[workflow_id]:
                    del active_connections[workflow_id]

            await broadcast_to_session(
                workflow_id,
                {"type": "user_left", "user_id": user_id, "username": username},
            )

        logger.info(f"User {user_id} disconnected from {workflow_id}")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason=str(e))


async def handle_collaboration_message(
    workflow_id: str, user_id: str, username: str, message: dict
) -> None:
    """Handle incoming collaboration messages."""
    msg_type = message.get("type")

    if msg_type == "change":
        # Apply change
        change_data = message.get("data", {})
        change = Change(
            type=ChangeType(change_data.get("type")),
            user_id=user_id,
            data=change_data.get("data", {}),
        )

        result = collab_manager.apply_change(workflow_id, change)

        # Broadcast change
        await broadcast_to_session(
            workflow_id,
            {
                "type": "change",
                "user_id": user_id,
                "change": result["change"],
                "version": result["version"],
            },
        )

    elif msg_type == "cursor":
        # Update cursor position
        position = message.get("position", {})
        collab_manager.update_presence(workflow_id, user_id, position)

        # Broadcast presence
        presence = collab_manager.get_presence(workflow_id)
        await broadcast_to_session(
            workflow_id,
            {"type": "presence_update", "presence": presence},
        )

    elif msg_type == "comment":
        # Add comment
        comment = Comment(
            user_id=user_id,
            username=username,
            content=message.get("content", ""),
            target_id=message.get("target_id", ""),
        )

        session = collab_manager.get_or_create_session(workflow_id)
        comment_dict = session.add_comment(comment)

        # Broadcast comment
        await broadcast_to_session(
            workflow_id,
            {"type": "comment_added", "comment": comment_dict},
        )

    elif msg_type == "lock_request":
        # Request lock on step
        step_id = message.get("step_id")
        session = collab_manager.get_or_create_session(workflow_id)
        acquired = session.acquire_lock(step_id, user_id)

        await broadcast_to_session(
            workflow_id,
            {
                "type": "lock_update",
                "step_id": step_id,
                "user_id": user_id if acquired else None,
                "acquired": acquired,
            },
        )

    elif msg_type == "lock_release":
        # Release lock
        step_id = message.get("step_id")
        session = collab_manager.get_or_create_session(workflow_id)
        session.release_lock(step_id, user_id)

        await broadcast_to_session(
            workflow_id,
            {"type": "lock_released", "step_id": step_id},
        )

    elif msg_type == "sync_request":
        # Request full sync
        session = collab_manager.get_or_create_session(workflow_id)
        for ws in active_connections.get(workflow_id, set()):
            await ws.send_json(
                {"type": "state", "data": session.get_state()}
            )


@router.get("/workflows/{workflow_id}/presence")
async def get_workflow_presence(
    workflow_id: str, current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current presence in a workflow."""
    presence = collab_manager.get_presence(workflow_id)
    return {"workflow_id": workflow_id, "presence": presence}


@router.post("/workflows/{workflow_id}/comments/{comment_id}/resolve")
async def resolve_comment(
    workflow_id: str,
    comment_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Resolve a comment."""
    session = collab_manager.get_or_create_session(workflow_id)
    resolved = session.resolve_comment(comment_id)

    if not resolved:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Broadcast resolution
    await broadcast_to_session(
        workflow_id,
        {"type": "comment_resolved", "comment_id": comment_id},
    )

    return {"status": "resolved", "comment_id": comment_id}
