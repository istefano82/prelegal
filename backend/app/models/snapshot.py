from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from uuid import uuid4
from app.database import Base


class NdaSnapshot(Base):
    __tablename__ = "nda_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(
        String, ForeignKey("conversations.id"), nullable=False, index=True
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True, index=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("anonymous_sessions.id"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled NDA")
    tags: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    fields_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="snapshots",
        foreign_keys=[conversation_id],
    )
    owner: Mapped["User | None"] = relationship(
        back_populates="snapshots",
        foreign_keys=[user_id],
    )

    def __repr__(self) -> str:
        return f"<NdaSnapshot(id={self.id}, title={self.title}, created_at={self.created_at})>"
