from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from uuid import uuid4

from app.dependencies import get_db, get_current_user
from app.services import AuthService
from app.models import User
from app.schemas import UserSchema, TokenPair, AuthResponse, RegisterRequest, LoginRequest
from app.config import settings
from app.exceptions import AuthError, ValidationError, WeakPasswordError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/authorize")
async def google_authorize():
    """
    Redirect user to Google OAuth consent screen.
    """
    scope = "openid email profile"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
    )
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str = Query(None),
    session_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    Exchanges code for tokens, creates/updates user, and sets auth cookies.
    """
    try:
        auth_service = AuthService(db)

        # Exchange code for Google profile
        google_profile = await auth_service.google_oauth_exchange(
            code=code,
            redirect_uri=settings.google_redirect_uri,
        )

        # Create or update user
        user = await auth_service.get_or_create_user(google_profile)
        await db.commit()

        # Create JWT pair
        token_pair = auth_service.create_token_pair(user)

        # Migrate anonymous session if provided
        if session_id:
            await auth_service.migrate_anonymous_session(session_id, user.id)
            await db.commit()

        # Create response with redirect
        response = RedirectResponse(url=f"{settings.frontend_url}/?auth=success")

        # Set HttpOnly cookies
        response.set_cookie(
            key="access_token",
            value=token_pair.access_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.access_token_expire_minutes * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.refresh_token_expire_days * 86400,
        )

        return response

    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": "OAUTH_FAILED", "message": e.message},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "OAUTH_ERROR", "message": "An unexpected error occurred"},
        )


@router.post("/refresh")
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using refresh token from HttpOnly cookie.
    """
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        auth_service = AuthService(db)
        payload = auth_service.verify_refresh_token(refresh_token_value)

        # Get user
        user = await db.get(User, payload.sub)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Create new token pair
        token_pair = auth_service.create_token_pair(user)

        response = Response()
        response.set_cookie(
            key="access_token",
            value=token_pair.access_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.access_token_expire_minutes * 60,
        )

        return {"access_token": token_pair.access_token, "token_type": "bearer"}

    except AuthError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user with email and password.
    """
    try:
        auth_service = AuthService(db)
        user = await auth_service.register_user(body.email, body.password, body.name)
        await db.commit()

        token_pair = auth_service.create_token_pair(user)

        response = Response(status_code=201)
        response.set_cookie(
            key="access_token",
            value=token_pair.access_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.access_token_expire_minutes * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.refresh_token_expire_days * 86400,
        )

        return AuthResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            token_type="bearer",
            user=UserSchema.model_validate(user),
        )

    except WeakPasswordError as e:
        raise HTTPException(
            status_code=422,
            detail={"code": "WEAK_PASSWORD", "message": e.message, "field": "password"},
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={"code": "VALIDATION_ERROR", "message": e.message, "field": e.field},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "REGISTRATION_ERROR", "message": "Registration failed"},
        )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user with email and password.
    """
    try:
        auth_service = AuthService(db)
        user = await auth_service.authenticate_user(body.email, body.password)
        await db.commit()

        token_pair = auth_service.create_token_pair(user)

        response = Response()
        response.set_cookie(
            key="access_token",
            value=token_pair.access_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.access_token_expire_minutes * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=token_pair.refresh_token,
            httponly=True,
            samesite="lax",
            secure=settings.cookie_secure,
            max_age=settings.refresh_token_expire_days * 86400,
        )

        return AuthResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            token_type="bearer",
            user=UserSchema.model_validate(user),
        )

    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": "INVALID_CREDENTIALS", "message": e.message},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "LOGIN_ERROR", "message": "Login failed"},
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Clear auth cookies.
    """
    response.delete_cookie("access_token", samesite="lax")
    response.delete_cookie("refresh_token", samesite="lax")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserSchema)
async def get_current_user_endpoint(user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
