"""Item CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.models import Item
from app.schemas.item import ItemCreate, ItemUpdate


def create_item( session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    """Create a new item.

    Args:
        session: Database session
        item_in: Item creation data
        owner_id: ID of the item owner

    Returns:
        Created item
    """
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_item_by_id( session: Session, item_id: uuid.UUID) -> Item | None:
    """Get item by ID.

    Args:
        session: Database session
        item_id: Item UUID

    Returns:
        Item if found, None otherwise
    """
    return session.get(Item, item_id)


def get_items_by_owner( session: Session, owner_id: uuid.UUID, offset: int = 0, limit: int = 100) -> list[Item]:
    """Get items by owner with pagination.

    Args:
        session: Database session
        owner_id: Owner user UUID
        offset: Pagination offset
        limit: Maximum items to return

    Returns:
        List of items owned by the user
    """
    statement = select(Item).where(Item.owner_id == owner_id).offset(offset).limit(limit)
    return session.exec(statement).all()


def update_item( session: Session, db_item: Item, item_in: ItemUpdate) -> Item:
    """Update an existing item.

    Args:
        session: Database session
        db_item: Existing item to update
        item_in: Item update data

    Returns:
        Updated item
    """
    item_data = item_in.model_dump(exclude_unset=True)
    db_item.sqlmodel_update(item_data)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def delete_item( session: Session, item_id: uuid.UUID) -> bool:
    """Delete an item by ID.

    Args:
        session: Database session
        item_id: Item UUID

    Returns:
        True if deleted, False if not found
    """
    item = session.get(Item, item_id)
    if not item:
        return False
    session.delete(item)
    session.commit()
    return True
