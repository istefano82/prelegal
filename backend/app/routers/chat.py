import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import litellm

from app.dependencies import get_db, get_conversation_owner, ConversationOwner
from app.services import ChatService, StreamService
from app.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    MessageSchema,
    NDAContextSchema,
)
from app.exceptions import OwnershipError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse, status_code=201)
async def send_message(
    request: ChatMessageRequest,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    try:
        conversation, message, analysis = await service.process_message(
            owner,
            request.conversation_id,
            request.message,
            request.document_context,
        )
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=str(e))
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
    conversation_id: UUID,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    try:
        messages = await service.get_history(owner, str(conversation_id))
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if messages is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return messages


@router.post("/stream")
async def stream_message(
    message: str = Query(...),
    conversation_id: str | None = Query(None),
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream a message response in real-time using SSE.
    Supports both query parameters and request body.
    """
    service = StreamService(db)
    try:
        return StreamingResponse(
            service.stream_message(
                owner=owner,
                conversation_id=conversation_id,
                user_message=message,
                document_context=None,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in stream: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
