"""
Audit middleware for tracking user actions.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from ..models.audit_log import AuditLog


class AuditMiddleware:
    """Middleware for audit logging."""

    # In-memory audit log store (in production, use database)
    audit_logs: List[AuditLog] = []

    @staticmethod
    def log_action(
        user_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        before_value: Optional[Dict[str, Any]] = None,
        after_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a user action."""
        log_id = f"audit_{len(AuditMiddleware.audit_logs) + 1}"

        # Mask sensitive data
        before_masked = (
            AuditLog.mask_sensitive_fields(before_value) if before_value else {}
        )
        after_masked = (
            AuditLog.mask_sensitive_fields(after_value) if after_value else {}
        )

        # Calculate changes
        changes = {}
        if before_value and after_value:
            for key in after_value:
                if key not in before_value or before_value[key] != after_value[key]:
                    changes[key] = {
                        "before": before_masked.get(key),
                        "after": after_masked.get(key),
                    }

        log = AuditLog(
            id=log_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            before_value=before_masked,
            after_value=after_masked,
            ip_address=ip_address,
            tenant_id=tenant_id,
        )

        AuditMiddleware.audit_logs.append(log)
        return log

    @staticmethod
    def get_audit_logs(
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[AuditLog]:
        """Retrieve audit logs with filtering."""
        results = AuditMiddleware.audit_logs

        # Apply filters
        if user_id:
            results = [log for log in results if log.user_id == user_id]

        if action:
            results = [log for log in results if log.action == action]

        if resource_type:
            results = [log for log in results if log.resource_type == resource_type]

        if resource_id:
            results = [log for log in results if log.resource_id == resource_id]

        if tenant_id:
            results = [log for log in results if log.tenant_id == tenant_id]

        if start_date:
            results = [log for log in results if log.timestamp >= start_date]

        if end_date:
            results = [log for log in results if log.timestamp <= end_date]

        # Sort by timestamp descending and apply limit
        results.sort(key=lambda x: x.timestamp, reverse=True)
        return results[:limit]

    @staticmethod
    def search_audit_logs(
        query: str, field: str = "action", limit: int = 50
    ) -> List[AuditLog]:
        """Search audit logs by field."""
        results = []

        for log in AuditMiddleware.audit_logs:
            if field == "action" and query.lower() in log.action.lower():
                results.append(log)
            elif field == "resource_type" and query.lower() in log.resource_type.lower():
                results.append(log)
            elif field == "user_id" and log.user_id and query.lower() in log.user_id.lower():
                results.append(log)
            elif field == "resource_id" and log.resource_id and query.lower() in str(log.resource_id).lower():
                results.append(log)

        results.sort(key=lambda x: x.timestamp, reverse=True)
        return results[:limit]

    @staticmethod
    def get_audit_summary(
        start_date: Optional[datetime] = None, end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get audit log summary statistics."""
        logs = AuditMiddleware.audit_logs

        if start_date:
            logs = [log for log in logs if log.timestamp >= start_date]

        if end_date:
            logs = [log for log in logs if log.timestamp <= end_date]

        # Count actions
        action_counts = {}
        for log in logs:
            action_counts[log.action] = action_counts.get(log.action, 0) + 1

        # Count by user
        user_counts = {}
        for log in logs:
            if log.user_id:
                user_counts[log.user_id] = user_counts.get(log.user_id, 0) + 1

        return {
            "total_logs": len(logs),
            "actions": action_counts,
            "users": user_counts,
            "date_range": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            },
        }

    @staticmethod
    def export_audit_logs(
        format: str = "json",
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Any:
        """Export audit logs in specified format."""
        logs = AuditMiddleware.get_audit_logs(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000,
        )

        if format == "json":
            return [log.to_dict() for log in logs]
        elif format == "csv":
            # Simple CSV representation
            csv_lines = [
                "id,user_id,action,resource_type,resource_id,timestamp,tenant_id"
            ]
            for log in logs:
                csv_lines.append(
                    f"{log.id},{log.user_id},{log.action},{log.resource_type},{log.resource_id},{log.timestamp.isoformat()},{log.tenant_id}"
                )
            return "\n".join(csv_lines)
        else:
            return logs
