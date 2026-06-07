"""Scheduling service for workflow execution"""

import logging
from typing import Dict, Optional, List
from datetime import datetime
from uuid import uuid4
from croniter import croniter
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)


class ScheduleInfo:
    """Information about a scheduled workflow"""

    def __init__(
        self,
        schedule_id: str,
        workflow_id: str,
        cron_expression: str,
        timezone: str = "UTC",
        description: Optional[str] = None,
        enabled: bool = True,
        max_instances: int = 1,
    ):
        self.schedule_id = schedule_id
        self.workflow_id = workflow_id
        self.cron_expression = cron_expression
        self.timezone = timezone
        self.description = description
        self.enabled = enabled
        self.max_instances = max_instances
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.last_run: Optional[datetime] = None
        self.next_run: Optional[datetime] = None

    def update_next_run(self):
        """Calculate next run time based on cron expression"""
        try:
            cron = croniter(self.cron_expression, datetime.now())
            self.next_run = cron.get_next(datetime)
        except Exception as e:
            logger.error(f"Error calculating next run: {str(e)}")
            self.next_run = None

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "id": self.schedule_id,
            "workflow_id": self.workflow_id,
            "cron_expression": self.cron_expression,
            "timezone": self.timezone,
            "description": self.description,
            "enabled": self.enabled,
            "max_instances": self.max_instances,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
        }


class SchedulerService:
    """Service for managing scheduled workflow execution"""

    def __init__(self):
        self.schedules: Dict[str, ScheduleInfo] = {}
        self.execution_history: List[Dict] = []
        self.scheduler = BackgroundScheduler(daemon=True)
        self._start_scheduler()

    def _start_scheduler(self):
        """Start the background scheduler"""
        try:
            if not self.scheduler.running:
                self.scheduler.start()
                logger.info("Background scheduler started")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}")

    def create_schedule(
        self,
        workflow_id: str,
        cron_expression: str,
        timezone: str = "UTC",
        description: Optional[str] = None,
        enabled: bool = True,
        max_instances: int = 1,
    ) -> ScheduleInfo:
        """Create a new schedule"""
        # Validate cron expression
        try:
            croniter(cron_expression)
        except Exception as e:
            raise ValueError(f"Invalid cron expression: {str(e)}")

        schedule_id = str(uuid4())
        schedule = ScheduleInfo(
            schedule_id=schedule_id,
            workflow_id=workflow_id,
            cron_expression=cron_expression,
            timezone=timezone,
            description=description,
            enabled=enabled,
            max_instances=max_instances,
        )

        # Calculate next run
        schedule.update_next_run()

        # Store schedule
        self.schedules[schedule_id] = schedule

        # Add to APScheduler if enabled
        if enabled:
            self._add_job(schedule)

        logger.info(f"Schedule created: {schedule_id} for workflow {workflow_id}")
        return schedule

    def update_schedule(
        self,
        schedule_id: str,
        cron_expression: Optional[str] = None,
        timezone: Optional[str] = None,
        description: Optional[str] = None,
        enabled: Optional[bool] = None,
        max_instances: Optional[int] = None,
    ) -> ScheduleInfo:
        """Update an existing schedule"""
        if schedule_id not in self.schedules:
            raise ValueError(f"Schedule not found: {schedule_id}")

        schedule = self.schedules[schedule_id]

        # Validate new cron expression if provided
        if cron_expression:
            try:
                croniter(cron_expression)
            except Exception as e:
                raise ValueError(f"Invalid cron expression: {str(e)}")
            schedule.cron_expression = cron_expression

        if timezone:
            schedule.timezone = timezone
        if description is not None:
            schedule.description = description
        if max_instances is not None:
            schedule.max_instances = max_instances

        # Handle enabled state change
        if enabled is not None and enabled != schedule.enabled:
            schedule.enabled = enabled
            # Remove existing job and re-add if needed
            self._remove_job(schedule_id)
            if enabled:
                self._add_job(schedule)

        schedule.updated_at = datetime.utcnow()
        schedule.update_next_run()

        logger.info(f"Schedule updated: {schedule_id}")
        return schedule

    def delete_schedule(self, schedule_id: str) -> bool:
        """Delete a schedule"""
        if schedule_id not in self.schedules:
            raise ValueError(f"Schedule not found: {schedule_id}")

        self._remove_job(schedule_id)
        del self.schedules[schedule_id]
        logger.info(f"Schedule deleted: {schedule_id}")
        return True

    def get_schedule(self, schedule_id: str) -> ScheduleInfo:
        """Get schedule by ID"""
        if schedule_id not in self.schedules:
            raise ValueError(f"Schedule not found: {schedule_id}")
        return self.schedules[schedule_id]

    def get_schedules_for_workflow(self, workflow_id: str) -> List[ScheduleInfo]:
        """Get all schedules for a workflow"""
        return [s for s in self.schedules.values() if s.workflow_id == workflow_id]

    def list_schedules(self) -> List[ScheduleInfo]:
        """List all schedules"""
        return list(self.schedules.values())

    def _add_job(self, schedule: ScheduleInfo):
        """Add a job to the scheduler"""
        try:
            trigger = CronTrigger.from_crontab(
                schedule.cron_expression,
                timezone=schedule.timezone,
            )
            job_id = f"workflow_{schedule.workflow_id}_{schedule.schedule_id}"

            self.scheduler.add_job(
                self._execute_workflow,
                trigger=trigger,
                id=job_id,
                args=[schedule.schedule_id, schedule.workflow_id],
                max_instances=schedule.max_instances,
                replace_existing=True,
            )

            logger.info(f"Job added to scheduler: {job_id}")
        except Exception as e:
            logger.error(f"Failed to add job for schedule {schedule.schedule_id}: {str(e)}")

    def _remove_job(self, schedule_id: str):
        """Remove a job from the scheduler"""
        try:
            schedule = self.schedules[schedule_id]
            job_id = f"workflow_{schedule.workflow_id}_{schedule_id}"
            self.scheduler.remove_job(job_id)
            logger.info(f"Job removed from scheduler: {job_id}")
        except Exception as e:
            logger.debug(f"Job not found in scheduler (may be disabled): {str(e)}")

    def _execute_workflow(self, schedule_id: str, workflow_id: str):
        """Execute a workflow (called by scheduler)"""
        try:
            logger.info(f"Executing scheduled workflow: {workflow_id} from schedule: {schedule_id}")

            # Update schedule's last run time
            if schedule_id in self.schedules:
                self.schedules[schedule_id].last_run = datetime.utcnow()

            # Log execution history
            history_entry = {
                "id": str(uuid4()),
                "schedule_id": schedule_id,
                "workflow_id": workflow_id,
                "execution_id": None,
                "status": "scheduled",
                "started_at": datetime.utcnow().isoformat(),
                "completed_at": None,
                "error": None,
                "created_at": datetime.utcnow().isoformat(),
            }
            self.execution_history.append(history_entry)

            # TODO: Actually execute the workflow via the workflow engine
            # This would call the workflow execution engine to run the workflow
            logger.info(f"Scheduled workflow execution recorded: {workflow_id}")

        except Exception as e:
            logger.error(f"Error executing scheduled workflow {workflow_id}: {str(e)}")
            if self.execution_history:
                self.execution_history[-1]["status"] = "failed"
                self.execution_history[-1]["error"] = str(e)

    def get_execution_history(
        self, schedule_id: Optional[str] = None, limit: int = 100
    ) -> List[Dict]:
        """Get execution history for a schedule or all schedules"""
        if schedule_id:
            return [h for h in self.execution_history if h["schedule_id"] == schedule_id][-limit:]
        return self.execution_history[-limit:]

    def shutdown(self):
        """Shutdown the scheduler"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown()
                logger.info("Background scheduler shut down")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {str(e)}")


# Global instance
_scheduler_service: Optional[SchedulerService] = None


def get_scheduler_service() -> SchedulerService:
    """Get or create global scheduler service instance"""
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService()
    return _scheduler_service
