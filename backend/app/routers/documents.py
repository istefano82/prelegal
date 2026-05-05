from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_conversation_owner, ConversationOwner
from app.services import DocumentService
from app.schemas import (
    NdaSnapshotSchema,
    DocumentListResponse,
    SaveSnapshotRequest,
    RenameDocumentRequest,
    UpdateTagsRequest,
)
from app.exceptions import NotFoundError, OwnershipError

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    List all NDA documents for the current user/session.
    """
    service = DocumentService(db)
    documents = await service.list_documents(owner)
    return DocumentListResponse(documents=documents, total=len(documents))


@router.post("/", response_model=NdaSnapshotSchema, status_code=201)
async def save_document(
    body: SaveSnapshotRequest,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Save a new NDA document snapshot.
    """
    try:
        service = DocumentService(db)
        snapshot = await service.save_snapshot(
            owner,
            body.conversation_id,
            body.nda_fields,
            body.title,
        )
        await db.commit()
        return NdaSnapshotSchema.from_orm(snapshot)
    except (NotFoundError, OwnershipError) as e:
        status_code = 404 if isinstance(e, NotFoundError) else 403
        raise HTTPException(status_code=status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save document")


@router.get("/{snapshot_id}", response_model=NdaSnapshotSchema)
async def get_document(
    snapshot_id: str,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a specific NDA document.
    """
    try:
        service = DocumentService(db)
        snapshot = await service.get_document(owner, snapshot_id)
        return NdaSnapshotSchema.from_orm(snapshot)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=e.message)


@router.patch("/{snapshot_id}/rename", response_model=NdaSnapshotSchema)
async def rename_document(
    snapshot_id: str,
    body: RenameDocumentRequest,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Rename an NDA document.
    """
    try:
        service = DocumentService(db)
        snapshot = await service.rename_document(owner, snapshot_id, body.title)
        await db.commit()
        return NdaSnapshotSchema.from_orm(snapshot)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=e.message)


@router.patch("/{snapshot_id}/tags", response_model=NdaSnapshotSchema)
async def update_tags(
    snapshot_id: str,
    body: UpdateTagsRequest,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Update tags on an NDA document.
    """
    try:
        service = DocumentService(db)
        snapshot = await service.update_tags(owner, snapshot_id, body.tags)
        await db.commit()
        return NdaSnapshotSchema.from_orm(snapshot)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=e.message)


@router.delete("/{snapshot_id}", status_code=204)
async def delete_document(
    snapshot_id: str,
    owner: ConversationOwner = Depends(get_conversation_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an NDA document.
    """
    try:
        service = DocumentService(db)
        await service.delete_document(owner, snapshot_id)
        await db.commit()
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OwnershipError as e:
        raise HTTPException(status_code=403, detail=e.message)
