"""Tests for scheduler service"""

import pytest
from datetime import datetime
from app.services.scheduler_service import SchedulerService, ScheduleInfo


class TestScheduleInfo:
    """Test ScheduleInfo class"""

    def test_create_schedule_info(self):
        """Test creating schedule info"""
        schedule = ScheduleInfo(
            schedule_id="test-1",
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
            timezone="America/New_York",
            description="Test schedule",
        )
        assert schedule.schedule_id == "test-1"
        assert schedule.workflow_id == "workflow-1"
        assert schedule.enabled is True

    def test_schedule_to_dict(self):
        """Test schedule to_dict conversion"""
        schedule = ScheduleInfo(
            schedule_id="test-1",
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        schedule.update_next_run()
        schedule_dict = schedule.to_dict()
        assert schedule_dict["id"] == "test-1"
        assert schedule_dict["workflow_id"] == "workflow-1"
        assert schedule_dict["enabled"] is True
        assert schedule_dict["next_run"] is not None


class TestSchedulerService:
    """Test SchedulerService"""

    def test_create_schedule(self):
        """Test creating a schedule"""
        service = SchedulerService()
        schedule = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
            timezone="UTC",
            description="Morning task",
        )
        assert schedule.workflow_id == "workflow-1"
        assert schedule.cron_expression == "0 9 * * MON-FRI"
        assert schedule.timezone == "UTC"
        assert schedule.enabled is True
        service.shutdown()

    def test_create_schedule_invalid_cron(self):
        """Test creating schedule with invalid cron expression"""
        service = SchedulerService()
        with pytest.raises(ValueError):
            service.create_schedule(
                workflow_id="workflow-1",
                cron_expression="invalid cron",
            )
        service.shutdown()

    def test_get_schedule(self):
        """Test getting a schedule"""
        service = SchedulerService()
        created = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        retrieved = service.get_schedule(created.schedule_id)
        assert retrieved.schedule_id == created.schedule_id
        assert retrieved.workflow_id == "workflow-1"
        service.shutdown()

    def test_get_nonexistent_schedule(self):
        """Test getting nonexistent schedule"""
        service = SchedulerService()
        with pytest.raises(ValueError):
            service.get_schedule("nonexistent")
        service.shutdown()

    def test_update_schedule(self):
        """Test updating a schedule"""
        service = SchedulerService()
        created = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        updated = service.update_schedule(
            created.schedule_id,
            cron_expression="0 10 * * MON-FRI",
            description="Updated description",
        )
        assert updated.cron_expression == "0 10 * * MON-FRI"
        assert updated.description == "Updated description"
        service.shutdown()

    def test_delete_schedule(self):
        """Test deleting a schedule"""
        service = SchedulerService()
        created = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        service.delete_schedule(created.schedule_id)
        with pytest.raises(ValueError):
            service.get_schedule(created.schedule_id)
        service.shutdown()

    def test_get_schedules_for_workflow(self):
        """Test getting schedules for a specific workflow"""
        service = SchedulerService()
        service.create_schedule("workflow-1", "0 9 * * MON-FRI")
        service.create_schedule("workflow-1", "0 17 * * MON-FRI")
        service.create_schedule("workflow-2", "0 12 * * *")

        schedules = service.get_schedules_for_workflow("workflow-1")
        assert len(schedules) == 2

        schedules = service.get_schedules_for_workflow("workflow-2")
        assert len(schedules) == 1
        service.shutdown()

    def test_list_all_schedules(self):
        """Test listing all schedules"""
        service = SchedulerService()
        service.create_schedule("workflow-1", "0 9 * * MON-FRI")
        service.create_schedule("workflow-2", "0 12 * * *")

        schedules = service.list_schedules()
        assert len(schedules) == 2
        service.shutdown()

    def test_pause_resume_schedule(self):
        """Test pausing and resuming a schedule"""
        service = SchedulerService()
        created = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        assert created.enabled is True

        # Pause
        paused = service.update_schedule(created.schedule_id, enabled=False)
        assert paused.enabled is False

        # Resume
        resumed = service.update_schedule(created.schedule_id, enabled=True)
        assert resumed.enabled is True
        service.shutdown()

    def test_next_run_calculation(self):
        """Test next run time calculation"""
        service = SchedulerService()
        schedule = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 12 * * *",  # Daily at noon UTC
        )
        assert schedule.next_run is not None
        assert schedule.next_run > datetime.utcnow()
        service.shutdown()

    def test_execution_history(self):
        """Test execution history tracking"""
        service = SchedulerService()
        created = service.create_schedule(
            workflow_id="workflow-1",
            cron_expression="0 9 * * MON-FRI",
        )
        # Execute a workflow (simulated)
        service._execute_workflow(created.schedule_id, "workflow-1")

        history = service.get_execution_history(created.schedule_id)
        assert len(history) > 0
        assert history[0]["workflow_id"] == "workflow-1"
        service.shutdown()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
