"""Tests for trigger service and routes"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base
from app.models.trigger import Trigger, TriggerType
from app.models.workflow import Workflow, WorkflowStatus
from app.models.execution import Execution
from app.services.trigger_service import TriggerService
import json
import uuid

@pytest.fixture
def db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def sample_workflow(db):
    """Create a sample workflow for testing"""
    workflow = Workflow(
        id="test-workflow-1",
        name="Test Workflow",
        description="Test workflow for triggers",
        definition={"steps": []},
        status=WorkflowStatus.ACTIVE
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

class TestTriggerService:
    """Test TriggerService"""

    def test_create_manual_trigger(self, db, sample_workflow):
        """Test creating a manual trigger"""
        trigger = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.MANUAL,
            config={}
        )
        assert trigger.id is not None
        assert trigger.workflow_id == sample_workflow.id
        assert trigger.type == TriggerType.MANUAL
        assert trigger.webhook_id is None
        assert trigger.webhook_secret is None

    def test_create_webhook_trigger(self, db, sample_workflow):
        """Test creating a webhook trigger"""
        trigger = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.WEBHOOK,
            config={"url": "https://example.com"}
        )
        assert trigger.webhook_id is not None
        assert trigger.webhook_secret is not None
        assert len(trigger.webhook_secret) == 32

    def test_get_trigger(self, db, sample_workflow):
        """Test retrieving a trigger"""
        trigger1 = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.MANUAL,
            config={}
        )
        retrieved = TriggerService.get_trigger(db, trigger1.id)
        assert retrieved.id == trigger1.id
        assert retrieved.type == TriggerType.MANUAL

    def test_get_nonexistent_trigger(self, db):
        """Test retrieving a nonexistent trigger"""
        trigger = TriggerService.get_trigger(db, "nonexistent-id")
        assert trigger is None

    def test_get_workflow_triggers(self, db, sample_workflow):
        """Test retrieving all triggers for a workflow"""
        trigger1 = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.MANUAL,
            config={}
        )
        trigger2 = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.WEBHOOK,
            config={}
        )
        triggers = TriggerService.get_workflow_triggers(db, sample_workflow.id)
        assert len(triggers) == 2
        assert trigger1.id in [t.id for t in triggers]
        assert trigger2.id in [t.id for t in triggers]

    def test_delete_trigger(self, db, sample_workflow):
        """Test deleting a trigger"""
        trigger = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.MANUAL,
            config={}
        )
        success = TriggerService.delete_trigger(db, trigger.id)
        assert success is True

        db.refresh(trigger)
        assert trigger.deleted_at is not None

        triggers = TriggerService.get_workflow_triggers(db, sample_workflow.id)
        assert len(triggers) == 0

    def test_delete_nonexistent_trigger(self, db):
        """Test deleting a nonexistent trigger"""
        success = TriggerService.delete_trigger(db, "nonexistent-id")
        assert success is False

    def test_webhook_signature_validation(self):
        """Test webhook signature validation"""
        secret = "test-secret"
        payload = b"test payload"

        import hmac
        import hashlib
        expected_sig = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        is_valid = TriggerService.validate_webhook_signature(payload, expected_sig, secret)
        assert is_valid is True

    def test_webhook_signature_invalid(self):
        """Test invalid webhook signature"""
        secret = "test-secret"
        payload = b"test payload"
        invalid_sig = "invalid-signature"

        is_valid = TriggerService.validate_webhook_signature(payload, invalid_sig, secret)
        assert is_valid is False

    def test_verify_webhook_valid(self, db, sample_workflow):
        """Test webhook verification with valid signature"""
        trigger = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.WEBHOOK,
            config={}
        )

        payload = b'{"test": "data"}'
        import hmac
        import hashlib
        signature = hmac.new(
            trigger.webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        verified_trigger = TriggerService.verify_webhook(db, trigger.webhook_id, payload, signature)
        assert verified_trigger is not None
        assert verified_trigger.id == trigger.id

    def test_verify_webhook_invalid_signature(self, db, sample_workflow):
        """Test webhook verification with invalid signature"""
        trigger = TriggerService.create_trigger(
            db=db,
            workflow_id=sample_workflow.id,
            trigger_type=TriggerType.WEBHOOK,
            config={}
        )

        payload = b'{"test": "data"}'
        verified_trigger = TriggerService.verify_webhook(db, trigger.webhook_id, payload, "invalid-sig")
        assert verified_trigger is None

    def test_verify_webhook_invalid_id(self, db):
        """Test webhook verification with invalid webhook ID"""
        payload = b'{"test": "data"}'
        verified_trigger = TriggerService.verify_webhook(db, "nonexistent-id", payload, "sig")
        assert verified_trigger is None
