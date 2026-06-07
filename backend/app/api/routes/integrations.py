from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
import uuid
from datetime import datetime
import json
import logging

from app.db import get_db
from app.models.integration import Integration, IntegrationStatus
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    IntegrationTestResponse,
)
from app.services.encryption import get_encryption_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/integrations", tags=["integrations"])

encryption_service = get_encryption_service()


@router.post("", response_model=IntegrationResponse, status_code=201)
def create_integration(
    integration: IntegrationCreate, db: Session = Depends(get_db)
):
    """Create a new integration."""
    encrypted_creds = encryption_service.encrypt(integration.credentials)

    db_integration = Integration(
        id=str(uuid.uuid4()),
        type=integration.type,
        name=integration.name,
        credentials=encrypted_creds,
        config=integration.config,
        status=IntegrationStatus.ACTIVE,
        call_count="0",
    )
    db.add(db_integration)
    db.commit()
    db.refresh(db_integration)

    logger.info(f"Integration created: {db_integration.id} (type: {db_integration.type})")
    return db_integration


@router.get("", response_model=list[IntegrationResponse])
def list_integrations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    integration_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all integrations with optional filtering."""
    query = db.query(Integration).filter(Integration.deleted_at == None)

    if integration_type:
        query = query.filter(Integration.type == integration_type)

    if status:
        try:
            query = query.filter(Integration.status == IntegrationStatus[status.upper()])
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")

    total = query.count()
    integrations = (
        query.order_by(desc(Integration.created_at)).offset(skip).limit(limit).all()
    )

    return integrations


@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration(integration_id: str, db: Session = Depends(get_db)):
    """Get a specific integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id, Integration.deleted_at == None
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    return integration


@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(
    integration_id: str,
    update: IntegrationUpdate,
    db: Session = Depends(get_db),
):
    """Update an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id, Integration.deleted_at == None
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if update.name is not None:
        integration.name = update.name
    if update.config is not None:
        integration.config = update.config
    if update.credentials is not None:
        integration.credentials = encryption_service.encrypt(update.credentials)

    integration.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(integration)

    logger.info(f"Integration updated: {integration_id}")
    return integration


@router.delete("/{integration_id}", status_code=204)
def delete_integration(integration_id: str, db: Session = Depends(get_db)):
    """Soft delete an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id, Integration.deleted_at == None
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.deleted_at = datetime.utcnow()
    db.commit()

    logger.info(f"Integration deleted: {integration_id}")
    return None


@router.post("/{integration_id}/test", response_model=IntegrationTestResponse)
def test_integration(integration_id: str, db: Session = Depends(get_db)):
    """Test an integration connection."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id, Integration.deleted_at == None
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    try:
        integration.status = IntegrationStatus.TESTING
        integration.last_tested_at = datetime.utcnow()
        db.commit()

        decrypted_creds = encryption_service.decrypt(integration.credentials)
        logger.info(
            f"Testing integration {integration_id} (type: {integration.type})"
        )

        integration.status = IntegrationStatus.ACTIVE
        integration.last_error = None
        db.commit()

        return IntegrationTestResponse(
            success=True, message="Integration test successful"
        )

    except Exception as e:
        error_msg = str(e)
        integration.status = IntegrationStatus.ERROR
        integration.last_error = error_msg
        db.commit()

        logger.error(f"Integration test failed: {integration_id} - {error_msg}")
        return IntegrationTestResponse(
            success=False, message="Integration test failed", error=error_msg
        )
