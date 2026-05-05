from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import Literal


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    email: str
    exp: int
    type: Literal["access", "refresh"]


class GoogleProfile(BaseModel):
    google_id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSchema


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
