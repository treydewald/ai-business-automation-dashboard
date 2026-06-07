"""
Analytics service for workflow metrics and reporting.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
from enum import Enum


class ExecutionStatus(Enum):
    """Execution status enumeration."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalyticsService:
    """Service for generating analytics and metrics."""

    def __init__(self, db_session=None):
        """Initialize analytics service."""
        self.db = db_session
        self.execution_data = []
        self.log_data = []
        self.integration_status = {}

    def set_data(
        self,
        executions: List[Dict[str, Any]],
        logs: List[Dict[str, Any]],
        integrations: Dict[str, Any],
    ) -> None:
        """Set data sources for analytics."""
        self.execution_data = executions
        self.log_data = logs
        self.integration_status = integrations

    def get_total_workflows(self) -> int:
        """Get total number of workflows."""
        unique_workflow_ids = set()
        for execution in self.execution_data:
            if "workflow_id" in execution:
                unique_workflow_ids.add(execution["workflow_id"])
        return len(unique_workflow_ids)

    def get_executions_today(self) -> int:
        """Get number of executions today."""
        today = datetime.now().date()
        count = 0
        for execution in self.execution_data:
            if "created_at" in execution:
                exec_date = execution["created_at"]
                if isinstance(exec_date, str):
                    exec_date = datetime.fromisoformat(exec_date).date()
                if exec_date == today:
                    count += 1
        return count

    def get_success_rate(self) -> float:
        """Get overall success rate as percentage."""
        if not self.execution_data:
            return 0.0

        successful = sum(
            1 for e in self.execution_data
            if e.get("status") == ExecutionStatus.COMPLETED.value
        )
        return (successful / len(self.execution_data)) * 100 if self.execution_data else 0.0

    def get_execution_trends(
        self, days: int = 7
    ) -> Dict[str, Any]:
        """Get execution trends over the last N days."""
        trends = {
            "dates": [],
            "execution_counts": [],
            "success_rates": [],
            "avg_durations": [],
        }

        for i in range(days, 0, -1):
            date = (datetime.now() - timedelta(days=i)).date()
            trends["dates"].append(date.isoformat())

            day_executions = [
                e for e in self.execution_data
                if self._get_execution_date(e) == date
            ]

            trends["execution_counts"].append(len(day_executions))

            if day_executions:
                successful = sum(
                    1 for e in day_executions
                    if e.get("status") == ExecutionStatus.COMPLETED.value
                )
                success_rate = (successful / len(day_executions)) * 100
                trends["success_rates"].append(success_rate)

                durations = [
                    e.get("duration", 0) for e in day_executions
                    if e.get("duration")
                ]
                avg_duration = sum(durations) / len(durations) if durations else 0
                trends["avg_durations"].append(avg_duration)
            else:
                trends["success_rates"].append(0)
                trends["avg_durations"].append(0)

        return trends

    def get_top_workflows(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top workflows by execution count."""
        workflow_counts = defaultdict(int)
        for execution in self.execution_data:
            workflow_id = execution.get("workflow_id", "unknown")
            workflow_name = execution.get("workflow_name", workflow_id)
            workflow_counts[workflow_id] = {
                "count": workflow_counts[workflow_id].get("count", 0) + 1,
                "name": workflow_name,
            }

        sorted_workflows = sorted(
            [
                {
                    "id": k,
                    "name": v["name"],
                    "execution_count": v["count"],
                }
                for k, v in workflow_counts.items()
            ],
            key=lambda x: x["execution_count"],
            reverse=True,
        )

        return sorted_workflows[:limit]

    def get_failing_workflows(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top failing workflows."""
        workflow_failures = defaultdict(lambda: {"count": 0, "name": ""})

        for execution in self.execution_data:
            if execution.get("status") == ExecutionStatus.FAILED.value:
                workflow_id = execution.get("workflow_id", "unknown")
                workflow_failures[workflow_id]["count"] += 1
                if not workflow_failures[workflow_id]["name"]:
                    workflow_failures[workflow_id]["name"] = execution.get(
                        "workflow_name", workflow_id
                    )

        sorted_workflows = sorted(
            [
                {
                    "id": k,
                    "name": v["name"],
                    "failure_count": v["count"],
                }
                for k, v in workflow_failures.items()
            ],
            key=lambda x: x["failure_count"],
            reverse=True,
        )

        return sorted_workflows[:limit]

    def get_integration_health(self) -> Dict[str, Any]:
        """Get integration health status."""
        return {
            "status": "healthy",
            "integrations": self.integration_status,
            "timestamp": datetime.now().isoformat(),
        }

    def get_error_breakdown(self) -> Dict[str, int]:
        """Get error breakdown by type."""
        errors = defaultdict(int)
        for log in self.log_data:
            if log.get("level") == "ERROR":
                error_type = log.get("error_type", "unknown")
                errors[error_type] += 1
        return dict(errors)

    def get_dashboard_metrics(
        self, date_range_days: int = 30
    ) -> Dict[str, Any]:
        """Get all dashboard metrics."""
        return {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_workflows": self.get_total_workflows(),
                "executions_today": self.get_executions_today(),
                "success_rate": round(self.get_success_rate(), 2),
            },
            "trends": self.get_execution_trends(days=7),
            "top_workflows": self.get_top_workflows(),
            "failing_workflows": self.get_failing_workflows(),
            "integration_health": self.get_integration_health(),
            "error_breakdown": self.get_error_breakdown(),
        }

    def _get_execution_date(self, execution: Dict[str, Any]) -> Optional[datetime.date]:
        """Extract date from execution record."""
        if "created_at" in execution:
            exec_date = execution["created_at"]
            if isinstance(exec_date, str):
                return datetime.fromisoformat(exec_date).date()
            elif isinstance(exec_date, datetime):
                return exec_date.date()
        return None
