import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './WorkflowEditorCollab.css';

interface UserPresence {
  user_id: string;
  username: string;
  cursor_position?: { x: number; y: number };
  color: string;
}

interface Change {
  id: string;
  type: string;
  user_id: string;
  timestamp: string;
  data: any;
  version: number;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  target_id: string;
  timestamp: string;
  resolved: boolean;
}

interface CollaborativeState {
  version: number;
  changes: Change[];
  active_users: { [key: string]: UserPresence };
  comments: Comment[];
  locks: { [key: string]: string };
}

export default function WorkflowEditorCollab() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [state, setState] = useState<CollaborativeState | null>(null);
  const [presence, setPresence] = useState<{ [key: string]: UserPresence }>({});
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const userId = useRef(localStorage.getItem('user_id') || `user-${Math.random().toString(36).substr(2, 9)}`);
  const username = useRef(localStorage.getItem('username') || 'Anonymous');

  useEffect(() => {
    setCurrentUser({ id: userId.current, username: username.current });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/workflows/${workflowId}/collaborate?user_id=${userId.current}&username=${username.current}`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [workflowId]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'state':
        setState(message.data);
        setPresence(message.data.active_users || {});
        break;

      case 'change':
        setState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            version: message.version,
            changes: [...prevState.changes, message.change],
          };
        });
        break;

      case 'user_joined':
        console.log(`${message.username} joined`);
        break;

      case 'user_left':
        console.log(`${message.username} left`);
        setPresence((prev) => {
          const updated = { ...prev };
          delete updated[message.user_id];
          return updated;
        });
        break;

      case 'presence_update':
        setPresence(message.presence);
        break;

      case 'comment_added':
        setState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            comments: [...prevState.comments, message.comment],
          };
        });
        break;

      case 'lock_update':
        setState((prevState) => {
          if (!prevState) return null;
          const locks = { ...prevState.locks };
          if (message.acquired) {
            locks[message.step_id] = message.user_id;
          } else {
            delete locks[message.step_id];
          }
          return { ...prevState, locks };
        });
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        break;
    }
  }, []);

  const sendChange = (changeType: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
      ws.send(
        JSON.stringify({
          type: 'change',
          data: {
            type: changeType,
            data: data,
          },
        })
      );
    }
  };

  const sendCursorUpdate = (position: { x: number; y: number }) => {
    if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
      ws.send(
        JSON.stringify({
          type: 'cursor',
          position: position,
        })
      );
    }
  };

  const addComment = () => {
    if (!commentText.trim() || !selectedStepId || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: 'comment',
        content: commentText,
        target_id: selectedStepId,
      })
    );

    setCommentText('');
  };

  const requestLock = (stepId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: 'lock_request',
        step_id: stepId,
      })
    );
  };

  const releaseLock = (stepId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: 'lock_release',
        step_id: stepId,
      })
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = editorRef.current?.getBoundingClientRect();
    if (rect) {
      sendCursorUpdate({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  if (!state || !currentUser) {
    return <div className="collab-editor-loading">Initializing collaborative editor...</div>;
  }

  return (
    <div className="collab-editor">
      <div className="collab-editor-header">
        <h2>Collaborative Workflow Editor</h2>
        <div className="presence-indicators">
          {Object.entries(presence).map(([userId, userPresence]) => (
            <div
              key={userId}
              className="presence-indicator"
              style={{ backgroundColor: userPresence.color }}
              title={userPresence.username}
            >
              {userPresence.username.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <div className="collab-editor-main" onMouseMove={handleMouseMove} ref={editorRef}>
        {/* Canvas area for workflow diagram */}
        <div className="canvas-container">
          <div className="canvas-placeholder">
            <p>Workflow Canvas (Steps, Connections, etc.)</p>
            <p style={{ fontSize: '12px', color: '#888' }}>
              {Object.keys(presence).length} user(s) editing
            </p>
          </div>

          {/* User cursors */}
          {Object.entries(presence).map(([userId, userPresence]) => {
            if (userId === currentUser.id || !userPresence.cursor_position) return null;
            return (
              <div
                key={`cursor-${userId}`}
                className="user-cursor"
                style={{
                  left: `${userPresence.cursor_position.x}px`,
                  top: `${userPresence.cursor_position.y}px`,
                  borderColor: userPresence.color,
                }}
                title={userPresence.username}
              >
                <span className="cursor-label">{userPresence.username}</span>
              </div>
            );
          })}
        </div>

        {/* Comments panel */}
        <div className="comments-panel">
          <h3>Comments</h3>
          <div className="comments-list">
            {state.comments.map((comment) => (
              <div
                key={comment.id}
                className={`comment ${comment.resolved ? 'resolved' : ''}`}
              >
                <div className="comment-header">
                  <strong>{comment.username}</strong>
                  <span className="comment-time">
                    {new Date(comment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
          </div>

          {selectedStepId && (
            <div className="comment-input">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Comment on step...`}
              />
              <button onClick={addComment}>Add Comment</button>
            </div>
          )}
        </div>
      </div>

      {/* Version info */}
      <div className="collab-editor-footer">
        <span>Version: {state.version}</span>
        <span>Changes: {state.changes.length}</span>
        <span>Locks: {Object.keys(state.locks).length}</span>
      </div>
    </div>
  );
}
