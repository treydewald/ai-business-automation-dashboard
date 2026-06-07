import uuid
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.trigger import Trigger, TriggerType
from app.models.workflow import Workflow
from app.models.execution import Execution, ExecutionStatus

logger = logging.getLogger(__name__)

class TriggerService:
    WEBHOOK_SECRET_LENGTH = 32

    @staticmethod
    def create_trigger(
        db: Session,
        workflow_id: str,
        trigger_type: TriggerType,
        config: Dict[str, Any]
    ) -> Trigger:
        """Create a new trigger for a workflow"""
        trigger = Trigger(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            type=trigger_type,
            config=config
        )

        if trigger_type == TriggerType.WEBHOOK:
            trigger.webhook_id = str(uuid.uuid4())
            trigger.webhook_secret = TriggerService._generate_webhook_secret()

        db.add(trigger)
        db.commit()
        db.refresh(trigger)
        logger.info(f"Created trigger {trigger.id} for workflow {workflow_id}")
        return trigger

    @staticmethod
    def get_trigger(db: Session, trigger_id: str) -> Optional[Trigger]:
        """Retrieve a trigger by ID"""
        return db.query(Trigger).filter(Trigger.id == trigger_id).first()

    @staticmethod
    def get_workflow_triggers(db: Session, workflow_id: str) -> List[Trigger]:
        """Get all triggers for a workflow"""
        return db.query(Trigger).filter(
            Trigger.workflow_id == workflow_id,
            Trigger.deleted_at.is_(None)
        ).all()

    @staticmethod
    def delete_trigger(db: Session, trigger_id: str) -> bool:
        """Soft delete a trigger"""
        trigger = TriggerService.get_trigger(db, trigger_id)
        if not trigger:
            return False

        trigger.deleted_at = datetime.utcnow()
        db.commit()
        logger.info(f"Deleted trigger {trigger_id}")
        return True

    @staticmethod
    def validate_webhook_signature(
        payload: bytes,
        signature: str,
        secret: str
    ) -> bool:
        """Validate webhook HMAC signature"""
        expected_sig = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_sig)

    @staticmethod
    def verify_webhook(db: Session, webhook_id: str, payload: bytes, signature: str) -> Optional[Trigger]:
        """Verify webhook and return trigger if valid"""
        trigger = db.query(Trigger).filter(
            Trigger.webhook_id == webhook_id,
            Trigger.deleted_at.is_(None)
        ).first()

        if not trigger or not trigger.webhook_secret:
            logger.warning(f"Invalid webhook ID: {webhook_id}")
            return None

        if not TriggerService.validate_webhook_signature(payload, signature, trigger.webhook_secret):
            logger.warning(f"Invalid webhook signature for trigger {trigger.id}")
            return None

        return trigger

    @staticmethod
    def _generate_webhook_secret() -> str:
        """Generate a random webhook secret"""
        return hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:TriggerService.WEBHOOK_SECRET_LENGTH]
