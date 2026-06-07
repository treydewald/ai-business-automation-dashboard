# Collaborative Workflow Editing

Real-time collaborative editing of workflows with multiple users simultaneously.

## Features

- **Real-time Synchronization**: Changes appear instantly for all users
- **User Presence**: See who is editing and their cursor positions
- **Comments & Discussions**: Add comments to workflow elements
- **Conflict Resolution**: CRDT-inspired approach prevents conflicting edits
- **Edit Locking**: Lock steps while editing to prevent conflicts
- **Change History**: Track all changes with user attribution
- **Offline Support**: Queue changes when offline

## Architecture

### Backend Components

**CollaborativeWorkflow** (`app/services/collab_sync.py`)
- Manages the state of a single workflow session
- Tracks changes, user presence, comments, and locks
- Applies changes with version tracking
- Provides state snapshots for new users

**CollaborationManager** (`app/services/collab_sync.py`)
- Global manager for all active collaboration sessions
- Creates and manages CollaborativeWorkflow instances
- Handles user joins/leaves
- Cleans up inactive sessions

**WebSocket Routes** (`app/api/routes/collaboration.py`)
- `/workflows/{workflow_id}/collaborate` - WebSocket endpoint
- Broadcasts messages to all connected users
- Handles change propagation
- Manages presence updates

### Frontend Components

**WorkflowEditorCollab** (`src/components/WorkflowEditorCollab.tsx`)
- React component for collaborative editing
- Maintains WebSocket connection
- Displays user presence and cursors
- Handles comment submission
- Manages local state synchronization

## Usage

### Starting Collaborative Editing

```typescript
import WorkflowEditorCollab from '@/components/WorkflowEditorCollab';

// In your router
<Route path="/workflows/:workflowId/edit-collab" component={WorkflowEditorCollab} />
```

### Accessing via URL

Navigate to:
```
http://your-domain/workflows/{workflow-id}/edit-collab
```

The component will automatically:
1. Create a WebSocket connection
2. Load the workflow state
3. Display all active users
4. Listen for changes from other users

## Message Protocol

### Client → Server Messages

#### Change Message
```json
{
  "type": "change",
  "data": {
    "type": "add_step",
    "data": {
      "step_id": "step-123",
      "name": "New Step",
      "type": "http"
    }
  }
}
```

#### Cursor Update
```json
{
  "type": "cursor",
  "position": {
    "x": 100,
    "y": 200
  }
}
```

#### Comment
```json
{
  "type": "comment",
  "content": "This step needs validation",
  "target_id": "step-123"
}
```

#### Lock Request
```json
{
  "type": "lock_request",
  "step_id": "step-123"
}
```

#### Lock Release
```json
{
  "type": "lock_release",
  "step_id": "step-123"
}
```

### Server → Client Messages

#### State Sync
```json
{
  "type": "state",
  "data": {
    "version": 42,
    "changes": [...],
    "active_users": {...},
    "comments": [...],
    "locks": {...}
  }
}
```

#### Change Notification
```json
{
  "type": "change",
  "user_id": "user-123",
  "change": {...},
  "version": 43
}
```

#### Presence Update
```json
{
  "type": "presence_update",
  "presence": {
    "user-123": { "username": "Alice", "cursor_position": {...} }
  }
}
```

#### Lock Update
```json
{
  "type": "lock_update",
  "step_id": "step-123",
  "user_id": "user-456",
  "acquired": true
}
```

## Change Types

- `ADD_STEP` - Add a new step to the workflow
- `REMOVE_STEP` - Remove a step from the workflow
- `UPDATE_STEP` - Update step configuration
- `MOVE_STEP` - Move step to new position
- `ADD_CONNECTION` - Add connection between steps
- `REMOVE_CONNECTION` - Remove connection between steps
- `UPDATE_METADATA` - Update workflow metadata

## Conflict Resolution Strategy

### Last-Write-Wins (LWW)
- Each change has a timestamp and version number
- In conflicts, the change with the latest timestamp wins
- Simpler but may lose some concurrent edits

### Operational Transformation (OT)
- Future enhancement: normalize concurrent changes
- Ensures all users converge to same state
- More complex but preserves all intent

### Lock-Based Prevention
- Users can lock steps while editing
- Prevents concurrent edits on the same element
- Lock holder has exclusive edit rights

## Best Practices

### For Users

1. **Lock Before Major Changes**
   ```
   Lock the step → Make changes → Release lock
   ```

2. **Use Comments for Discussion**
   - Comment instead of changing others' work
   - Reference specific steps in comments

3. **Save Regularly**
   - Browser may close unexpectedly
   - Changes are persisted on every update

4. **Keep Sessions Short**
   - Long sessions may timeout
   - Reconnect if disconnected

### For Developers

1. **Handle Offline Gracefully**
   - Queue changes locally
   - Sync when connection returns

2. **Debounce Cursor Updates**
   - Don't send on every mouse move
   - Batch updates (e.g., 100ms intervals)

3. **Clean Up Sessions**
   - Remove inactive users after timeout
   - Prevent orphaned resources

4. **Monitor Connection**
   - Log disconnections
   - Alert users of sync issues

## Configuration

### Backend

Environment variables:
```
COLLAB_SESSION_TIMEOUT_MINUTES=30  # Inactive user cleanup
COLLAB_MAX_SESSIONS=1000            # Max concurrent sessions
COLLAB_MAX_CHANGES_PER_SESSION=10000 # Max change history
```

### Frontend

In component:
```typescript
const CURSOR_UPDATE_INTERVAL = 100; // ms
const RECONNECT_DELAY = 3000;       // ms
const MAX_RECONNECT_ATTEMPTS = 5;
```

## Performance Considerations

### Scalability
- Each workflow session is independent
- Broadcast only to connected users
- No central state - distributed per-session

### Network Optimization
- Delta encoding for large changes
- Message compression recommended
- Consider message rate limiting

### Storage
- Change history kept in memory
- Consider archiving old changes
- Database persistence optional

## Error Handling

### Connection Errors
- Auto-reconnect with exponential backoff
- Sync state on reconnection
- Show connection status to user

### Merge Conflicts
- Detect via version numbers
- Apply conflict resolution strategy
- Notify user of resolution

### Invalid Changes
- Validate on server
- Reject invalid changes
- Log for debugging

## Security

### Authentication
- Verify user on WebSocket connection
- Use JWT tokens
- Validate permissions

### Authorization
- Check workflow access on connect
- Verify edit permissions
- Audit all changes

### Validation
- Sanitize comments
- Validate change structure
- Check data types

## Monitoring & Debugging

### Metrics to Track
- Active sessions and users
- Message throughput
- Average message latency
- Connection failures

### Logs
- Enable debug logging in development:
  ```python
  logger.setLevel(logging.DEBUG)
  ```

### Testing
```bash
# Test with multiple users
open "http://localhost:3000/workflows/1/edit-collab?user_id=user1"
open "http://localhost:3000/workflows/1/edit-collab?user_id=user2"
```

## Troubleshooting

### WebSocket Connection Failed
- Check CORS settings
- Verify backend is running
- Check network connectivity
- Review browser console

### Changes Not Syncing
- Check network tab for WebSocket frames
- Verify message structure
- Check server logs
- Reconnect and try again

### Cursors Not Showing
- May be throttled for performance
- Check presence_update messages
- Verify cursor coordinates

### Session Timeout
- Inactivity timeout (default 30 min)
- Reconnect to rejoin
- No data loss on reconnect

## Future Enhancements

1. **Operational Transformation** - Proper concurrent editing
2. **Offline Support** - Full offline editing with sync
3. **Rich Presence** - Show what users are editing
4. **Diff Viewer** - Visual change review
5. **Version Branches** - Divergent editing paths
6. **Permissions** - Per-step edit permissions
7. **Notifications** - Push notifications for changes
8. **History Export** - Export change history

## Related Documentation

- [Workflow Editor](./WORKFLOW_EDITOR.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
