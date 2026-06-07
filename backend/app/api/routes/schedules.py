"""Schedule management API routes"""

from fastapi import APIRouter, HTTPException, Query
from typing import List

from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleHistoryResponse,
)
from app.services.scheduler_service import get_scheduler_service

router = APIRouter(prefix="/api", tags=["schedules"])


@router.post("/workflows/{workflow_id}/schedules", response_model=ScheduleResponse)
async def create_schedule(
    workflow_id: str,
    request: ScheduleCreate,
) -> ScheduleResponse:
    """
    Create a new schedule for a workflow.

    Args:
        workflow_id: ID of the workflow
        request: Schedule creation request

    Returns:
        Created schedule
    """
    try:
        service = get_scheduler_service()
        schedule = service.create_schedule(
            workflow_id=workflow_id,
            cron_expression=request.cron_expression,
            timezone=request.timezone,
            description=request.description,
            enabled=request.enabled,
            max_instances=request.max_instances,
        )

        return ScheduleResponse(**schedule.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create schedule: {str(e)}")


@router.get("/workflows/{workflow_id}/schedules", response_model=List[ScheduleResponse])
async def get_workflow_schedules(workflow_id: str) -> List[ScheduleResponse]:
    """
    Get all schedules for a workflow.

    Args:
        workflow_id: ID of the workflow

    Returns:
        List of schedules
    """
    try:
        service = get_scheduler_service()
        schedules = service.get_schedules_for_workflow(workflow_id)
        return [ScheduleResponse(**s.to_dict()) for s in schedules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(schedule_id: str) -> ScheduleResponse:
    """
    Get a specific schedule by ID.

    Args:
        schedule_id: ID of the schedule

    Returns:
        Schedule details
    """
    try:
        service = get_scheduler_service()
        schedule = service.get_schedule(schedule_id)
        return ScheduleResponse(**schedule.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: str,
    request: ScheduleUpdate,
) -> ScheduleResponse:
    """
    Update a schedule.

    Args:
        schedule_id: ID of the schedule
        request: Update request

    Returns:
        Updated schedule
    """
    try:
        service = get_scheduler_service()
        schedule = service.update_schedule(
            schedule_id=schedule_id,
            cron_expression=request.cron_expression,
            timezone=request.timezone,
            description=request.description,
            enabled=request.enabled,
            max_instances=request.max_instances,
        )
        return ScheduleResponse(**schedule.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str):
    """
    Delete a schedule.

    Args:
        schedule_id: ID of the schedule

    Returns:
        Confirmation message
    """
    try:
        service = get_scheduler_service()
        service.delete_schedule(schedule_id)
        return {"message": f"Schedule {schedule_id} deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedules/{schedule_id}/pause")
async def pause_schedule(schedule_id: str):
    """
    Pause a schedule (disable it).

    Args:
        schedule_id: ID of the schedule

    Returns:
        Updated schedule
    """
    try:
        service = get_scheduler_service()
        schedule = service.update_schedule(schedule_id=schedule_id, enabled=False)
        return ScheduleResponse(**schedule.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedules/{schedule_id}/resume")
async def resume_schedule(schedule_id: str):
    """
    Resume a schedule (enable it).

    Args:
        schedule_id: ID of the schedule

    Returns:
        Updated schedule
    """
    try:
        service = get_scheduler_service()
        schedule = service.update_schedule(schedule_id=schedule_id, enabled=True)
        return ScheduleResponse(**schedule.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedules/{schedule_id}/history", response_model=List[ScheduleHistoryResponse])
async def get_schedule_history(
    schedule_id: str,
    limit: int = Query(100, ge=1, le=1000),
) -> List[ScheduleHistoryResponse]:
    """
    Get execution history for a schedule.

    Args:
        schedule_id: ID of the schedule
        limit: Maximum number of history entries to return

    Returns:
        List of execution history entries
    """
    try:
        service = get_scheduler_service()
        history = service.get_execution_history(schedule_id=schedule_id, limit=limit)
        return [ScheduleHistoryResponse(**h) for h in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedules")
async def list_all_schedules() -> List[ScheduleResponse]:
    """
    List all schedules.

    Returns:
        List of all schedules
    """
    try:
        service = get_scheduler_service()
        schedules = service.list_schedules()
        return [ScheduleResponse(**s.to_dict()) for s in schedules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
