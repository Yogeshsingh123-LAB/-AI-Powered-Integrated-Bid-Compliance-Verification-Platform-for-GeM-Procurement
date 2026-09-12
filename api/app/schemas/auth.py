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

class PasswordVerification(BaseModel):
    password: str = Field(..., min_length=1, repr=False)

class BiometricLoginRequest(BaseModel):
    email: EmailStr
    device_type: str = Field("external_hardware_key", description="external_hardware_key biometric device")
    credential_id: str | None = None
    authenticator_data: str | None = None

class BiometricToggleRequest(BaseModel):
    enabled: bool

class BiometricRegisterRequest(BaseModel):
    device_type: str = Field("external_hardware_key", description="external_hardware_key biometric device")
    device_name: str | None = "External Biometric Fingerprint Device"
    credential_id: str | None = None

