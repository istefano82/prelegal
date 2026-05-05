from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Request, HTTPException
from app.database import AsyncSessionLocal
from app.services import AuthService
from app.models import User
from app.exceptions import AuthError
from app.types import ConversationOwner


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Extract JWT from HttpOnly cookie. Returns None if not authenticated.
    """
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        auth_service = AuthService(db)
        payload = auth_service.verify_access_token(token)
        user = await db.get(User, payload.sub)
        return user
    except AuthError:
        return None


async def require_user(
    user: User | None = Depends(get_current_user),
) -> User:
    """
    Dependency for routes that require authentication.
    Raises 401 if not authenticated.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def get_conversation_owner(
    request: Request,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOwner:
    """
    Returns the identity that should own conversations.
    Authenticated: ConversationOwner(user_id=user.id, session_id=None)
    Anonymous: resolves/creates AnonymousSession from X-Session-ID header
    """
    if user:
        return ConversationOwner(user_id=user.id, session_id=None)

    session_id = request.headers.get("X-Session-ID")
    auth_service = AuthService(db)
    session = await auth_service.get_or_create_anonymous_session(session_id)
    return ConversationOwner(user_id=None, session_id=session.id)
