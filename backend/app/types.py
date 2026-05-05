from dataclasses import dataclass


@dataclass
class ConversationOwner:
    """Represents the owner of a conversation (either a user or anonymous session)."""

    user_id: str | None
    session_id: str | None
