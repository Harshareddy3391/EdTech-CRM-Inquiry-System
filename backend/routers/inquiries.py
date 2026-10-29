import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..auth import get_current_admin
from ..database import get_db
from ..models import Admin, Inquiry
from ..schemas import (
    CategoryEnum,
    InquiryCreate,
    InquiryResponse,
    InquiryStatusEnum,
    InquiryStatusUpdate,
    UserTypeEnum,
)

router = APIRouter(prefix="/api/inquiries", tags=["Inquiries"])

@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_public_inquiry(inquiry_in: InquiryCreate, db: Session = Depends(get_db)):
    """
    Public Endpoint: Anyone can submit an educational inquiry.
    Persists data directly into Supabase PostgreSQL.
    """
    db_inquiry = Inquiry(
        name=inquiry_in.name.strip(),
        email=inquiry_in.email.strip().lower(),
        phone=inquiry_in.phone.strip(),
        user_type=inquiry_in.user_type,
        category=inquiry_in.category,
        message=inquiry_in.message.strip(),
        status="New"
    )
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry

@router.get("", response_model=List[InquiryResponse])
def list_inquiries_for_admin(
    category: Optional[CategoryEnum] = Query(None, description="Filter by Category"),
    user_type: Optional[UserTypeEnum] = Query(None, description="Filter by User Type"),
    inquiry_status: Optional[InquiryStatusEnum] = Query(None, alias="status", description="Filter by Inquiry Status"),
    search: Optional[str] = Query(None, description="Search across Name or Phone number"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Protected Admin Route:
    Returns submitted inquiries with multi-criteria filtering and text search.
    Protected strictly with custom JWT bearer token.
    """
    query = db.query(Inquiry)

    if category:
        query = query.filter(Inquiry.category == category)
    if user_type:
        query = query.filter(Inquiry.user_type == user_type)
    if inquiry_status:
        query = query.filter(Inquiry.status == inquiry_status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Inquiry.name.ilike(term), Inquiry.phone.ilike(term)))

    # Order by newest first
    inquiries = query.order_by(Inquiry.created_at.desc()).all()
    return inquiries

@router.get("/{inquiry_id}", response_model=InquiryResponse)
def get_inquiry_detail(
    inquiry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Protected Admin Route: Retrieve specific inquiry details."""
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry

@router.patch("/{inquiry_id}/status", response_model=InquiryResponse)
def update_inquiry_status(
    inquiry_id: uuid.UUID,
    status_update: InquiryStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Protected Admin Route: Update inquiry lifecycle status."""
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = status_update.status
    db.commit()
    db.refresh(inquiry)
    return inquiry
