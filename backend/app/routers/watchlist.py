from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.transaction import WatchlistItem
from app.models.user import User
from app.schemas.schemas import WatchlistCreate, WatchlistOut

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=List[WatchlistOut])
def list_watchlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id).all()


@router.post("", response_model=WatchlistOut, status_code=201)
def add_watchlist_item(
    payload: WatchlistCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id, WatchlistItem.ticker == payload.ticker)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already on your watchlist")
    item = WatchlistItem(ticker=payload.ticker, user_id=user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def remove_watchlist_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id, WatchlistItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(item)
    db.commit()
