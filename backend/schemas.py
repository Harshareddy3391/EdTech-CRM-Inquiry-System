import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserTypeEnum(str, Enum):
    PARENT = "Parent"
    STUDENT = "Student"
    SCHOOL = "School"

class CategoryEnum(str, Enum):
    SCHOLARSHIP = "Scholarship"
    CONCERT = "Concert"
    ADMISSION = "Admission"
    GENERAL_QUERY = "General Query"

class InquiryStatusEnum(str, Enum):
    NEW = "New"
    IN_REVIEW = "In Review"
    CONTACTED = "Contacted"
    RESOLVED = "Resolved"

# Public Inquiry Schemas
class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name of applicant/inquirer")
    email: EmailStr = Field(..., description="Valid contact email address")
    phone: str = Field(..., min_length=7, max_length=50, description="Contact phone number with area/country code")
    user_type: UserTypeEnum = Field(..., description="Parent, Student, or School")
    category: CategoryEnum = Field(..., description="Scholarship, Concert, Admission, or General Query")
    message: str = Field(..., min_length=5, max_length=4000, description="Inquiry description or request details")

class InquiryStatusUpdate(BaseModel):
    status: InquiryStatusEnum = Field(..., description="Updated lifecycle status")

class InquiryResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str
    user_type: UserTypeEnum
    category: CategoryEnum
    message: str
    status: InquiryStatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Admin Auth Schemas
class AdminRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse
