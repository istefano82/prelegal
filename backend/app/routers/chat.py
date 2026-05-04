import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import litellm

from app.dependencies import get_db
from app.services import ChatService
from app.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    MessageSchema,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse, status_code=201)
async def send_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    try:
        conversation, message, analysis = await service.process_message(
            request.conversation_id,
            request.message,
            request.document_context,
        )
    except litellm.RateLimitError as e:
        logger.warning(f"Rate limit exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI service rate limit exceeded")
    except litellm.AuthenticationError:
        logger.error("LiteLLM authentication failed")
        raise HTTPException(status_code=503, detail="AI service authentication failed")
    except litellm.BadRequestError as e:
        logger.error(f"LiteLLM bad request: {e}")
        raise HTTPException(status_code=422, detail="Invalid request to AI service")
    except Exception as e:
        logger.error(f"Unexpected error in chat: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return ChatMessageResponse(
        conversation_id=conversation.id,
        message_id=message.id,
        analysis=analysis,
        created_at=message.created_at,
    )


@router.get("/{conversation_id}/history", response_model=list[MessageSchema])
async def get_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    messages = await service.get_history(conversation_id)

    if messages is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return messages
