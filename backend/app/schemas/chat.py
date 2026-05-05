from pydantic import BaseModel, Field, ConfigDict
from typing import Literal
from datetime import datetime

NDAFieldKey = Literal[
    "purpose", "effectiveDate", "mndaTerm", "confidentialityTerm",
    "governingLaw", "jurisdiction",
    "party1Name", "party1Title", "party1Company",
    "party1Address", "party1Email", "party1Date",
    "party2Name", "party2Title", "party2Company",
    "party2Address", "party2Email", "party2Date",
]


class NDAContextSchema(BaseModel):
    purpose: str | None = Field(default=None, max_length=1000)
    effectiveDate: str | None = None
    mndaTerm: Literal["1year", "continues"] | None = None
    confidentialityTerm: Literal["1year", "perpetual"] | None = None
    governingLaw: str | None = Field(default=None, max_length=200)
    jurisdiction: str | None = Field(default=None, max_length=200)
    party1Name: str | None = Field(default=None, max_length=200)
    party1Title: str | None = Field(default=None, max_length=200)
    party1Company: str | None = Field(default=None, max_length=200)
    party1Address: str | None = Field(default=None, max_length=500)
    party1Email: str | None = Field(default=None, max_length=200)
    party1Date: str | None = None
    party2Name: str | None = Field(default=None, max_length=200)
    party2Title: str | None = Field(default=None, max_length=200)
    party2Company: str | None = Field(default=None, max_length=200)
    party2Address: str | None = Field(default=None, max_length=500)
    party2Email: str | None = Field(default=None, max_length=200)
    party2Date: str | None = None


class ChatMessageRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(..., min_length=1, max_length=4000)
    document_context: NDAContextSchema | None = None


class LegalAnalysisResponse(BaseModel):
    answer: str = Field(description="Direct answer to the user's question")
    confidence: Literal["high", "medium", "low"]
    field_updates: dict[str, str] = Field(
        default_factory=dict,
        description="NDA field name to value mappings extracted from user input",
    )
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
