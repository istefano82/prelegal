import json
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from litellm import acompletion
from pydantic import ValidationError

from app.services.chat_service import ChatService, ConversationOwner
from app.services.document_service import DocumentService
from app.schemas import LegalAnalysisResponse, NDAContextSchema
from app.config import settings

logger = logging.getLogger(__name__)


class StreamService:
    """Wraps ChatService to produce SSE-compatible async generators for real-time streaming."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.chat_service = ChatService(db)

    async def stream_message(
        self,
        owner: ConversationOwner,
        conversation_id: str | None,
        user_message: str,
        document_context: NDAContextSchema | None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a message response in SSE format.
        Yields JSON frames with events: token, field_updates, done, error.
        """
        try:
            # Get or create conversation
            conversation = await self.chat_service._get_or_create_conversation(
                owner, conversation_id, document_context
            )

            # Build history
            history = await self.chat_service._build_message_history(conversation.id)

            # Build system prompt and messages
            system_prompt = self.chat_service._build_system_prompt(document_context)
            messages = [{"role": "system", "content": system_prompt}] + history + [
                {"role": "user", "content": user_message}
            ]

            # Call LLM with streaming
            # Note: Some models may not support response_format constraint
            # For gpt-oss-120b, skip it to avoid provider errors
            llm_kwargs = {
                "model": settings.litellm_model,
                "messages": messages,
                "temperature": 0.3,
                "stream": True,
            }

            # Add response_format only for models that reliably support it (Claude, GPT-4)
            if "claude" in settings.litellm_model.lower() or "gpt-4" in settings.litellm_model.lower():
                llm_kwargs["response_format"] = {"type": "json_object"}

            response = await acompletion(**llm_kwargs)

            # Collect full response
            full_content = ""
            async for chunk in response:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_content += token
                    # Yield token event for real-time display
                    yield self._format_sse_frame(
                        event="token",
                        data={"text": token},
                    )

            # Parse full response
            try:
                parsed = json.loads(full_content)
                if "field_updates" in parsed and isinstance(parsed["field_updates"], dict):
                    parsed["field_updates"] = self.chat_service._sanitize_field_updates(
                        parsed["field_updates"]
                    )
                analysis = LegalAnalysisResponse(**parsed)
            except (json.JSONDecodeError, ValidationError) as e:
                logger.error(f"Failed to parse/validate LLM response: {e}. Raw: {full_content!r}")
                analysis = LegalAnalysisResponse(
                    answer="Unable to parse AI response",
                    confidence="low",
                )

            # Save messages
            user_msg = await self.chat_service._save_message(conversation.id, "user", user_message)
            assistant_msg = await self.chat_service._save_message(
                conversation.id, "assistant", analysis.answer
            )
            await self.db.commit()

            # Auto-save snapshot if all NDA fields are populated
            if document_context and self._all_fields_populated(document_context):
                try:
                    doc_service = DocumentService(self.db)
                    await doc_service.save_snapshot(
                        owner,
                        conversation.id,
                        document_context,
                        title=f"NDA - {document_context.purpose[:50] if document_context.purpose else 'Untitled'}",
                    )
                    await self.db.commit()
                except Exception as e:
                    logger.warning(f"Failed to auto-save snapshot: {e}")

            # Yield field updates event
            yield self._format_sse_frame(
                event="field_updates",
                data={
                    "answer": analysis.answer,
                    "field_updates": analysis.field_updates,
                    "confidence": analysis.confidence,
                    "suggested_clauses": analysis.suggested_clauses,
                    "warnings": analysis.warnings,
                    "follow_up_questions": analysis.follow_up_questions,
                },
            )

            # Yield done event
            yield self._format_sse_frame(
                event="done",
                data={
                    "conversation_id": conversation.id,
                    "message_id": assistant_msg.id,
                    "created_at": assistant_msg.created_at.isoformat(),
                },
            )

        except Exception as e:
            logger.error(f"Error in stream_message: {e}")
            yield self._format_sse_frame(
                event="error",
                data={
                    "code": "STREAM_ERROR",
                    "message": "An error occurred while streaming the response",
                },
            )

    @staticmethod
    def _all_fields_populated(context: NDAContextSchema) -> bool:
        """
        Check if all required NDA fields are populated.
        Returns True if 17 of 18 fields are non-null (allowing for optional flexibility).
        """
        fields = [
            context.purpose,
            context.effectiveDate,
            context.mndaTerm,
            context.confidentialityTerm,
            context.governingLaw,
            context.jurisdiction,
            context.party1Name,
            context.party1Title,
            context.party1Company,
            context.party1Address,
            context.party1Email,
            context.party1Date,
            context.party2Name,
            context.party2Title,
            context.party2Company,
            context.party2Address,
            context.party2Email,
            context.party2Date,
        ]
        populated_count = sum(1 for field in fields if field)
        return populated_count >= 17

    @staticmethod
    def _format_sse_frame(event: str, data: dict) -> str:
        """Format a message as an SSE frame."""
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"
