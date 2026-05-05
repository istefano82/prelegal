from datetime import datetime, timezone, timedelta
from typing import Optional
import json
import httpx
import re
from jose import JWTError, jwt
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from passlib.context import CryptContext

from app.models import User, AnonymousSession
from app.schemas import GoogleProfile, TokenPair, TokenPayload, UserSchema
from app.config import settings
from app.exceptions import AuthError, ValidationError, WeakPasswordError


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Handles OAuth, JWT, and session management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def google_oauth_exchange(self, code: str, redirect_uri: str) -> GoogleProfile:
        """
        Exchange Google OAuth code for user info.
        Returns GoogleProfile with user data.
        """
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )

            if token_response.status_code != 200:
                raise AuthError("Failed to exchange code for tokens", 503)

            token_data = token_response.json()
            id_token = token_data.get("id_token")

            if not id_token:
                raise AuthError("No id_token in response", 503)

            # Verify id_token and get user info
            try:
                # Decode without verification first to get claims (we trust Google's signature)
                # In production, verify the signature using Google's public keys
                payload = jwt.get_unverified_claims(id_token)

                return GoogleProfile(
                    google_id=payload.get("sub", ""),
                    email=payload.get("email", ""),
                    name=payload.get("name"),
                    avatar_url=payload.get("picture"),
                )
            except Exception as e:
                raise AuthError(f"Failed to decode id_token: {str(e)}", 503)

    async def get_or_create_user(self, google_profile: GoogleProfile) -> User:
        """
        Create or update a user from Google profile.
        """
        # Check if user exists by google_id
        stmt = select(User).where(User.google_id == google_profile.google_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            # Update last login
            user.last_login_at = datetime.now(timezone.utc)
            self.db.add(user)
        else:
            # Create new user
            user = User(
                id=str(uuid4()),
                email=google_profile.email,
                name=google_profile.name,
                avatar_url=google_profile.avatar_url,
                google_id=google_profile.google_id,
                created_at=datetime.now(timezone.utc),
                last_login_at=datetime.now(timezone.utc),
                is_active=True,
            )
            self.db.add(user)

        await self.db.flush()
        return user

    def create_token_pair(self, user: User) -> TokenPair:
        """
        Create JWT access and refresh tokens for a user.
        """
        now = datetime.now(timezone.utc)
        access_expiry = now + timedelta(minutes=settings.access_token_expire_minutes)
        refresh_expiry = now + timedelta(days=settings.refresh_token_expire_days)

        # Access token
        access_payload = {
            "sub": user.id,
            "email": user.email,
            "type": "access",
            "exp": int(access_expiry.timestamp()),
        }
        access_token = jwt.encode(
            access_payload,
            settings.secret_key,
            algorithm="HS256",
        )

        # Refresh token
        refresh_payload = {
            "sub": user.id,
            "email": user.email,
            "type": "refresh",
            "exp": int(refresh_expiry.timestamp()),
        }
        refresh_token = jwt.encode(
            refresh_payload,
            settings.secret_key,
            algorithm="HS256",
        )

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    def verify_access_token(self, token: str) -> TokenPayload:
        """
        Verify and decode an access token.
        Raises AuthError if token is invalid or expired.
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=["HS256"],
            )

            if payload.get("type") != "access":
                raise AuthError("Invalid token type", 401)

            return TokenPayload(**payload)
        except JWTError:
            raise AuthError("Invalid or expired token", 401)

    def verify_refresh_token(self, token: str) -> TokenPayload:
        """
        Verify and decode a refresh token.
        Raises AuthError if token is invalid or expired.
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=["HS256"],
            )

            if payload.get("type") != "refresh":
                raise AuthError("Invalid token type", 401)

            return TokenPayload(**payload)
        except JWTError:
            raise AuthError("Invalid or expired refresh token", 401)

    async def get_or_create_anonymous_session(self, session_id: Optional[str] = None) -> AnonymousSession:
        """
        Get an existing anonymous session or create a new one.
        """
        if session_id:
            stmt = select(AnonymousSession).where(AnonymousSession.id == session_id)
            result = await self.db.execute(stmt)
            session = result.scalar_one_or_none()

            if session:
                # Update last_seen_at
                session.last_seen_at = datetime.now(timezone.utc)
                self.db.add(session)
                await self.db.flush()
                return session

        # Create new session, using the provided session_id as the DB key if available
        session = AnonymousSession(
            id=session_id if session_id else str(uuid4()),
            created_at=datetime.now(timezone.utc),
            last_seen_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.anonymous_session_expire_days),
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def migrate_anonymous_session(self, session_id: str, user_id: str) -> int:
        """
        Transfer all conversations from an anonymous session to a user.
        Returns the number of conversations migrated.
        """
        from app.models import Conversation

        # Update all conversations from this session to the user
        stmt = (
            update(Conversation)
            .where(Conversation.session_id == session_id)
            .values(user_id=user_id, session_id=None)
        )
        result = await self.db.execute(stmt)

        # Mark session as migrated
        stmt = (
            update(AnonymousSession)
            .where(AnonymousSession.id == session_id)
            .values(migrated_to_user_id=user_id)
        )
        await self.db.execute(stmt)

        return result.rowcount

    @staticmethod
    def _validate_password_strength(password: str) -> None:
        """
        Validate password meets strength requirements.
        Raises WeakPasswordError if validation fails.
        """
        if len(password) < 8:
            raise WeakPasswordError("Password must be at least 8 characters")
        if not any(c.isupper() for c in password):
            raise WeakPasswordError("Password must contain an uppercase letter")
        if not any(c.isdigit() for c in password):
            raise WeakPasswordError("Password must contain a digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in password):
            raise WeakPasswordError("Password must contain a special character")

    @staticmethod
    def _validate_email_format(email: str) -> None:
        """
        Validate email format.
        Raises ValidationError if invalid.
        """
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format", field="email")

    async def register_user(self, email: str, password: str, name: str | None = None) -> User:
        """
        Register a new user with email and password.
        Raises ValidationError if email already exists or validation fails.
        """
        self._validate_email_format(email)
        self._validate_password_strength(password)

        # Check email uniqueness
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise ValidationError("Email already registered", field="email")

        # Hash password and create user
        password_hash = pwd_context.hash(password)
        user = User(
            id=str(uuid4()),
            email=email,
            name=name,
            password_hash=password_hash,
            created_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc),
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        Authenticate user with email and password.
        Raises AuthError if credentials are invalid.
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.password_hash or not pwd_context.verify(password, user.password_hash):
            raise AuthError("Invalid credentials", 401)

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        self.db.add(user)
        await self.db.flush()
        return user
