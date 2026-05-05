import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from litellm import acompletion
from pydantic import ValidationError

from app.models import Conversation, Message
from app.schemas import LegalAnalysisResponse, NDAContextSchema
from app.config import settings
from app.exceptions import OwnershipError
from app.types import ConversationOwner

logger = logging.getLogger(__name__)

_VALID_NDA_FIELDS: frozenset[str] = frozenset({
    "purpose", "effectiveDate", "mndaTerm", "confidentialityTerm",
    "governingLaw", "jurisdiction",
    "party1Name", "party1Title", "party1Company",
    "party1Address", "party1Email", "party1Date",
    "party2Name", "party2Title", "party2Company",
    "party2Address", "party2Email", "party2Date",
})

_ENUM_CONSTRAINTS: dict[str, set[str]] = {
    "mndaTerm": {"1year", "continues"},
    "confidentialityTerm": {"1year", "perpetual"},
}


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = settings.litellm_model

    async def process_message(
        self,
        owner: "ConversationOwner",
        conversation_id: str | None,
        user_message: str,
        document_context: NDAContextSchema | None,
    ) -> tuple[Conversation, Message, LegalAnalysisResponse]:
        conversation = await self._get_or_create_conversation(owner, conversation_id, document_context)
        history = await self._build_message_history(conversation.id)
        analysis = await self._call_llm(user_message, history, document_context)

        user_msg = await self._save_message(conversation.id, "user", user_message)
        assistant_msg = await self._save_message(conversation.id, "assistant", analysis.answer)

        return conversation, assistant_msg, analysis

    async def get_history(self, owner: "ConversationOwner", conversation_id: str) -> list[Message] | None:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            return None

        # Enforce ownership
        if owner.user_id:
            if conversation.user_id != owner.user_id:
                raise OwnershipError("You do not have access to this conversation")
        else:
            if conversation.session_id != owner.session_id:
                raise OwnershipError("You do not have access to this conversation")

        return conversation.messages

    async def _get_or_create_conversation(
        self,
        owner: "ConversationOwner",
        conversation_id: str | None,
        document_context: NDAContextSchema | None,
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            result = await self.db.execute(stmt)
            conversation = result.scalar_one_or_none()
            if conversation:
                # Enforce ownership on existing conversation
                if owner.user_id:
                    if conversation.user_id != owner.user_id:
                        raise OwnershipError("You do not have access to this conversation")
                else:
                    if conversation.session_id != owner.session_id:
                        raise OwnershipError("You do not have access to this conversation")
                return conversation
            logger.warning(f"Conversation {conversation_id} not found, creating new conversation")

        context_str = None
        if document_context:
            context_str = document_context.model_dump_json()

        conversation = Conversation(
            user_id=owner.user_id,
            session_id=owner.session_id,
            document_context=context_str,
        )
        self.db.add(conversation)
        await self.db.flush()
        return conversation

    async def _build_message_history(self, conversation_id: str) -> list[dict]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(settings.max_conversation_turns)
        )
        result = await self.db.execute(stmt)
        messages = list(reversed(result.scalars().all()))

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

        response = await acompletion(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        raw = response.choices[0].message.content
        try:
            parsed = json.loads(raw)
            if "field_updates" in parsed and isinstance(parsed["field_updates"], dict):
                parsed["field_updates"] = self._sanitize_field_updates(parsed["field_updates"])
            return LegalAnalysisResponse(**parsed)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Failed to parse/validate LLM response: {e}. Raw: {raw!r}")
            return LegalAnalysisResponse(
                answer="Unable to parse AI response",
                confidence="low",
            )

    async def _save_message(
        self, conversation_id: str, role: str, content: str
    ) -> Message:
        message = Message(conversation_id=conversation_id, role=role, content=content)
        self.db.add(message)
        await self.db.flush()
        return message

    def _sanitize_field_updates(self, raw: dict) -> dict[str, str]:
        result = {}
        for key, value in raw.items():
            if key not in _VALID_NDA_FIELDS:
                logger.warning(f"Skipping invalid field key: {key}")
                continue
            if not isinstance(value, str):
                logger.warning(f"Skipping non-string value for field {key}: {type(value)}")
                continue
            if key in _ENUM_CONSTRAINTS and value not in _ENUM_CONSTRAINTS[key]:
                logger.warning(f"Invalid enum value {value!r} for field {key}, expected one of {_ENUM_CONSTRAINTS[key]}")
                continue
            result[key] = value
        return result

    def _build_system_prompt(self, context: NDAContextSchema | None) -> str:
        base_prompt = """You are an NDA creation assistant. Your job is to guide users through creating a Mutual NDA by asking for information one field at a time, in order.

CRITICAL: Always respond with VALID JSON matching this schema EXACTLY:
{
  "answer": "Your conversational response, friendly and clear",
  "confidence": "high|medium|low",
  "field_updates": {"fieldName": "value"},
  "follow_up_questions": ["next question if applicable"],
  "warnings": [],
  "suggested_clauses": []
}

FIELD COLLECTION ORDER (ask for each in sequence):
1. purpose - Why is this NDA needed?
2. effectiveDate - What date should it start? (YYYY-MM-DD format)
3. mndaTerm - Duration: must be exactly "1year" or "continues"
4. confidentialityTerm - How long confidentiality lasts: must be exactly "1year" or "perpetual"
5. governingLaw - Which state's laws?
6. jurisdiction - Which courts have jurisdiction?
7. party1Name - First party signatory name
8. party1Title - First party title
9. party1Company - First party company
10. party1Address - First party notice address
11. party1Email - First party email
12. party1Date - First party signing date (YYYY-MM-DD)
13. party2Name - Second party signatory name
14. party2Title - Second party title
15. party2Company - Second party company
16. party2Address - Second party notice address
17. party2Email - Second party email
18. party2Date - Second party signing date (YYYY-MM-DD)

RULES:
- When user provides a value for a field, include it in field_updates ONLY if it's substantial (not empty/null)
- Use the EXACT field name from the list above as the dict key in field_updates
- For mndaTerm: ONLY output "1year" or "continues"
- For confidentialityTerm: ONLY output "1year" or "perpetual"
- For dates: accept formats like "2025-01-15" or parse natural language but output YYYY-MM-DD
- Ask for fields in order; if a field is already provided in context, skip it and ask for the next missing one
- Keep responses conversational and brief
- ALWAYS end your "answer" with the next question for the next missing field — never leave the user without a clear next step
- After collecting all fields, confirm completion and ask if they'd like to review anything"""

        if context:
            def format_field(value: str | None) -> str:
                if value is None or value == "":
                    return "not yet provided"
                return str(value)

            context_fields = []
            fields_to_check = [
                ("purpose", context.purpose),
                ("effectiveDate", context.effectiveDate),
                ("mndaTerm", context.mndaTerm),
                ("confidentialityTerm", context.confidentialityTerm),
                ("governingLaw", context.governingLaw),
                ("jurisdiction", context.jurisdiction),
                ("party1Name", context.party1Name),
                ("party1Title", context.party1Title),
                ("party1Company", context.party1Company),
                ("party1Address", context.party1Address),
                ("party1Email", context.party1Email),
                ("party1Date", context.party1Date),
                ("party2Name", context.party2Name),
                ("party2Title", context.party2Title),
                ("party2Company", context.party2Company),
                ("party2Address", context.party2Address),
                ("party2Email", context.party2Email),
                ("party2Date", context.party2Date),
            ]

            for field_name, field_value in fields_to_check:
                context_fields.append(f"  {field_name}: {format_field(field_value)}")

            context_info = f"""

CURRENT NDA STATE:
{chr(10).join(context_fields)}"""
            return base_prompt + context_info

        return base_prompt
