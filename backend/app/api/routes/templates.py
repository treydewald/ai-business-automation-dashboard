from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.db import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateListResponse
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.post("", response_model=TemplateResponse, status_code=201)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    db_template = Template(
        id=str(uuid.uuid4()),
        name=template.name,
        description=template.description,
        category=template.category,
        definition=template.definition,
        tags=template.tags or [],
        author_id=template.author_id,
        author_name=template.author_name,
        is_public=1,
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("", response_model=TemplateListResponse)
def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    public_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    query = db.query(Template).filter(Template.deleted_at == None)

    if public_only:
        query = query.filter(Template.is_public == 1)

    if category:
        query = query.filter(Template.category == category)

    if search:
        query = query.filter(Template.name.ilike(f"%{search}%"))

    total = query.count()
    templates = query.order_by(desc(Template.created_at)).offset(skip).limit(limit).all()

    return TemplateListResponse(
        templates=templates,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.deleted_at == None
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template

@router.post("/{template_id}/import", status_code=201)
def import_template(
    template_id: str,
    db: Session = Depends(get_db)
):
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.deleted_at == None,
        Template.is_public == 1
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Increment usage count
    template.usage_count += 1
    db.commit()
    db.refresh(template)

    # Return the template definition for import
    return {
        "id": template.id,
        "name": template.name,
        "definition": template.definition,
        "category": template.category,
    }

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: str,
    template_update: TemplateCreate,
    db: Session = Depends(get_db)
):
    db_template = db.query(Template).filter(
        Template.id == template_id,
        Template.deleted_at == None
    ).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db_template.name = template_update.name
    db_template.description = template_update.description
    db_template.category = template_update.category
    db_template.definition = template_update.definition
    db_template.tags = template_update.tags or []
    db_template.version += 1
    db_template.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: str, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(
        Template.id == template_id,
        Template.deleted_at == None
    ).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Soft delete
    db_template.deleted_at = datetime.utcnow()
    db.commit()
