from pydantic import BaseModel, Field, ConfigDict
from typing import Literal
from datetime import datetime


class NDAContextSchema(BaseModel):
    purpose: str = Field(..., min_length=1, max_length=1000)
    governing_law: str = Field(..., min_length=1, max_length=200)
    jurisdiction: str = Field(..., min_length=1, max_length=200)
    party1_company: str = Field(..., min_length=1, max_length=200)
    party2_company: str = Field(..., min_length=1, max_length=200)


class ChatMessageRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(..., min_length=1, max_length=4000)
    document_context: NDAContextSchema | None = None


class LegalAnalysisResponse(BaseModel):
    answer: str = Field(description="Direct answer to the user's question")
    confidence: Literal["high", "medium", "low"]
    suggested_clauses: list[str] = Field(
        default_factory=list,
        description="Specific clause text suggestions",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Legal risks or considerations",
    )
    follow_up_questions: list[str] = Field(
        default_factory=list,
        max_length=3,
        description="Follow-up questions for clarification",
    )


class MessageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ChatMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    analysis: LegalAnalysisResponse
    created_at: datetime
