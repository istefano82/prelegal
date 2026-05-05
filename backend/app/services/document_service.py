import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone

from app.models import NdaSnapshot, Conversation
from app.schemas import NDAContextSchema
from app.exceptions import NotFoundError, OwnershipError
from app.dependencies import ConversationOwner


class DocumentService:
    """Handles NDA document snapshot lifecycle and management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _assert_ownership(self, snapshot: NdaSnapshot, owner: ConversationOwner) -> None:
        """Verify that the owner has access to this snapshot."""
        if owner.user_id:
            if snapshot.user_id != owner.user_id:
                raise OwnershipError("You do not have access to this document")
        else:
            if snapshot.session_id != owner.session_id:
                raise OwnershipError("You do not have access to this document")

    async def save_snapshot(
        self,
        owner: ConversationOwner,
        conversation_id: str,
        nda_fields: NDAContextSchema,
        title: str = "Untitled NDA",
    ) -> NdaSnapshot:
        """
        Save an NDA snapshot for a conversation.
        Raises OwnershipError if conversation is not owned by this user.
        """
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise NotFoundError("Conversation", conversation_id)

        # Verify ownership
        if owner.user_id:
            if conversation.user_id != owner.user_id:
                raise OwnershipError("You do not have access to this conversation")
        else:
            if conversation.session_id != owner.session_id:
                raise OwnershipError("You do not have access to this conversation")

        snapshot = NdaSnapshot(
            conversation_id=conversation_id,
            user_id=owner.user_id,
            session_id=owner.session_id,
            title=title,
            tags="[]",
            fields_json=nda_fields.model_dump_json(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    async def list_documents(self, owner: ConversationOwner) -> list[NdaSnapshot]:
        """
        List all documents for the owner, ordered by most recent first.
        """
        if owner.user_id:
            stmt = select(NdaSnapshot).where(NdaSnapshot.user_id == owner.user_id)
        else:
            stmt = select(NdaSnapshot).where(NdaSnapshot.session_id == owner.session_id)

        stmt = stmt.order_by(NdaSnapshot.updated_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_document(self, owner: ConversationOwner, snapshot_id: str) -> NdaSnapshot:
        """
        Retrieve a document by ID with ownership verification.
        Raises NotFoundError if document doesn't exist.
        Raises OwnershipError if owner doesn't have access.
        """
        stmt = select(NdaSnapshot).where(NdaSnapshot.id == snapshot_id)
        result = await self.db.execute(stmt)
        snapshot = result.scalar_one_or_none()

        if not snapshot:
            raise NotFoundError("Document", snapshot_id)

        await self._assert_ownership(snapshot, owner)
        return snapshot

    async def rename_document(
        self, owner: ConversationOwner, snapshot_id: str, title: str
    ) -> NdaSnapshot:
        """
        Rename a document.
        Raises NotFoundError or OwnershipError as appropriate.
        """
        snapshot = await self.get_document(owner, snapshot_id)
        snapshot.title = title
        snapshot.updated_at = datetime.now(timezone.utc)
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    async def update_tags(
        self, owner: ConversationOwner, snapshot_id: str, tags: list[str]
    ) -> NdaSnapshot:
        """
        Update tags on a document.
        Raises NotFoundError or OwnershipError as appropriate.
        """
        snapshot = await self.get_document(owner, snapshot_id)
        snapshot.tags = json.dumps(tags)
        snapshot.updated_at = datetime.now(timezone.utc)
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    async def delete_document(self, owner: ConversationOwner, snapshot_id: str) -> None:
        """
        Delete a document.
        Raises NotFoundError or OwnershipError as appropriate.
        """
        snapshot = await self.get_document(owner, snapshot_id)
        await self.db.delete(snapshot)
        await self.db.flush()
