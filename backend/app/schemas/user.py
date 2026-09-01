from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: str
    is_active: bool

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    department: Optional[str] = "Procurement"
    status: Optional[str] = "Active"
    permissions: Optional[str] = None
    last_login: Optional[datetime] = None
    auth_user_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

class UserStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    status: Optional[str] = None

class AdminUserCreate(BaseModel):
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = "Procurement"
    role: Optional[str] = "OFFICER"
    status: Optional[str] = "Active"
    password: str = Field(..., min_length=4)
    permissions: Optional[list[str]] = []
    admin_authorization_password: Optional[str] = None

