from app.routers.chat import router as chat_router
from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router

__all__ = ["chat_router", "auth_router", "documents_router"]
