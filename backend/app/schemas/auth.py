from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse

class UserRegister(BaseModel):
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    password: str = Field(...)
    role: str = Field("BIDDER", description="Only 'BIDDER' is allowed for public registration")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ChangePassword(BaseModel):
    current_password: str = Field(...)
    new_password: str = Field(...)
