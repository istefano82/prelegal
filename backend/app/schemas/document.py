from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
import json

from app.schemas.chat import NDAContextSchema


class NdaSnapshotSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    title: str
    tags: list[str]
    fields: NDAContextSchema
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, obj):
        """Custom ORM loader that deserializes JSON fields."""
        if hasattr(obj, "__dict__"):
            raw = obj.__dict__
            return cls(
                id=raw.get("id"),
                conversation_id=raw.get("conversation_id"),
                title=raw.get("title", "Untitled NDA"),
                tags=json.loads(raw.get("tags", "[]")),
                fields=json.loads(raw.get("fields_json", "{}")),
                created_at=raw.get("created_at"),
                updated_at=raw.get("updated_at"),
            )
        return cls(**obj)


class DocumentListResponse(BaseModel):
    documents: list[NdaSnapshotSchema]
    total: int


class SaveSnapshotRequest(BaseModel):
    conversation_id: str
    nda_fields: NDAContextSchema
    title: str = "Untitled NDA"


class RenameDocumentRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class UpdateTagsRequest(BaseModel):
    tags: list[str] = Field(..., max_items=20)
