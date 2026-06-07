"""
Audit logging API routes.
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Dict, List, Any, Optional
from datetime import datetime

from ..middleware.audit import AuditMiddleware

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("/")
async def get_audit_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get audit logs with filtering."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        start = None
        end = None

        if start_date:
            start = datetime.fromisoformat(start_date)

        if end_date:
            end = datetime.fromisoformat(end_date)

        logs = AuditMiddleware.get_audit_logs(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            tenant_id=tenant_id,
            start_date=start,
            end_date=end,
            limit=limit,
        )

        return {
            "total": len(logs),
            "logs": [log.to_dict() for log in logs],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search")
async def search_audit_logs(
    query: str = Query(...),
    field: str = Query("action"),
    limit: int = Query(50, ge=1, le=500),
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Search audit logs."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    if field not in ["action", "resource_type", "user_id", "resource_id"]:
        raise HTTPException(status_code=400, detail="Invalid search field")

    try:
        logs = AuditMiddleware.search_audit_logs(query, field, limit)

        return {
            "query": query,
            "field": field,
            "total": len(logs),
            "logs": [log.to_dict() for log in logs],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
async def get_audit_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get audit log summary statistics."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        start = None
        end = None

        if start_date:
            start = datetime.fromisoformat(start_date)

        if end_date:
            end = datetime.fromisoformat(end_date)

        summary = AuditMiddleware.get_audit_summary(start, end)

        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/export")
async def export_audit_logs(
    format: str = Query("json"),
    user_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    requester_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Export audit logs in specified format."""
    if not requester_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    if format not in ["json", "csv"]:
        raise HTTPException(
            status_code=400, detail="Format must be 'json' or 'csv'"
        )

    try:
        start = None
        end = None

        if start_date:
            start = datetime.fromisoformat(start_date)

        if end_date:
            end = datetime.fromisoformat(end_date)

        data = AuditMiddleware.export_audit_logs(format, user_id, start, end)

        return {
            "format": format,
            "exported_at": datetime.utcnow().isoformat(),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/log")
async def log_action(
    user_id: Optional[str] = Query(None),
    action: str = Query(...),
    resource_type: str = Query(...),
    resource_id: Optional[str] = Query(None),
    before_value: Optional[Dict[str, Any]] = None,
    after_value: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Log an action (internal use)."""
    try:
        log = AuditMiddleware.log_action(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_value=before_value,
            after_value=after_value,
            ip_address=ip_address,
            tenant_id=tenant_id,
        )

        return log.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
