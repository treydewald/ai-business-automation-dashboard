from app.models.alert import Alert, AlertCondition, AlertStatus
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import json

class AlertingService:
    """Service for managing alerts and alert notifications."""

    @staticmethod
    def create_alert(
        db: Session,
        name: str,
        description: str,
        condition: AlertCondition,
        threshold: float,
        notification_channels: List[str],
        created_by_id: str,
        workflow_id: Optional[str] = None,
        notification_config: Optional[dict] = None,
    ) -> Alert:
        """Create a new alert."""
        alert = Alert(
            id=__import__('uuid').uuid4().__str__(),
            name=name,
            description=description,
            condition=condition,
            threshold=threshold,
            notification_channels=notification_channels,
            notification_config=notification_config or {},
            created_by_id=created_by_id,
            workflow_id=workflow_id,
            status=AlertStatus.ACTIVE,
            is_enabled=True,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def evaluate_alerts(
        db: Session,
        execution_data: dict,
        workflow_id: str,
    ) -> List[dict]:
        """Evaluate all active alerts against execution data."""
        alerts_to_trigger = []

        # Get all active alerts for this workflow or global
        active_alerts = db.query(Alert).filter(
            Alert.is_enabled == True,
            Alert.status == AlertStatus.ACTIVE,
            (Alert.workflow_id == workflow_id) | (Alert.workflow_id == None),
        ).all()

        for alert in active_alerts:
            should_trigger = False

            # Check conditions
            if alert.condition == AlertCondition.FAILURE_RATE:
                failure_count = execution_data.get('failure_count', 0)
                total_count = execution_data.get('total_count', 1)
                failure_rate = (failure_count / total_count) * 100 if total_count > 0 else 0
                should_trigger = failure_rate >= alert.threshold

            elif alert.condition == AlertCondition.EXECUTION_DURATION:
                duration = execution_data.get('duration_seconds', 0)
                should_trigger = duration >= alert.threshold

            elif alert.condition == AlertCondition.ERROR_TYPE:
                error_type = execution_data.get('error_type')
                should_trigger = error_type and error_type == alert.threshold

            elif alert.condition == AlertCondition.INTEGRATION_ERROR:
                integration_error = execution_data.get('integration_error', False)
                should_trigger = integration_error

            if should_trigger:
                alerts_to_trigger.append({
                    'alert_id': alert.id,
                    'alert_name': alert.name,
                    'condition': alert.condition,
                    'channels': alert.notification_channels,
                    'config': alert.notification_config,
                })

        return alerts_to_trigger

    @staticmethod
    def snooze_alert(
        db: Session,
        alert_id: str,
        duration_minutes: int,
        user_id: str,
    ) -> Alert:
        """Snooze an alert for a specified duration."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise ValueError("Alert not found")

        alert.snoozed_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        alert.snoozed_by_user_id = user_id
        alert.status = AlertStatus.SNOOZED
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def unsnooze_alert(db: Session, alert_id: str) -> Alert:
        """Resume a snoozed alert."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise ValueError("Alert not found")

        alert.snoozed_until = None
        alert.snoozed_by_user_id = None
        alert.status = AlertStatus.ACTIVE
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def test_alert(alert_id: str, alert_data: dict) -> dict:
        """Test an alert configuration."""
        return {
            "status": "alert_would_trigger",
            "alert_id": alert_id,
            "test_data": alert_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
