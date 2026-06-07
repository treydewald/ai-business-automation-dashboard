"""
Analytics API routes.
"""
from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Initialize analytics service with mock data
analytics_service = AnalyticsService()


@router.post("/set-data")
async def set_analytics_data(
    executions: list = [],
    logs: list = [],
    integrations: dict = {},
) -> Dict[str, str]:
    """Set data for analytics calculations."""
    analytics_service.set_data(executions, logs, integrations)
    return {"status": "data set successfully"}


@router.get("/metrics")
async def get_metrics(
    date_range_days: int = Query(30, ge=1, le=365),
) -> Dict[str, Any]:
    """Get dashboard metrics."""
    return analytics_service.get_dashboard_metrics(date_range_days)


@router.get("/summary")
async def get_summary() -> Dict[str, Any]:
    """Get summary metrics."""
    return {
        "timestamp": datetime.now().isoformat(),
        "total_workflows": analytics_service.get_total_workflows(),
        "executions_today": analytics_service.get_executions_today(),
        "success_rate": round(analytics_service.get_success_rate(), 2),
    }


@router.get("/trends")
async def get_trends(
    days: int = Query(7, ge=1, le=365),
) -> Dict[str, Any]:
    """Get execution trends."""
    return analytics_service.get_execution_trends(days)


@router.get("/top-workflows")
async def get_top_workflows(
    limit: int = Query(5, ge=1, le=50),
) -> list:
    """Get top workflows by execution count."""
    return analytics_service.get_top_workflows(limit)


@router.get("/failing-workflows")
async def get_failing_workflows(
    limit: int = Query(5, ge=1, le=50),
) -> list:
    """Get top failing workflows."""
    return analytics_service.get_failing_workflows(limit)


@router.get("/integration-health")
async def get_integration_health() -> Dict[str, Any]:
    """Get integration health status."""
    return analytics_service.get_integration_health()


@router.get("/error-breakdown")
async def get_error_breakdown() -> Dict[str, int]:
    """Get error breakdown by type."""
    return analytics_service.get_error_breakdown()


@router.post("/export")
async def export_analytics(
    format: str = Query("json"),
) -> Dict[str, Any]:
    """Export analytics report."""
    if format not in ["json", "csv", "pdf"]:
        return {"error": "Invalid format. Use json, csv, or pdf"}

    metrics = analytics_service.get_dashboard_metrics()
    return {
        "status": "export initiated",
        "format": format,
        "data": metrics if format == "json" else "File generated",
    }
