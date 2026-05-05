from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from app.database import Base


class AnonymousSession(Base):
    __tablename__ = "anonymous_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    migrated_to_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=30),
    )

    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="Conversation.session_id",
    )

    def __repr__(self) -> str:
        return f"<AnonymousSession(id={self.id}, expires_at={self.expires_at})>"
