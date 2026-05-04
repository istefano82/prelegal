import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from litellm import acompletion
import litellm

from app.models import Conversation, Message
from app.schemas import ChatMessageRequest, LegalAnalysisResponse, NDAContextSchema
from app.config import settings

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = settings.litellm_model

    async def process_message(
        self,
        conversation_id: str | None,
        user_message: str,
        document_context: NDAContextSchema | None,
    ) -> tuple[Conversation, Message, LegalAnalysisResponse]:
        conversation = await self._get_or_create_conversation(conversation_id, document_context)
        history = await self._build_message_history(conversation.id)
        analysis = await self._call_llm(user_message, history, document_context)

        user_msg = await self._save_message(conversation.id, "user", user_message)
        assistant_msg = await self._save_message(conversation.id, "assistant", analysis.answer)

        return conversation, assistant_msg, analysis

    async def get_history(self, conversation_id: str) -> list[Message] | None:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            return None

        return conversation.messages

    async def _get_or_create_conversation(
        self, conversation_id: str | None, document_context: NDAContextSchema | None
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            result = await self.db.execute(stmt)
            conversation = result.scalar_one_or_none()
            if conversation:
                return conversation

        context_str = None
        if document_context:
            context_str = document_context.model_dump_json()

        conversation = Conversation(document_context=context_str)
        self.db.add(conversation)
        await self.db.flush()
        return conversation

    async def _build_message_history(self, conversation_id: str) -> list[dict]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(settings.max_conversation_turns)
        )
        result = await self.db.execute(stmt)
        messages = result.scalars().all()

        return [{"role": msg.role, "content": msg.content} for msg in messages]

    async def _call_llm(
        self,
        user_message: str,
        history: list[dict],
        context: NDAContextSchema | None,
    ) -> LegalAnalysisResponse:
        system_prompt = self._build_system_prompt(context)
        messages = [{"role": "system", "content": system_prompt}] + history + [
            {"role": "user", "content": user_message}
        ]

        try:
            response = await acompletion(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.3,
            )

            raw = response.choices[0].message.content
            parsed = json.loads(raw)
            return LegalAnalysisResponse(**parsed)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            return LegalAnalysisResponse(
                answer="Unable to parse AI response",
                confidence="low",
            )
        except (litellm.RateLimitError, litellm.APIError) as e:
            logger.error(f"LiteLLM API error: {e}")
            return LegalAnalysisResponse(
                answer="AI service temporarily unavailable",
                confidence="low",
                warnings=["Service error - please try again"],
            )

    async def _save_message(
        self, conversation_id: str, role: str, content: str
    ) -> Message:
        message = Message(conversation_id=conversation_id, role=role, content=content)
        self.db.add(message)
        await self.db.flush()
        return message

    def _build_system_prompt(self, context: NDAContextSchema | None) -> str:
        base_prompt = """You are a legal drafting assistant specializing in mutual NDAs.
You help users improve and refine NDA language. Be precise, use plain English,
and respond with valid JSON matching this schema:
{
  "answer": "direct answer to the question",
  "confidence": "high|medium|low",
  "suggested_clauses": ["clause suggestion 1", "clause suggestion 2"],
  "warnings": ["legal risk or consideration"],
  "follow_up_questions": ["clarifying question 1", "clarifying question 2"]
}"""

        if context:
            context_info = f"""

Current NDA context:
- Purpose: {context.purpose}
- Party 1: {context.party1_company}
- Party 2: {context.party2_company}
- Governing Law: {context.governing_law}
- Jurisdiction: {context.jurisdiction}"""
            return base_prompt + context_info

        return base_prompt
